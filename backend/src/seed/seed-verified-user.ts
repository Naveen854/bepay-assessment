/**
 * Seed Scenario 1: Fully Verified User
 * - Organization with completed KYC (Mesta sender created + verified)
 * - Beneficiaries created via Mesta API with valid bank data
 *
 * Login: verified@bepay.com / password123
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Organization, Beneficiary } from '../database/entities';
import { MestaService } from '../mesta/mesta.service';

export async function seedVerifiedUser(dataSource: DataSource, mestaService: MestaService) {
    const userRepo = dataSource.getRepository(User);
    const orgRepo = dataSource.getRepository(Organization);
    const benRepo = dataSource.getRepository(Beneficiary);

    const passwordHash = await bcrypt.hash('password123', 12);

    // ─── 1. Create User ──────────────────────────────
    console.log('  → Creating verified user...');
    let user = await userRepo.findOne({ where: { email: 'verified@bepay.com' } });
    if (!user) {
        user = userRepo.create({
            email: 'verified@bepay.com',
            name: 'Rahul Sharma',
            passwordHash,
            onboardingStatus: 'completed',
        });
        user = await userRepo.save(user);
    }

    // ─── 2. Create Organization ──────────────────────
    console.log('  → Creating organization...');
    let org = await orgRepo.findOne({ where: { userId: user.id } });
    if (!org) {
        org = orgRepo.create({
            name: 'TechPay Solutions Pvt. Ltd.',
            userId: user.id,
            businessType: 'corporation',
            country: 'US',
            registrationNumber: 'U72200DL2024PTC123456',
            taxId: '22AAAAA0000A1Z5',
            phoneNumber: '+12125551234',
            street: '350 Fifth Avenue',
            city: 'New York',
            state: 'NY',
            zip: '10118',
            settings: { theme: 'light' },
        });
        org = await orgRepo.save(org);
    }

    // ─── 3. Create Mesta Sender (KYC) ────────────────
    // Mesta business sender format per docs:
    // type, fullName, email, phone, address{street,city,state,country,postalCode},
    // identificationNumber, registrationDate, businessType
    if (!org.mestaSenderId) {
        console.log('  → Creating Mesta sender (KYC)...');
        try {
            const sender = await mestaService.createSender({
                type: 'business',
                fullName: 'TechPay Solutions Pvt. Ltd.',
                email: 'verified@bepay.com',
                phone: '+12125551234',
                addresses: [
                    {
                        street: '350 Fifth Avenue',
                        city: 'New York',
                        state: 'New York',
                        country: 'US',
                        postalCode: '10118',
                    },
                ],
                identificationNumber: 'U72200DL2024PTC123456',
                registrationDate: '2020-01-15',
                businessType: 'corporation',
            });

            org.mestaSenderId = sender.id;
            org.kycStatus = 'verified';
            org = await orgRepo.save(org);
            console.log(`  ✓ Mesta sender created: ${sender.id}`);

            // Submit for verification
            try {
                await mestaService.verifySender(sender.id);
                console.log('  ✓ Sender submitted for verification');
            } catch (err: any) {
                console.log(`  ⚠ Verify sender: ${err.response?.data?.message || err.message}`);
            }
        } catch (err: any) {
            const details = err.response?.data?.details || err.response?.data?.error || err.message;
            console.log(`  ⚠ Mesta sender creation: ${JSON.stringify(details)}`);
            // Set verified locally regardless for seeding purposes
            org.kycStatus = 'verified';
            org = await orgRepo.save(org);
        }
    } else {
        if (org.kycStatus !== 'verified') {
            org.kycStatus = 'verified';
            org = await orgRepo.save(org);
        }
        console.log(`  ✓ Mesta sender already exists: ${org.mestaSenderId}`);
    }

    // ─── 4. Create Beneficiaries via Mesta ───────────
    // Mesta beneficiary (individual) format per docs:
    // type, firstName, lastName, email, phone, address{...}, paymentInfo{paymentType, ...country-specific}

    // Beneficiary 1: India (INR) — bank_account
    const ben1Exists = await benRepo.findOne({ where: { email: 'adebayo.okonkwo@gmail.com', organizationId: org.id } });
    if (!ben1Exists) {
        console.log('  → Creating beneficiary: Adebayo Okonkwo (India)...');

        let mestaBen1Id: string | undefined;
        if (org.mestaSenderId) {
            try {
                const mestaBen = await mestaService.createBeneficiary({
                    organizationId: org.id,
                    senderId: org.mestaSenderId,
                    firstName: 'Adebayo',
                    lastName: 'Okonkwo',
                    email: 'adebayo.okonkwo@gmail.com',
                    phoneNumber: '+919876543210',
                    address: {
                        street: '25 MG Road',
                        city: 'Mumbai',
                        state: 'MH',
                        country: 'IN',
                        postalCode: '400001',
                    },
                    paymentType: 'bank_account',
                    bankAccountName: 'Adebayo Okonkwo',
                    bankAccountNumber: '50100123456789',
                    bankName: 'HDFC Bank',
                    ifscCode: 'HDFC0000001',
                });
                mestaBen1Id = mestaBen.id;
                console.log(`  ✓ Mesta beneficiary created: ${mestaBen.id}`);

                try {
                    await mestaService.verifyBeneficiary(mestaBen.id);
                    console.log('  ✓ Beneficiary verification initiated');
                } catch (e: any) {
                    console.log(`  ⚠ Beneficiary verify: ${e.response?.data?.message || e.message}`);
                }
            } catch (err: any) {
                const details = err.response?.data?.details || err.response?.data?.error || err.message;
                console.log(`  ⚠ Mesta beneficiary creation: ${JSON.stringify(details)}`);
            }
        }

        const ben1 = benRepo.create({
            organizationId: org.id,
            mestaBeneficiaryId: mestaBen1Id,
            firstName: 'Adebayo',
            lastName: 'Okonkwo',
            email: 'adebayo.okonkwo@gmail.com',
            phoneNumber: '+919876543210',
            country: 'IN',
            city: 'Mumbai',
            address: '25 MG Road',
            zipCode: '400001',
            bankAccountName: 'Adebayo Okonkwo',
            bankAccountNumber: '50100123456789',
            bankName: 'HDFC Bank',
            bankCode: 'HDFC0000001',
            accountType: 'savings',
            paymentType: 'bank_account',
            status: 'verified',
        });
        await benRepo.save(ben1);
    }

    // Beneficiary 2: Colombia (COP) — bank_account
    const ben2Exists = await benRepo.findOne({ where: { email: 'wanjiku.maina@gmail.com', organizationId: org.id } });
    if (!ben2Exists) {
        console.log('  → Creating beneficiary: Wanjiku Maina (Colombia)...');

        let mestaBen2Id: string | undefined;
        if (org.mestaSenderId) {
            try {
                const mestaBen = await mestaService.createBeneficiary({
                    organizationId: org.id,
                    senderId: org.mestaSenderId,
                    firstName: 'Wanjiku',
                    lastName: 'Maina',
                    email: 'wanjiku.maina@gmail.com',
                    phoneNumber: '+573001234567',
                    address: {
                        street: '15 Carrera 7',
                        city: 'Bogota',
                        state: 'DC',
                        country: 'CO',
                        postalCode: '110111',
                    },
                    paymentType: 'bank_account',
                    bankAccountName: 'Wanjiku Maina',
                    bankAccountNumber: '12345678901',
                    accountType: 'savings',
                });
                mestaBen2Id = mestaBen.id;
                console.log(`  ✓ Mesta beneficiary created: ${mestaBen.id}`);

                try {
                    await mestaService.verifyBeneficiary(mestaBen.id);
                    console.log('  ✓ Beneficiary verification initiated');
                } catch (e: any) {
                    console.log(`  ⚠ Beneficiary verify: ${e.response?.data?.message || e.message}`);
                }
            } catch (err: any) {
                const details = err.response?.data?.details || err.response?.data?.error || err.message;
                console.log(`  ⚠ Mesta beneficiary creation: ${JSON.stringify(details)}`);
            }
        }

        const ben2 = benRepo.create({
            organizationId: org.id,
            mestaBeneficiaryId: mestaBen2Id,
            firstName: 'Wanjiku',
            lastName: 'Maina',
            email: 'wanjiku.maina@gmail.com',
            phoneNumber: '+573001234567',
            country: 'CO',
            city: 'Bogota',
            address: '15 Carrera 7',
            zipCode: '110111',
            bankAccountName: 'Wanjiku Maina',
            bankAccountNumber: '12345678901',
            bankName: 'Bancolombia',
            bankCode: 'BANCOLOMBIA',
            accountType: 'savings',
            paymentType: 'bank_account',
            status: 'verified',
        });
        await benRepo.save(ben2);
    }

    // Beneficiary 3: Singapore (SGD) — bank_account (pending — for demo)
    const ben3Exists = await benRepo.findOne({ where: { email: 'kwame.asante@gmail.com', organizationId: org.id } });
    if (!ben3Exists) {
        console.log('  → Creating beneficiary: Kwame Asante (Singapore)...');

        let mestaBen3Id: string | undefined;
        if (org.mestaSenderId) {
            try {
                const mestaBen = await mestaService.createBeneficiary({
                    organizationId: org.id,
                    senderId: org.mestaSenderId,
                    firstName: 'Kwame',
                    lastName: 'Asante',
                    email: 'kwame.asante@gmail.com',
                    phoneNumber: '+6591234567',
                    address: {
                        street: '10 Orchard Road',
                        city: 'Singapore',
                        state: 'SG',
                        country: 'SG',
                        postalCode: '238840',
                    },
                    paymentType: 'bank_account',
                    bankAccountName: 'Kwame Asante',
                    bankAccountNumber: '1234567890',
                    accountType: 'savings',
                });
                mestaBen3Id = mestaBen.id;
                console.log(`  ✓ Mesta beneficiary created: ${mestaBen.id}`);
                // Intentionally NOT verifying — this one stays pending for demo
            } catch (err: any) {
                const details = err.response?.data?.details || err.response?.data?.error || err.message;
                console.log(`  ⚠ Mesta beneficiary creation: ${JSON.stringify(details)}`);
            }
        }

        const ben3 = benRepo.create({
            organizationId: org.id,
            mestaBeneficiaryId: mestaBen3Id,
            firstName: 'Kwame',
            lastName: 'Asante',
            email: 'kwame.asante@gmail.com',
            phoneNumber: '+6591234567',
            country: 'SG',
            city: 'Singapore',
            address: '10 Orchard Road',
            zipCode: '238840',
            bankAccountName: 'Kwame Asante',
            bankAccountNumber: '1234567890',
            bankName: 'DBS Bank',
            bankCode: 'DBS',
            accountType: 'savings',
            paymentType: 'bank_account',
            status: 'pending',
        });
        await benRepo.save(ben3);
    }

    console.log('  ✅ Verified user seeded successfully!');
}
