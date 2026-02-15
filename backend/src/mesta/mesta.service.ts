import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { CreateSenderDto, UploadDocumentDto } from '../modules/kyc/dto/kyc.dto';
import { CreateBeneficiaryDto } from '../modules/beneficiary/dto/beneficiary.dto';

@Injectable()
export class MestaService {
    private readonly logger = new Logger(MestaService.name);
    private readonly client: AxiosInstance;

    constructor(private readonly configService: ConfigService) {
        const baseURL = this.configService.get<string>('mesta.baseUrl');
        const apiKey = this.configService.get<string>('mesta.apiKey');
        const apiSecret = this.configService.get<string>('mesta.apiSecret');

        this.client = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'x-api-secret': apiSecret,
            },
            timeout: 30000,
        });

        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                this.logger.error(
                    `Mesta API error: ${error.response?.status} ${JSON.stringify(error.response?.data)}`,
                );
                throw new HttpException(
                    {
                        message: 'Mesta API error',
                        details: error.response?.data || error.message,
                    },
                    error.response?.status || HttpStatus.BAD_GATEWAY,
                );
            },
        );
    }

    // ─── Merchant ─────────────────────────────────────
    async getMerchantInfo(merchantId: string) {
        const { data } = await this.client.get(`/merchants/${merchantId}`);
        return data;
    }

    async getMerchantTransactions(params?: Record<string, any>) {
        const { data } = await this.client.get('/merchant/transactions', {
            params,
        });
        return data;
    }

    async getMerchantAccountBalances() {
        const { data } = await this.client.get('/merchant/accounts/balances');
        return data;
    }

    // ─── Senders (KYC) ───────────────────────────────
    async createSender(dto: Record<string, any>) {
        const { data } = await this.client.post('/senders', dto);
        return data;
    }

    async getSender(senderId: string) {
        const { data } = await this.client.get(`/senders/${senderId}`);
        return data;
    }

    async updateSender(senderId: string, dto: Record<string, any>) {
        const { data } = await this.client.patch(`/senders/${senderId}`, dto);
        return data;
    }

    async verifySender(senderId: string) {
        const { data } = await this.client.post(`/senders/${senderId}/verify`);
        return data;
    }

    async uploadDocument(senderId: string, dto: UploadDocumentDto) {
        // Mesta expects base64 or file upload, simplified here for demo
        const { data } = await this.client.post(`/senders/${senderId}/documents`, dto);
        return data;
    }

    async getSenderBalance(senderId: string) {
        const { data } = await this.client.get(`/senders/${senderId}/balances`);
        return data;
    }

    // ─── Beneficiaries ────────────────────────────────
    async createBeneficiary(dto: CreateBeneficiaryDto) {
        // Map DTO to Mesta beneficiary payload
        const payload: any = {
            type: 'individual', // Default to individual for now
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phone: dto.phoneNumber,
            address: {
                street: dto.address.street,
                city: dto.address.city,
                country: dto.address.country,
                postalCode: dto.address.postalCode,
            },
            paymentInfo: {
                paymentType: 'bank_account', // Defaulting as specific logic might be needed
                accountNumber: dto.bankAccountNumber, // Mapped from bankAccountNumber? Wait, DTO has bankAccountName, not Number? 
                bankName: dto.bankName,
                // Map specific fields based on country/type
                ...(dto.address.country === 'IN' && { ifscCode: dto.ifscCode, accountType: 'savings' }),
                ...(dto.address.country === 'US' && { routingNumber: dto.routingNumber, accountType: 'checking' }),
                ...(dto.address.country === 'GB' && { sortCode: dto.sortCode }),
                ...(dto.address.country === 'CA' && { branchCode: dto.branchCode }),
                // Add any other specific mappings
                ...dto.additionalDetails,
            },
        };

        // Remove undefined fields from address and paymentInfo
        if (payload.address) {
            Object.keys(payload.address).forEach(key => payload.address[key] === undefined && delete payload.address[key]);
            if (Object.keys(payload.address).length === 0) {
                delete payload.address;
            }
        }
        if (payload.paymentInfo) {
            Object.keys(payload.paymentInfo).forEach(key => payload.paymentInfo[key] === undefined && delete payload.paymentInfo[key]);
            if (Object.keys(payload.paymentInfo).length === 0) {
                delete payload.paymentInfo;
            }
        }

        // If organizationId is passed, use the org's senderId
        if (dto.senderId) {
            payload.senderId = dto.senderId;
        }

        const { data } = await this.client.post('/beneficiaries', payload);
        return data;
    }

    async listBeneficiaries(params?: Record<string, any>) {
        const { data } = await this.client.get('/beneficiaries', { params });
        return data;
    }

    async getBeneficiary(beneficiaryId: string) {
        const { data } = await this.client.get(
            `/beneficiaries/${beneficiaryId}`,
        );
        return data;
    }

    async updateBeneficiary(
        beneficiaryId: string,
        dto: Record<string, any>,
    ) {
        const { data } = await this.client.patch(
            `/beneficiaries/${beneficiaryId}`,
            dto,
        );
        return data;
    }

    async deleteBeneficiary(beneficiaryId: string) {
        const { data } = await this.client.delete(
            `/beneficiaries/${beneficiaryId}`,
        );
        return data;
    }

    async verifyBeneficiary(beneficiaryId: string) {
        const { data } = await this.client.post(
            `/beneficiaries/${beneficiaryId}/verify`,
        );
        return data;
    }

    async getBeneficiaryBanks(params?: Record<string, any>) {
        const { data } = await this.client.get('/beneficiaries/banks', {
            params,
        });
        return data;
    }

    // ─── Quotes ───────────────────────────────────────
    async createQuote(dto: Record<string, any>) {
        const { data } = await this.client.post('/quotes', dto);
        return data;
    }

    async getQuote(quoteId: string) {
        const { data } = await this.client.get(`/quotes/${quoteId}`);
        return data;
    }

    async listQuotes(params?: Record<string, any>) {
        const { data } = await this.client.get('/quotes', { params });
        return data;
    }

    // ─── Orders ───────────────────────────────────────
    async createOrder(dto: Record<string, any>) {
        const { data } = await this.client.post('/orders', dto);
        return data;
    }

    async getOrder(orderId: string) {
        const { data } = await this.client.get(`/orders/${orderId}`);
        return data;
    }

    async listOrders(params?: Record<string, any>) {
        const { data } = await this.client.get('/orders', { params });
        return data;
    }

    async cancelOrder(orderId: string) {
        const { data } = await this.client.post(`/orders/${orderId}/cancel`);
        return data;
    }

    async getOrderDepositWallet(orderId: string) {
        const { data } = await this.client.get(
            `/orders/${orderId}/deposit-wallet-address`,
        );
        return data;
    }

    // ─── Validation Rules ─────────────────────────────
    async getSenderValidationRules(params?: Record<string, any>) {
        const { data } = await this.client.get('/validation-rules/senders', {
            params,
        });
        return data;
    }

    async getBeneficiaryValidationRules(params?: Record<string, any>) {
        const { data } = await this.client.get(
            '/validation-rules/beneficiaries',
            { params },
        );
        return data;
    }

    async getBeneficiaryPaymentTypes(params?: Record<string, any>) {
        const { data } = await this.client.get(
            '/validation-rules/beneficiaries/payment-types',
            { params },
        );
        return data;
    }

    // ─── Webhooks ─────────────────────────────────────
    async registerWebhook(dto: Record<string, any>) {
        const { data } = await this.client.post('/webhooks', dto);
        return data;
    }

    async listWebhooks() {
        const { data } = await this.client.get('/webhooks');
        return data;
    }
}
