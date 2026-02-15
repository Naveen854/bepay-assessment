import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export enum SenderType {
    INDIVIDUAL = 'individual',
    BUSINESS = 'business',
}

export class AddressDto {
    @IsString()
    street: string;

    @IsString()
    city: string;

    @IsString()
    state: string;

    @IsString()
    country: string;

    @IsString()
    postalCode: string;
}

export class CreateSenderDto {
    @IsEnum(SenderType)
    type: SenderType;

    @IsString()
    fullName: string;

    @IsOptional()
    @IsString()
    firstName?: string;

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

    @IsOptional()
    @IsString()
    identificationNumber?: string;

    @IsOptional()
    @IsString()
    registrationDate?: string;

    @IsOptional()
    @IsString()
    businessType?: string;

    @IsOptional()
    @IsString()
    nationality?: string;

    @IsOptional()
    @IsString()
    dateOfBirth?: string;

    @IsOptional()
    @IsObject()
    identificationDocument?: {
        type: string;
        number: string;
        issuingCountry: string;
    };
}

export class UploadDocumentDto {
    @IsString()
    type: string;

    @IsString()
    documentUrl: string;
}
