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

@Entity('beneficiaries')
export class Beneficiary {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    organizationId: string;

    @Column({ nullable: true })
    mestaBeneficiaryId: string;

    @Column()
    firstName: string;

    @Column({ nullable: true })
    lastName: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    zipCode: string;

    @Column({ nullable: true })
    bankAccountName: string;

    @Column({ nullable: true })
    bankAccountNumber: string;

    @Column({ nullable: true })
    bankName: string;

    @Column({ nullable: true })
    bankCode: string; // Routing Number / IFSC

    @Column({ nullable: true })
    accountType: string; // checking | savings

    @Column({ nullable: true })
    paymentType: string;

    @Column({ default: 'pending' })
    status: string; // pending | verifying | verified | rejected

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
