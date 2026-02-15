import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { beneficiaryApi } from '../services/api';
import type { Beneficiary, CreateBeneficiaryPayload } from '../types/shared';


export const useBeneficiaries = (orgId?: string) => {
    return useQuery({
        queryKey: ['beneficiaries', orgId],
        queryFn: async () => {
            const params = orgId ? { orgId } : {};
            const { data } = await beneficiaryApi.list(params);
            return data as Beneficiary[];
        },
        enabled: !!orgId, // Only fetch if orgId is present
    });
};

export const useCreateBeneficiary = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CreateBeneficiaryPayload) => {
            const { data } = await beneficiaryApi.create(payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
        },
    });
};

export const useUpdateBeneficiary = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Beneficiary> }) => {
            const response = await beneficiaryApi.update(id, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
        },
    });
};

export const useDeleteBeneficiary = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await beneficiaryApi.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
        },
    });
};

export const useVerifyBeneficiary = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await beneficiaryApi.verify(id);
            return data;
        },
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['beneficiaries'] });

            // Snapshot previous value
            const previousBeneficiaries = queryClient.getQueriesData({ queryKey: ['beneficiaries'] });

            // Optimistically update status to 'verifying'
            queryClient.setQueriesData({ queryKey: ['beneficiaries'] }, (old: any) => {
                if (!Array.isArray(old)) return old;
                return old.map((b: any) =>
                    b.id === id ? { ...b, status: 'verifying' } : b
                );
            });

            return { previousBeneficiaries };
        },
        onError: (_err, _id, context) => {
            // Rollback on error
            if (context?.previousBeneficiaries) {
                context.previousBeneficiaries.forEach(([key, data]: any) => {
                    queryClient.setQueryData(key, data);
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
        },
    });
};
