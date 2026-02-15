import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    organizationId: string;

    @Column({ nullable: true })
    payoutId: string;

    @Column({ nullable: true })
    mestaTransactionId: string;

    @Column()
    type: string; // payout | deposit | refund

    @Column({ type: 'decimal', precision: 18, scale: 4 })
    amount: number;

    @Column()
    currency: string;

    @Column({ default: 'pending' })
    status: string; // pending | processing | completed | failed

    @Column({ nullable: true })
    reference: string;

    @Column({ type: 'jsonb', nullable: true, default: '{}' })
    metadata: Record<string, any>;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @CreateDateColumn()
    createdAt: Date;
}
