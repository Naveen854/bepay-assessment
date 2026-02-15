import { Test, TestingModule } from '@nestjs/testing';
import { PayoutService } from './payout.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Payout, Organization, Beneficiary, Transaction } from '../../database/entities';
import { MestaService } from '../../mesta/mesta.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PayoutService', () => {
    let service: PayoutService;
    let payoutRepo: any;
    let orgRepo: any;
    let beneficiaryRepo: any;
    let txRepo: any;
    let mestaService: any;

    const mockPayoutRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
    };
    const mockOrgRepo = { findOne: jest.fn() };
    const mockBeneficiaryRepo = { findOne: jest.fn() };
    const mockTxRepo = { create: jest.fn(), save: jest.fn() };
    const mockMestaService = {
        createQuote: jest.fn(),
        createOrder: jest.fn(),
        getOrder: jest.fn(),
        cancelOrder: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PayoutService,
                { provide: getRepositoryToken(Payout), useValue: mockPayoutRepo },
                { provide: getRepositoryToken(Organization), useValue: mockOrgRepo },
                { provide: getRepositoryToken(Beneficiary), useValue: mockBeneficiaryRepo },
                { provide: getRepositoryToken(Transaction), useValue: mockTxRepo },
                { provide: MestaService, useValue: mockMestaService },
            ],
        }).compile();

        service = module.get<PayoutService>(PayoutService);
        payoutRepo = module.get(getRepositoryToken(Payout));
        orgRepo = module.get(getRepositoryToken(Organization));
        beneficiaryRepo = module.get(getRepositoryToken(Beneficiary));
        txRepo = module.get(getRepositoryToken(Transaction));
        mestaService = module.get(MestaService);

        jest.clearAllMocks();
    });

    describe('createQuote', () => {
        it('should create a quote', async () => {
            const org = { id: 'org-1', kycStatus: 'verified', mestaSenderId: 'sender-1' };
            const ben = { id: 'ben-1', mestaBeneficiaryId: 'mesta-ben-1' };
            const quote = { id: 'quote-1', rate: 1.5, fees: 10 };

            mockOrgRepo.findOne.mockResolvedValue(org);
            mockBeneficiaryRepo.findOne.mockResolvedValue(ben);
            mockMestaService.createQuote.mockResolvedValue(quote);
            mockPayoutRepo.create.mockReturnValue({ id: 'payout-1' });
            mockPayoutRepo.save.mockResolvedValue({ id: 'payout-1' });

            const result = await service.createQuote('user-1', {
                organizationId: 'org-1',
                beneficiaryId: 'ben-1',
                amount: 100,
                sourceCurrency: 'USD',
                targetCurrency: 'EUR',
            });

            expect(mockMestaService.createQuote).toHaveBeenCalledWith({
                sender_id: 'sender-1',
                beneficiary_id: 'mesta-ben-1',
                amount: 100,
                source_currency: 'USD',
                target_currency: 'EUR',
            });
            expect(result.payout).toBeDefined();
        });

        it('should throw if org not verified', async () => {
            const org = { id: 'org-1', kycStatus: 'pending' };
            mockOrgRepo.findOne.mockResolvedValue(org);
            const ben = { id: 'ben-1' };
            mockBeneficiaryRepo.findOne.mockResolvedValue(ben);

            await expect(service.createQuote('user-1', { organizationId: 'org-1', beneficiaryId: 'ben-1' } as any))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('createOrder', () => {
        it('should create an order and transaction', async () => {
            const org = { id: 'org-1' };
            const payout = { id: 'payout-1', amount: 100, sourceCurrency: 'USD', beneficiary: { firstName: 'John' }, status: 'quoted' };
            const order = { id: 'order-1', transaction_id: 'tx-mesta' };

            mockOrgRepo.findOne.mockResolvedValue(org);
            mockPayoutRepo.findOne.mockResolvedValue(payout);
            mockMestaService.createOrder.mockResolvedValue(order);
            mockTxRepo.create.mockReturnValue({});

            const result = await service.createOrder('user-1', { organizationId: 'org-1', quoteId: 'quote-1' });

            expect(mockMestaService.createOrder).toHaveBeenCalledWith({
                quote_id: 'quote-1',
                purpose: expect.any(String),
            });
            expect(payout.status).toBe('ordered');
            expect(mockTxRepo.save).toHaveBeenCalled();
        });
    });
});
