import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../../database/entities';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { UploadController } from './upload.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Organization])],
    controllers: [KycController, UploadController],
    providers: [KycService],
})
export class KycModule { }
