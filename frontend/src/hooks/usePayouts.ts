import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutApi } from '../services/api';
import type { Payout } from '../types/shared';


export const usePayouts = (orgId?: string) => {
    return useQuery({
        queryKey: ['payouts', orgId],
        queryFn: async () => {
            const params = orgId ? { orgId } : {};
            const { data } = await payoutApi.list(params);
            return (Array.isArray(data) ? data : []) as Payout[];
        },
        enabled: !!orgId,
    });
};

export const useCreateQuote = () => {
    return useMutation({
        mutationFn: async (payload: {
            organizationId: string;
            beneficiaryId: string;
            amount: number;
            sourceCurrency: string;
            targetCurrency: string;
        }) => {
            const { data } = await payoutApi.createQuote(payload);
            return data;
        },
    });
};

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            organizationId: string;
            quoteId: string;
            purpose: string;
        }) => {
            const { data } = await payoutApi.createOrder(payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payouts'] });
        },
    });
};

export const useCancelOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await payoutApi.cancelOrder(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payouts'] });
        },
    });
};
