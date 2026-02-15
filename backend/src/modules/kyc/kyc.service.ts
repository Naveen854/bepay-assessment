import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../database/entities';
import { MestaService } from '../../mesta/mesta.service';
import { CreateSenderDto, UploadDocumentDto } from './dto/kyc.dto';

@Injectable()
export class KycService {
    private readonly logger = new Logger(KycService.name);

    constructor(
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>,
        private readonly mestaService: MestaService,
    ) { }

    /**
     * Create a Sender in Mesta and link it to the local Organization.
     */
    async createSender(orgId: string, userId: string, dto: CreateSenderDto) {
        const org = await this.getOrgForUser(orgId, userId);

        if (org.mestaSenderId) {
            throw new BadRequestException(
                'KYC sender already created for this organization',
            );
        }

        // Call Mesta API to create sender
        // Call Mesta API to create sender
        const sender = await this.mestaService.createSender({
            type: dto.type,
            fullName: dto.fullName,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phone: dto.phoneNumber,
            addresses: [
                {
                    street: dto.address.street,
                    city: dto.address.city,
                    state: dto.address.state,
                    country: dto.address.country,
                    postalCode: dto.address.postalCode,
                },
            ],
            // New fields
            identificationNumber: dto.identificationNumber,
            registrationDate: dto.registrationDate,
            businessType: dto.businessType,
            nationality: dto.nationality,
            dateOfBirth: dto.dateOfBirth,
            identificationDocument: dto.identificationDocument
                ? {
                    type: dto.identificationDocument.type,
                    number: dto.identificationDocument.number,
                    issuingCountry: dto.identificationDocument.issuingCountry,
                }
                : undefined,
        });

        // Save Mesta sender ID to local org
        org.mestaSenderId = sender.id;
        org.kycStatus = 'pending';
        await this.orgRepo.save(org);

        this.logger.log(`Created Mesta sender ${sender.id} for org ${orgId}`);
        return { sender, organization: org };
    }

    /**
     * Get current KYC status for an organization.
     */
    async getKycStatus(orgId: string, userId: string) {
        const org = await this.getOrgForUser(orgId, userId);

        if (!org.mestaSenderId) {
            return {
                status: 'not_started',
                organization: org,
                sender: null,
            };
        }

        // Fetch latest status from Mesta
        const sender = await this.mestaService.getSender(org.mestaSenderId);

        // Sync status locally
        const newStatus = this.mapMestaStatus(sender.status || sender.verification_status);
        if (org.kycStatus !== newStatus) {
            org.kycStatus = newStatus;
            await this.orgRepo.save(org);
        }

        return {
            status: org.kycStatus,
            organization: org,
            sender,
        };
    }

    /**
     * Upload a KYC document to Mesta for the org's sender.
     */
    async uploadDocument(orgId: string, userId: string, dto: UploadDocumentDto) {
        const org = await this.getOrgForUser(orgId, userId);

        if (!org.mestaSenderId) {
            throw new BadRequestException(
                'Create a KYC sender first before uploading documents',
            );
        }

        const document = await this.mestaService.uploadDocument(
            org.mestaSenderId,
            {
                type: dto.type,
                documentUrl: dto.documentUrl,
            },
        );

        this.logger.log(
            `Uploaded document ${document.id} for sender ${org.mestaSenderId}`,
        );
        return document;
    }

    /**
     * Submit sender for verification in Mesta.
     */
    async submitForVerification(orgId: string, userId: string) {
        const org = await this.getOrgForUser(orgId, userId);

        if (!org.mestaSenderId) {
            throw new BadRequestException('Create a KYC sender first');
        }

        await this.mestaService.verifySender(org.mestaSenderId);

        org.kycStatus = 'under_review';
        await this.orgRepo.save(org);

        this.logger.log(`Submitted sender ${org.mestaSenderId} for verification`);
        return { status: 'under_review', message: 'KYC submitted for review' };
    }

    // ─── Helpers ───────────────────────────────────
    private async getOrgForUser(orgId: string, userId: string): Promise<Organization> {
        const org = await this.orgRepo.findOne({
            where: { id: orgId, user: { id: userId } },
        });
        if (!org) {
            throw new NotFoundException('Organization not found');
        }
        return org;
    }

    private mapMestaStatus(mestaStatus: string): string {
        const statusMap: Record<string, string> = {
            created: 'pending',
            pending: 'pending',
            under_review: 'under_review',
            verified: 'verified',
            approved: 'verified',
            rejected: 'rejected',
            failed: 'rejected',
        };
        return statusMap[mestaStatus] || 'pending';
    }
}
