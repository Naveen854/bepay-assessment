import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('organizations')
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    businessType: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true })
    registrationNumber: string;

    @Column({ nullable: true })
    website: string;

    @Column({ type: 'jsonb', nullable: true, default: '{}' })
    settings: Record<string, any>;

    @Column({ nullable: true })
    mestaSenderId: string;

    @Column({ default: 'pending' })
    kycStatus: string;

    @Column({ nullable: true })
    expectedMonthlyVolume: string;

    @Column({ nullable: true })
    intendedUse: string;

    @Column({ nullable: true })
    referralSource: string;

    // --- KYB Fields ---
    @Column({ nullable: true })
    taxId: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    street: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    state: string;

    @Column({ nullable: true })
    zip: string;

    // country is already defined above

    @Column({ nullable: true })
    incorporationCertificateUrl: string;

    @Column({ nullable: true })
    identityDocumentUrl: string;

    @ManyToOne(() => User, (user) => user.organizations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
