import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
// ... imports
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../database/entities/organization.entity';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { AuthService } from '../auth/auth.service'; // Assuming AuthService is in auth module

@Injectable()
export class OrganizationService {
    constructor(
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>,
        private readonly authService: AuthService,
    ) { }

    async create(userId: string, dto: CreateOrganizationDto) {
        const existingCount = await this.orgRepo.count({ where: { userId } });
        if (existingCount > 0) {
            throw new BadRequestException('User can only create one organization');
        }

        const org = this.orgRepo.create({
            ...dto,
            userId,
        });
        const savedOrg = await this.orgRepo.save(org);

        // Update user onboarding status
        await this.authService.updateOnboardingStatus(userId, 'completed');

        return savedOrg;
    }

    async findByUser(userId: string) {
        return this.orgRepo.find({ where: { userId } });
    }

    async findOne(orgId: string, userId: string) {
        const org = await this.orgRepo.findOne({ where: { id: orgId } });
        if (!org) {
            throw new NotFoundException('Organization not found');
        }
        if (org.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }
        return org;
    }

    async update(orgId: string, userId: string, dto: UpdateOrganizationDto) {
        const org = await this.findOne(orgId, userId);
        Object.assign(org, dto);
        return this.orgRepo.save(org);
    }
}
