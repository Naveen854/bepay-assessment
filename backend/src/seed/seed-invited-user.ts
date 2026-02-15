/**
 * Seed Scenario 3: Invited User with No Organization or KYC
 * - User created via invite (has invite token)
 * - No organization
 * - No KYC
 * - Needs to go through full onboarding
 *
 * Login: invited@bepay.com / password123
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities';

export async function seedInvitedUser(dataSource: DataSource) {
    const userRepo = dataSource.getRepository(User);

    const passwordHash = await bcrypt.hash('password123', 12);

    console.log('  → Creating invited user...');
    let user = await userRepo.findOne({ where: { email: 'invited@bepay.com' } });
    if (!user) {
        user = userRepo.create({
            email: 'invited@bepay.com',
            name: 'Alex Johnson',
            passwordHash,
            inviteToken: 'seed-invite-token-bepay-2024',
            inviteExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            onboardingStatus: 'new',
        });
        user = await userRepo.save(user);
    }

    console.log('  ✅ Invited user seeded successfully!');
}
