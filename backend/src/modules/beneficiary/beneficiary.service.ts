import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beneficiary, Organization } from '../../database/entities';
import { MestaService } from '../../mesta/mesta.service';
import { CreateBeneficiaryDto, UpdateBeneficiaryDto } from './dto/beneficiary.dto';

@Injectable()
export class BeneficiaryService {
    private readonly logger = new Logger(BeneficiaryService.name);

    constructor(
        @InjectRepository(Beneficiary)
        private readonly beneficiaryRepo: Repository<Beneficiary>,
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>,
        private readonly mestaService: MestaService,
    ) { }

    async create(userId: string, dto: CreateBeneficiaryDto) {
        const org = await this.getOrgForUser(dto.organizationId, userId);

        if (org.kycStatus !== 'verified') {
            throw new BadRequestException('Organization must be verified before adding beneficiaries');
        }

        // Create in Mesta
        // MestaService now expects CreateBeneficiaryDto structure (nested address)
        const mestaBeneficiary = await this.mestaService.createBeneficiary({
            ...dto,
            senderId: org.mestaSenderId,
        });

        // Save locally - Entity expects flat structure
        const beneficiary = this.beneficiaryRepo.create({
            organization: org,
            mestaBeneficiaryId: mestaBeneficiary.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phoneNumber: dto.phoneNumber,
            paymentType: dto.paymentType || 'bank_account', // Default if missing
            // Map nested address to flat entity fields
            address: dto.address.street,
            city: dto.address.city,
            country: dto.address.country,
            zipCode: dto.address.postalCode,
            // Banking details
            bankAccountName: dto.bankAccountName,
            bankAccountNumber: dto.bankAccountNumber,
            bankCode: dto.bankCode,
            bankName: dto.bankName,
            accountType: dto.accountType,
            status: 'pending',
        });

        const saved = await this.beneficiaryRepo.save(beneficiary);
        this.logger.log(`Created beneficiary ${saved.id} (Mesta: ${mestaBeneficiary.id})`);
        return saved;
    }

    async findAll(userId: string, orgId?: string) {
        const where: any = {
            organization: { user: { id: userId } },
        };
        if (orgId) {
            where.organization.id = orgId;
        }

        return this.beneficiaryRepo.find({
            where,
            relations: ['organization'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string, userId: string) {
        const beneficiary = await this.beneficiaryRepo.findOne({
            where: { id, organization: { user: { id: userId } } },
            relations: ['organization'],
        });
        if (!beneficiary) {
            throw new NotFoundException('Beneficiary not found');
        }
        return beneficiary;
    }

    async update(id: string, userId: string, dto: UpdateBeneficiaryDto) {
        const beneficiary = await this.findOne(id, userId);

        // Update in Mesta if there's a Mesta ID
        if (beneficiary.mestaBeneficiaryId) {
            const mestaPayload: Record<string, any> = {};
            if (dto.firstName) mestaPayload.first_name = dto.firstName;
            if (dto.lastName) mestaPayload.last_name = dto.lastName;
            if (dto.email) mestaPayload.email = dto.email;
            if (dto.phoneNumber) mestaPayload.phone_number = dto.phoneNumber;
            if (dto.country) mestaPayload.country = dto.country;
            if (dto.city) mestaPayload.city = dto.city;
            if (dto.address) mestaPayload.address = dto.address;
            if (dto.zipCode) mestaPayload.zip_code = dto.zipCode;
            if (dto.bankAccountName) mestaPayload.bank_account_name = dto.bankAccountName;
            if (dto.bankAccountNumber) mestaPayload.bank_account_number = dto.bankAccountNumber;

            if (Object.keys(mestaPayload).length > 0) {
                await this.mestaService.updateBeneficiary(beneficiary.mestaBeneficiaryId, mestaPayload);
            }
        }

        // Update locally
        Object.assign(beneficiary, dto);
        return this.beneficiaryRepo.save(beneficiary);
    }

    async remove(id: string, userId: string) {
        const beneficiary = await this.findOne(id, userId);

        if (beneficiary.mestaBeneficiaryId) {
            try {
                await this.mestaService.deleteBeneficiary(beneficiary.mestaBeneficiaryId);
            } catch (err) {
                this.logger.warn(`Failed to delete Mesta beneficiary: ${err}`);
            }
        }

        await this.beneficiaryRepo.remove(beneficiary);
        return { message: 'Beneficiary deleted' };
    }

    async verify(id: string, userId: string) {
        const beneficiary = await this.findOne(id, userId);

        if (!beneficiary.mestaBeneficiaryId) {
            throw new BadRequestException('No Mesta beneficiary linked');
        }

        await this.mestaService.verifyBeneficiary(beneficiary.mestaBeneficiaryId);
        beneficiary.status = 'verifying';
        return this.beneficiaryRepo.save(beneficiary);
    }

    // ─── Helpers ───────────────────────────────────
    private async getOrgForUser(orgId: string, userId: string) {
        const org = await this.orgRepo.findOne({
            where: { id: orgId, user: { id: userId } },
        });
        if (!org) {
            throw new NotFoundException('Organization not found');
        }
        return org;
    }
}
