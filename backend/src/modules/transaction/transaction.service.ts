import {
    Injectable,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from '../../database/entities';
import { MestaService } from '../../mesta/mesta.service';

@Injectable()
export class TransactionService {
    private readonly logger = new Logger(TransactionService.name);

    constructor(
        @InjectRepository(Transaction)
        private readonly txRepo: Repository<Transaction>,
        private readonly mestaService: MestaService,
    ) { }

    async findAll(userId: string, filters?: {
        orgId?: string;
        type?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }) {
        const where: any = { organization: { user: { id: userId } } };
        if (filters?.orgId) where.organization = { ...where.organization, id: filters.orgId };
        if (filters?.type) where.type = filters.type;
        if (filters?.status) where.status = filters.status;
        if (filters?.startDate && filters?.endDate) {
            where.createdAt = Between(new Date(filters.startDate), new Date(filters.endDate));
        }

        const page = filters?.page || 1;
        const limit = filters?.limit || 20;

        const [items, total] = await this.txRepo.findAndCount({
            where,
            relations: ['organization'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: string, userId: string) {
        return this.txRepo.findOne({
            where: { id, organization: { user: { id: userId } } },
            relations: ['organization'],
        });
    }

    /**
     * Fetch merchant transactions from Mesta and sync locally
     */
    /**
     * Fetch merchant transactions from Mesta and sync locally
     */
    async syncMestaTransactions(userId: string, orgId: string) {
        const mestaTransactions = await this.mestaService.getMerchantTransactions();
        let synced = 0;
        let updated = 0;

        if (Array.isArray(mestaTransactions?.data || mestaTransactions)) {
            const txList = mestaTransactions?.data || mestaTransactions;
            for (const mtx of txList) {
                const existing = await this.txRepo.findOne({
                    where: { mestaTransactionId: mtx.id },
                });

                if (existing) {
                    if (existing.status !== mtx.status) {
                        existing.status = mtx.status;
                        await this.txRepo.save(existing);
                        updated++;
                    }
                } else {
                    await this.txRepo.save(
                        this.txRepo.create({
                            organizationId: orgId,
                            mestaTransactionId: mtx.id,
                            type: mtx.type || 'payout',
                            amount: mtx.amount,
                            currency: mtx.currency,
                            status: mtx.status,
                            reference: mtx.reference,
                            metadata: mtx,
                        }),
                    );
                    synced++;
                }
            }
        }

        this.logger.log(`Synced ${synced} new transactions, updated ${updated} existing from Mesta`);
        return { synced, updated };
    }

    /**
     * Get transaction summary for dashboard
     */
    async getSummary(userId: string) {
        const result = await this.txRepo
            .createQueryBuilder('tx')
            .innerJoin('tx.organization', 'org')
            .innerJoin('org.user', 'user')
            .where('user.id = :userId', { userId })
            .select([
                'tx.status as status',
                'COUNT(*) as count',
                'SUM(tx.amount) as total_amount',
            ])
            .groupBy('tx.status')
            .getRawMany();

        return result;
    }

    /**
     * Export transactions as CSV string
     */
    async exportTransactionsCsv(userId: string, filters?: {
        orgId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<string> {
        const where: any = { organization: { user: { id: userId } } };
        if (filters?.orgId) where.organization = { ...where.organization, id: filters.orgId };
        if (filters?.startDate && filters?.endDate) {
            where.createdAt = Between(new Date(filters.startDate), new Date(filters.endDate));
        }

        const transactions = await this.txRepo.find({
            where,
            relations: ['organization'],
            order: { createdAt: 'DESC' },
        });

        // Format as CSV
        const header = 'ID,Date,Type,Amount,Currency,Status,Reference,Mesta ID\n';
        const rows = transactions.map((tx) =>
            `"${tx.id}","${tx.createdAt.toISOString()}","${tx.type}",${tx.amount},"${tx.currency}","${tx.status}","${tx.reference || ''}","${tx.mestaTransactionId || ''}"`
        ).join('\n');

        return header + rows;
    }
}
