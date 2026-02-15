import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payout, Organization, Beneficiary, Transaction } from '../../database/entities';
import { PayoutController } from './payout.controller';
import { PayoutService } from './payout.service';

@Module({
    imports: [TypeOrmModule.forFeature([Payout, Organization, Beneficiary, Transaction])],
    controllers: [PayoutController],
    providers: [PayoutService],
})
export class PayoutModule { }
