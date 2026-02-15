import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payout, Organization, Beneficiary, Transaction } from '../../database/entities';
import { MestaService } from '../../mesta/mesta.service';
import { CreateQuoteDto, CreateOrderDto } from './dto/payout.dto';

@Injectable()
export class PayoutService {
    private readonly logger = new Logger(PayoutService.name);

    constructor(
        @InjectRepository(Payout)
        private readonly payoutRepo: Repository<Payout>,
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>,
        @InjectRepository(Beneficiary)
        private readonly beneficiaryRepo: Repository<Beneficiary>,
        @InjectRepository(Transaction)
        private readonly transactionRepo: Repository<Transaction>,
        private readonly mestaService: MestaService,
    ) { }

    async createQuote(userId: string, dto: CreateQuoteDto) {
        const org = await this.getOrgForUser(dto.organizationId, userId);
        const beneficiary = await this.beneficiaryRepo.findOne({
            where: { id: dto.beneficiaryId, organization: { id: org.id } },
        });
        if (!beneficiary) throw new NotFoundException('Beneficiary not found');
        if (org.kycStatus !== 'verified') throw new BadRequestException('Organization must be verified before creating payouts');
        if (!beneficiary.mestaBeneficiaryId) throw new BadRequestException('Beneficiary not linked to Mesta');

        const quote = await this.mestaService.createQuote({
            sender_id: org.mestaSenderId,
            beneficiary_id: beneficiary.mestaBeneficiaryId,
            amount: dto.amount,
            source_currency: dto.sourceCurrency,
            target_currency: dto.targetCurrency,
        });

        // Save draft payout locally
        const payout = this.payoutRepo.create({
            organizationId: org.id,
            beneficiaryId: beneficiary.id,
            mestaQuoteId: quote.id,
            amount: dto.amount,
            sourceCurrency: dto.sourceCurrency,
            targetCurrency: dto.targetCurrency,
            exchangeRate: quote.exchange_rate || quote.rate,
            fee: quote.fee || quote.fees,
            status: 'quoted',
        });

        const saved = await this.payoutRepo.save(payout);
        this.logger.log(`Quote created: ${quote.id} -> payout ${saved.id}`);
        return { payout: saved, quote };
    }

    async createOrder(userId: string, dto: CreateOrderDto) {
        const org = await this.getOrgForUser(dto.organizationId, userId);

        // Find the payout by quote ID
        const payout = await this.payoutRepo.findOne({
            where: { mestaQuoteId: dto.quoteId, organization: { id: org.id } },
            relations: ['beneficiary'],
        });
        if (!payout) throw new NotFoundException('Payout quote not found');

        const order = await this.mestaService.createOrder({
            quote_id: dto.quoteId,
            purpose: dto.purpose || 'Payment for services',
        });

        payout.mestaOrderId = order.id;
        payout.status = 'ordered';
        await this.payoutRepo.save(payout);

        // Record transaction
        const transaction = this.transactionRepo.create({
            organizationId: org.id,
            payoutId: payout.id,
            mestaTransactionId: order.transaction_id || order.id,
            type: 'payout',
            amount: payout.amount,
            currency: payout.sourceCurrency,
            status: 'processing',
            metadata: { orderId: order.id, beneficiary: payout.beneficiary?.firstName },
        });
        await this.transactionRepo.save(transaction);

        this.logger.log(`Order created: ${order.id} for payout ${payout.id}`);
        return { payout, order };
    }

    async getOrder(userId: string, payoutId: string) {
        const payout = await this.payoutRepo.findOne({
            where: { id: payoutId, organization: { user: { id: userId } } },
            relations: ['beneficiary', 'organization'],
        });
        if (!payout) throw new NotFoundException('Payout not found');

        // Fetch latest from Mesta if there's an order
        let mestaOrder: any = null;
        if (payout.mestaOrderId) {
            mestaOrder = await this.mestaService.getOrder(payout.mestaOrderId);
            // Sync status
            const statusMap: Record<string, string> = {
                created: 'ordered',
                processing: 'processing',
                completed: 'completed',
                failed: 'failed',
                cancelled: 'cancelled',
            };
            const newStatus = statusMap[mestaOrder?.status] || payout.status;
            if (payout.status !== newStatus) {
                payout.status = newStatus;
                await this.payoutRepo.save(payout);
            }
        }

        return { payout, order: mestaOrder };
    }

    async cancelOrder(userId: string, payoutId: string) {
        const payout = await this.payoutRepo.findOne({
            where: { id: payoutId, organization: { user: { id: userId } } },
        });
        if (!payout) throw new NotFoundException('Payout not found');
        if (!payout.mestaOrderId) throw new BadRequestException('No order to cancel');

        await this.mestaService.cancelOrder(payout.mestaOrderId);
        payout.status = 'cancelled';
        return this.payoutRepo.save(payout);
    }

    async listPayouts(userId: string, orgId?: string) {
        const where: any = { organization: { user: { id: userId } } };
        if (orgId) where.organization.id = orgId;

        return this.payoutRepo.find({
            where,
            relations: ['beneficiary'],
            order: { createdAt: 'DESC' },
        });
    }

    private async getOrgForUser(orgId: string, userId: string) {
        const org = await this.orgRepo.findOne({
            where: { id: orgId, user: { id: userId } },
        });
        if (!org) throw new NotFoundException('Organization not found');
        return org;
    }
}
