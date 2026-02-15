/**
 * Main Seed Runner
 *
 * Seeds three user types:
 *   1. Fully verified — org + KYC + beneficiaries (via Mesta API)
 *   2. Organization but no KYC
 *   3. Invited user — no org, no KYC
 *
 * All users share password: password123
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/seed/index.ts
 *   — or —
 *   npm run seed
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { MestaService } from '../mesta/mesta.service';
import { seedVerifiedUser } from './seed-verified-user';
import { seedNoKycUser } from './seed-nokyc-user';
import { seedInvitedUser } from './seed-invited-user';

async function main() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║        🌱 BePay Database Seeder           ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('');

    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const mestaService = app.get(MestaService);

    try {
        // --- Scenario 1: Fully Verified User ---
        console.log('📦 Scenario 1: Fully Verified User (verified@bepay.com)');
        await seedVerifiedUser(dataSource, mestaService);
        console.log('');

        // --- Scenario 2: Org + No KYC ---
        console.log('📦 Scenario 2: Organization + No KYC (nokyc@bepay.com)');
        await seedNoKycUser(dataSource);
        console.log('');

        // --- Scenario 3: Invited User ---
        console.log('📦 Scenario 3: Invited User (invited@bepay.com)');
        await seedInvitedUser(dataSource);
        console.log('');

        console.log('╔═══════════════════════════════════════════╗');
        console.log('║       ✅ All seeds completed!              ║');
        console.log('║                                           ║');
        console.log('║  Accounts (password: password123):        ║');
        console.log('║    • verified@bepay.com  → Full setup     ║');
        console.log('║    • nokyc@bepay.com     → No KYC         ║');
        console.log('║    • invited@bepay.com   → New invite     ║');
        console.log('╚═══════════════════════════════════════════╝');
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await app.close();
    }
}

main();
