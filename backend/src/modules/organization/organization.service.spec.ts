import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organization } from '../../database/entities/organization.entity';
import { AuthService } from '../auth/auth.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

describe('OrganizationService', () => {
    let service: OrganizationService;
    let repo: any;
    let authService: any;

    const mockRepo = {
        count: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
    };

    const mockAuthService = {
        updateOnboardingStatus: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrganizationService,
                { provide: getRepositoryToken(Organization), useValue: mockRepo },
                { provide: AuthService, useValue: mockAuthService },
            ],
        }).compile();

        service = module.get<OrganizationService>(OrganizationService);
        repo = module.get(getRepositoryToken(Organization));
        authService = module.get(AuthService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create an organization', async () => {
            const userId = 'user-1';
            const dto = { name: 'Test Org' };
            mockRepo.count.mockResolvedValue(0);
            mockRepo.create.mockReturnValue({ id: 'org-1', ...dto });
            mockRepo.save.mockResolvedValue({ id: 'org-1', ...dto });

            const result = await service.create(userId, dto as any);

            expect(result).toEqual({ id: 'org-1', name: 'Test Org' });
            expect(mockAuthService.updateOnboardingStatus).toHaveBeenCalledWith(userId, 'completed');
        });

        it('should throw if user already has an org', async () => {
            mockRepo.count.mockResolvedValue(1);
            await expect(service.create('user-1', { name: 'Test' } as any)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findOne', () => {
        it('should return org if user owns it', async () => {
            const org = { id: 'org-1', userId: 'user-1' };
            mockRepo.findOne.mockResolvedValue(org);

            const result = await service.findOne('org-1', 'user-1');
            expect(result).toEqual(org);
        });

        it('should throw Forbidden if user does not own it', async () => {
            const org = { id: 'org-1', userId: 'user-2' };
            mockRepo.findOne.mockResolvedValue(org);

            await expect(service.findOne('org-1', 'user-1')).rejects.toThrow(ForbiddenException);
        });
    });
});
