import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { transactionApi } from '../services/api';
import type { Transaction } from '../types/shared';

interface TransactionResponse {
    items: Transaction[];
    total: number;
    totalPages: number;
}

export const useTransactions = (params: Record<string, any>, options?: { enabled?: boolean }) => {
    return useQuery<TransactionResponse>({
        queryKey: ['transactions', params],
        queryFn: async () => {
            const response = await transactionApi.list(params);
            return response.data;
        },
        placeholderData: keepPreviousData,
        enabled: options?.enabled !== undefined ? options.enabled : true,
    });
};

export const useExportTransactions = () => {
    return useMutation({
        mutationFn: async () => {
            const response = await transactionApi.exportCsv();
            return response.data;
        },
    });
};
