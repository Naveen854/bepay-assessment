import {
    IsString,
    IsOptional,
    MinLength,
    IsObject,
} from 'class-validator';

export class CreateOrganizationDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsOptional()
    @IsString()
    businessType?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    registrationNumber?: string;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    @IsString()
    taxId?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    street?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    zip?: string;

    @IsOptional()
    @IsString()
    incorporationCertificateUrl?: string;

    @IsOptional()
    @IsString()
    identityDocumentUrl?: string;

    @IsOptional()
    @IsString()
    expectedMonthlyVolume?: string;

    @IsOptional()
    @IsString()
    intendedUse?: string;

    @IsOptional()
    @IsString()
    referralSource?: string;

    // Forced rebuild
}

export class UpdateOrganizationDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @IsString()
    businessType?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    registrationNumber?: string;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    @IsObject()
    settings?: Record<string, any>;
}
