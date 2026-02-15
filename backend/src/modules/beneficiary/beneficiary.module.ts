import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Beneficiary, Organization } from '../../database/entities';
import { BeneficiaryController } from './beneficiary.controller';
import { BeneficiaryService } from './beneficiary.service';

@Module({
    imports: [TypeOrmModule.forFeature([Beneficiary, Organization])],
    controllers: [BeneficiaryController],
    providers: [BeneficiaryService],
    exports: [BeneficiaryService],
})
export class BeneficiaryModule { }
