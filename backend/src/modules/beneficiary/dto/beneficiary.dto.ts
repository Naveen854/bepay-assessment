import {
    IsString,
    IsOptional,
    IsEnum,
    IsObject,
} from 'class-validator';
import { AddressDto } from '../../kyc/dto/kyc.dto';

export class CreateBeneficiaryDto {
    @IsString()
    organizationId: string;

    @IsOptional()
    @IsString()
    senderId?: string;

    @IsString()
    firstName: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsObject()
    address: AddressDto;

    @IsString()
    bankAccountName: string;

    @IsString()
    bankAccountNumber: string;

    @IsOptional()
    @IsString()
    accountType?: string;

    @IsOptional()
    @IsString()
    bankCode?: string;

    @IsOptional()
    @IsString()
    bankName?: string;

    @IsString()
    paymentType: string;

    @IsOptional()
    @IsString()
    swift?: string;

    @IsOptional()
    @IsString()
    routingNumber?: string; // US

    @IsOptional()
    @IsString()
    ifscCode?: string; // India

    @IsOptional()
    @IsString()
    sortCode?: string; // UK

    @IsOptional()
    @IsString()
    branchCode?: string; // CanadaAA

    @IsOptional()
    @IsObject()
    additionalDetails?: Record<string, any>;
}

export class UpdateBeneficiaryDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    zipCode?: string;

    @IsOptional()
    @IsString()
    bankAccountName?: string;

    @IsOptional()
    @IsString()
    bankAccountNumber?: string;

    @IsOptional()
    @IsString()
    bankCode?: string;

    @IsOptional()
    @IsString()
    bankName?: string;

    @IsOptional()
    @IsObject()
    additionalDetails?: Record<string, any>;
}
