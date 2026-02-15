import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { Organization } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Organization]),
        AuthModule,
    ],
    controllers: [OrganizationController],
    providers: [OrganizationService],
    exports: [OrganizationService],
})
export class OrganizationModule { }
