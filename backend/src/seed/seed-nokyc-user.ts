/**
 * Seed Scenario 2: User with Organization but No KYC
 * - Has an organization created
 * - KYC not started — no Mesta sender
 * - No beneficiaries
 *
 * Login: nokyc@bepay.com / password123
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Organization } from '../database/entities';

export async function seedNoKycUser(dataSource: DataSource) {
    const userRepo = dataSource.getRepository(User);
    const orgRepo = dataSource.getRepository(Organization);

    const passwordHash = await bcrypt.hash('password123', 12);

    // ─── 1. Create User ──────────────────────────────
    console.log('  → Creating user with no KYC...');
    let user = await userRepo.findOne({ where: { email: 'nokyc@bepay.com' } });
    if (!user) {
        user = userRepo.create({
            email: 'nokyc@bepay.com',
            name: 'Priya Patel',
            passwordHash,
            onboardingStatus: 'completed',
        });
        user = await userRepo.save(user);
    }

    // ─── 2. Create Organization (no KYC) ─────────────
    console.log('  → Creating organization (no KYC)...');
    let org = await orgRepo.findOne({ where: { userId: user.id } });
    if (!org) {
        org = orgRepo.create({
            name: 'GlobalTrade Exports',
            userId: user.id,
            businessType: 'business',
            country: 'GB',
            registrationNumber: 'SC123456',
            phoneNumber: '+442071234567',
            street: '1 London Bridge',
            city: 'London',
            state: 'England',
            zip: 'SE1 9GF',
            kycStatus: 'pending',       // Organization exists but KYC not done
            // mestaSenderId is NOT set
            settings: { theme: 'light' },
        });
        org = await orgRepo.save(org);
    }

    console.log('  ✅ No-KYC user seeded successfully!');
}
