export interface User {
    id: string;
    email: string;
    name: string;
    organizations?: any[];
}

export interface Beneficiary {
    id: string;
    firstName: string;
    lastName?: string;
    email: string;
    country: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankName?: string;
    paymentType: string;
    status: string;
    createdAt: string;
}

export interface CreateBeneficiaryPayload {
    organizationId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    paymentType: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
    };
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;
    bankCode: string;
    senderId?: string;
}

export interface Payout {
    id: string;
    amount: number;
    sourceCurrency: string;
    targetCurrency: string;
    exchangeRate?: number;
    fee?: number;
    status: string;
    mestaQuoteId?: string;
    mestaOrderId?: string;
    beneficiary?: { firstName: string; lastName?: string };
    createdAt: string;
}

export interface Transaction {
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    reference?: string;
    mestaTransactionId?: string;
    createdAt: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
