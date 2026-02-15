import { Test, TestingModule } from '@nestjs/testing';
import { KycService } from './kyc.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organization } from '../../database/entities';
import { MestaService } from '../../mesta/mesta.service';
import { BadRequestException } from '@nestjs/common';
import { SenderType } from './dto/kyc.dto';

describe('KycService', () => {
    let service: KycService;
    let orgRepo: any;
    let mestaService: any;

    const mockOrgRepo = {
        findOne: jest.fn(),
        save: jest.fn(),
    };

    const mockMestaService = {
        createSender: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                KycService,
                { provide: getRepositoryToken(Organization), useValue: mockOrgRepo },
                { provide: MestaService, useValue: mockMestaService },
            ],
        }).compile();

        service = module.get<KycService>(KycService);
        orgRepo = module.get(getRepositoryToken(Organization));
        mestaService = module.get(MestaService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createSender', () => {
        it('should create sender and update organization status', async () => {
            const userId = 'user-1';
            const orgId = 'org-1';
            const dto = {
                type: SenderType.BUSINESS,
                fullName: 'John Doe LLC',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+1234567890',
                address: {
                    street: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    country: 'US',
                    postalCode: '10001',
                },
                businessType: 'llc',
                identificationNumber: '12-3456789',
                registrationDate: '2020-01-01',
            };

            const org = { id: orgId, kycStatus: 'not_started' };
            const mestaResponse = { id: 'mesta-sender-1', status: 'pending' };

            mockOrgRepo.findOne.mockResolvedValue(org);
            mockMestaService.createSender.mockResolvedValue(mestaResponse);
            // Return updated org (save returns the entity)
            mockOrgRepo.save.mockImplementation((ent) => Promise.resolve(ent));

            const result = await service.createSender(orgId, userId, dto as any);

            expect(mockOrgRepo.findOne).toHaveBeenCalledWith({
                where: { id: orgId, user: { id: userId } },
            });

            expect(mockMestaService.createSender).toHaveBeenCalledWith(expect.objectContaining({
                email: dto.email,
                businessType: dto.businessType,
                addresses: expect.arrayContaining([
                    expect.objectContaining({
                        street: dto.address.street,
                        city: dto.address.city,
                    })
                ])
            }));

            expect(mockOrgRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                id: orgId,
                kycStatus: 'pending',
                mestaSenderId: 'mesta-sender-1',
            }));

            expect(result.sender).toEqual(mestaResponse);
            expect(result.organization.kycStatus).toBe('pending');
        });
    });
});
