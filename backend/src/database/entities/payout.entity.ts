import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Beneficiary } from './beneficiary.entity';

@Entity('payouts')
export class Payout {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    organizationId: string;

    @Column()
    beneficiaryId: string;

    @Column({ nullable: true })
    mestaQuoteId: string;

    @Column({ nullable: true })
    mestaOrderId: string;

    @Column({ type: 'decimal', precision: 18, scale: 4 })
    amount: number;

    @Column()
    sourceCurrency: string;

    @Column()
    targetCurrency: string;

    @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
    exchangeRate: number;

    @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
    fee: number;

    @Column({ default: 'draft' })
    status: string; // draft | quoted | submitted | processing | completed | failed | cancelled

    @Column({ type: 'jsonb', nullable: true, default: '{}' })
    metadata: Record<string, any>;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @ManyToOne(() => Beneficiary, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'beneficiaryId' })
    beneficiary: Beneficiary;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
