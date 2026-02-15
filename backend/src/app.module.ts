import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { User, Organization, Beneficiary, Payout, Transaction } from './database/entities';
import { MestaModule } from './mesta/mesta.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { KycModule } from './modules/kyc/kyc.module';
import { BeneficiaryModule } from './modules/beneficiary/beneficiary.module';
import { PayoutModule } from './modules/payout/payout.module';
import { TransactionModule } from './modules/transaction/transaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [User, Organization, Beneficiary, Payout, Transaction],
        synchronize: true, // DEV only — use migrations in prod
        logging: false,
      }),
      inject: [ConfigService],
    }),
    MestaModule,
    AuthModule,
    OrganizationModule,
    KycModule,
    BeneficiaryModule,
    PayoutModule,
    TransactionModule,
  ],
})
export class AppModule { }
