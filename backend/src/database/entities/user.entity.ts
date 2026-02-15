import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    passwordHash: string;

    @Column({ nullable: true })
    inviteToken: string;

    @Column({ type: 'timestamp', nullable: true })
    inviteExpiresAt: Date;

    @Column({ default: 'new' })
    onboardingStatus: string; // 'new' | 'completed'

    @OneToMany(() => Organization, (org) => org.user)
    organizations: Organization[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
