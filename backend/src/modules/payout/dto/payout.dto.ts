import {
    IsString,
    IsNumber,
    IsOptional,
} from 'class-validator';

export class CreateQuoteDto {
    @IsString()
    organizationId: string;

    @IsString()
    beneficiaryId: string;

    @IsNumber()
    amount: number;

    @IsString()
    sourceCurrency: string;

    @IsString()
    targetCurrency: string;
}

export class CreateOrderDto {
    @IsString()
    organizationId: string;

    @IsString()
    quoteId: string;

    @IsOptional()
    @IsString()
    purpose?: string;
}
