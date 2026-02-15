import { Test, TestingModule } from '@nestjs/testing';
import { BeneficiaryService } from './beneficiary.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Beneficiary, Organization } from '../../database/entities';
import { MestaService } from '../../mesta/mesta.service';

describe('BeneficiaryService', () => {
    let service: BeneficiaryService;
    let benRepo: any;
    let orgRepo: any;
    let mestaService: any;

    const mockBenRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
    };

    const mockOrgRepo = {
        findOne: jest.fn(),
    };

    const mockMestaService = {
        createBeneficiary: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BeneficiaryService,
                { provide: getRepositoryToken(Beneficiary), useValue: mockBenRepo },
                { provide: getRepositoryToken(Organization), useValue: mockOrgRepo },
                { provide: MestaService, useValue: mockMestaService },
            ],
        }).compile();

        service = module.get<BeneficiaryService>(BeneficiaryService);
        benRepo = module.get(getRepositoryToken(Beneficiary));
        orgRepo = module.get(getRepositoryToken(Organization));
        mestaService = module.get(MestaService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a beneficiary and map nested address correctly', async () => {
            const dto = {
                organizationId: 'org-1',
                senderId: 'sender-1',
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
                paymentType: 'bank_account',
                bankAccountName: 'John Doe',
                bankAccountNumber: '123456789',
                bankName: 'Bank of America',
                bankCode: 'BOFA',
            };

            const org = { id: 'org-1', mestaSenderId: 'sender-1', kycStatus: 'verified' };
            const mestaResponse = { id: 'mesta-ben-1', status: 'active' };

            mockOrgRepo.findOne.mockResolvedValue(org);
            mockMestaService.createBeneficiary.mockResolvedValue(mestaResponse);
            // Include mestaBeneficiaryId in the object returned by create
            mockBenRepo.create.mockImplementation((data) => ({ ...data, id: 'ben-1' }));
            mockBenRepo.save.mockImplementation((data) => Promise.resolve(data));

            const result = await service.create('user-1', dto);

            expect(mockMestaService.createBeneficiary).toHaveBeenCalledWith(expect.objectContaining({
                address: dto.address, // Should pass nested address to Mesta
            }));

            expect(mockBenRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                address: '123 Main St', // Should map to flat address for DB
                city: 'New York',
                zipCode: '10001',
                mestaBeneficiaryId: 'mesta-ben-1',
            }));

            expect(result).toHaveProperty('id', 'ben-1');
        });
    });
});
