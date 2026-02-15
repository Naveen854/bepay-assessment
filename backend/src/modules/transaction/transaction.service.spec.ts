import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from '../../database/entities';
import { MestaService } from '../../mesta/mesta.service';

describe('TransactionService', () => {
    let service: TransactionService;
    let repo: any;
    let mestaService: any;

    const mockRepo = {
        findAndCount: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            innerJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([]),
        })),
    };

    const mockMestaService = {
        getMerchantTransactions: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionService,
                { provide: getRepositoryToken(Transaction), useValue: mockRepo },
                { provide: MestaService, useValue: mockMestaService },
            ],
        }).compile();

        service = module.get<TransactionService>(TransactionService);
        repo = module.get(getRepositoryToken(Transaction));
        mestaService = module.get(MestaService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return paginated transactions', async () => {
            const userId = 'user-1';
            const mockTx = [{ id: 'tx-1' }];
            mockRepo.findAndCount.mockResolvedValue([mockTx, 1]);

            const result = await service.findAll(userId, { page: 1, limit: 10 });

            expect(mockRepo.findAndCount).toHaveBeenCalled();
            expect(result).toEqual({
                items: mockTx,
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            });
        });
    });

    describe('syncMestaTransactions', () => {
        it('should sync new transactions from Mesta', async () => {
            const userId = 'user-1';
            const orgId = 'org-1';
            const mestaTxs = [
                { id: 'mesta-tx-1', status: 'completed', amount: 100, currency: 'USD' },
            ];

            mockMestaService.getMerchantTransactions.mockResolvedValue({ data: mestaTxs });
            mockRepo.findOne.mockResolvedValue(null); // No existing tx
            mockRepo.create.mockReturnValue({ id: 'new-tx' });
            mockRepo.save.mockResolvedValue({ id: 'new-tx' });

            const result = await service.syncMestaTransactions(userId, orgId);

            expect(mockMestaService.getMerchantTransactions).toHaveBeenCalled();
            expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                mestaTransactionId: 'mesta-tx-1',
                organizationId: orgId,
            }));
            expect(result.synced).toBe(1);
        });

        it('should update existing transactions if status changed', async () => {
            const userId = 'user-1';
            const orgId = 'org-1';
            const mestaTxs = [
                { id: 'mesta-tx-1', status: 'completed' },
            ];

            mockMestaService.getMerchantTransactions.mockResolvedValue({ data: mestaTxs });
            mockRepo.findOne.mockResolvedValue({
                id: 'local-tx-1',
                mestaTransactionId: 'mesta-tx-1',
                status: 'pending',
            });
            mockRepo.save.mockImplementation((tx) => Promise.resolve(tx));

            const result = await service.syncMestaTransactions(userId, orgId);

            expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                status: 'completed',
            }));
            expect(result.updated).toBe(1);
        });
    });
});
