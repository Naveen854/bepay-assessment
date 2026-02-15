import React, { useEffect } from 'react';
import {
    Send,
    DollarSign,
    ArrowRight,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, Badge, ResponsiveDialog, PageHeader, TableEmptyState } from '../../components';
import './Payout.css';
import { useDisclosure } from '../../hooks/useDisclosure';
import { useFormReducer } from '../../hooks/useFormReducer';
import {
    usePayouts,
    useCreateQuote,
    useCreateOrder,
    useCancelOrder
} from '../../hooks/usePayouts';
import { useBeneficiaries } from '../../hooks/useBeneficiaries';
import { useOrgStore } from '../../store/orgStore';

const initialFormState = {
    beneficiaryId: '',
    amount: '',
    sourceCurrency: 'USD',
    targetCurrency: 'NGN',
    quote: null as any,
};

import { useLocation } from 'react-router-dom';

export const PayoutPage: React.FC = () => {
    // Hooks
    const { isOpen: showForm, open: openForm, close: closeForm } = useDisclosure();
    const location = useLocation();
    const { activeOrg } = useOrgStore();

    // Auto-open form
    useEffect(() => {
        if (location.state?.openCreate) {
            openForm();
        }
    }, [location.state, openForm]);

    // Queries & Mutations
    const { data: payouts, isLoading: payoutsLoading } = usePayouts(activeOrg?.id);
    const { data: beneficiaries } = useBeneficiaries(activeOrg?.id);

    // Mutations
    const createQuoteMutation = useCreateQuote();
    const createOrderMutation = useCreateOrder();
    const cancelOrderMutation = useCancelOrder();

    // Form State
    const { form, setField, reset: resetForm } = useFormReducer(initialFormState);

    // Handlers
    const handleOpenForm = () => {
        resetForm();
        openForm();
    };

    const handleCreateQuote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeOrg?.id || !form.beneficiaryId || !form.amount) {
            toast.error('Fill in all fields');
            return;
        }
        createQuoteMutation.mutate(
            {
                organizationId: activeOrg.id,
                beneficiaryId: form.beneficiaryId,
                amount: parseFloat(form.amount),
                sourceCurrency: form.sourceCurrency,
                targetCurrency: form.targetCurrency,
            },
            {
                onSuccess: (data) => {
                    setField('quote', data);
                    toast.success('Quote received!');
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || 'Quote failed');
                },
            }
        );
    };

    const handleConfirmOrder = () => {
        if (!form.quote?.quote?.id || !activeOrg?.id) return;
        createOrderMutation.mutate(
            {
                organizationId: activeOrg.id,
                quoteId: form.quote.quote.id,
                purpose: 'Payment for services',
            },
            {
                onSuccess: () => {
                    toast.success('Payout order created!');
                    closeForm();
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || 'Order failed');
                },
            }
        );
    };

    const handleCancel = (id: string) => {
        cancelOrderMutation.mutate(id, {
            onSuccess: () => toast.success('Order cancelled'),
            onError: (err: any) => toast.error(err.response?.data?.message || 'Cancel failed'),
        });
    };

    const statusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
        const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
            quoted: 'info',
            ordered: 'warning',
            processing: 'warning',
            completed: 'success',
            failed: 'error',
            cancelled: 'default',
        };
        return map[status] || 'default';
    };

    const formLoading = createQuoteMutation.isPending || createOrderMutation.isPending;

    return (
        <div className="payout-page">
            <PageHeader
                title="Payouts"
                subtitle="Create and manage cross-border payouts"
                action={
                    <Button
                        icon={<Send size={16} />}
                        onClick={() => {
                            if (activeOrg?.kycStatus !== 'verified') {
                                toast.error('Please complete your KYC verification before creating a payout.');
                                return;
                            }
                            handleOpenForm();
                        }}
                        title={activeOrg?.kycStatus !== 'verified' ? 'Verify organization first' : 'New Payout'}
                    >
                        New Payout
                    </Button>
                }
            />

            {/* Payouts Table */}
            <Card>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Recipient</th>
                                <th>Amount</th>
                                <th>Route</th>
                                <th>Rate</th>
                                <th>Fee</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payoutsLoading ? (
                                <tr><td colSpan={7} className="data-table__empty">Loading...</td></tr>
                            ) : !payouts || payouts.length === 0 ? (
                                <TableEmptyState
                                    colSpan={7}
                                    icon={Send}
                                    message="No payouts yet"
                                    description="Create your first payout to get started"
                                />
                            ) : (
                                payouts.map((p: any) => (
                                    <tr key={p.id}>
                                        <td className="beneficiary-table__name">
                                            {p.beneficiary?.firstName} {p.beneficiary?.lastName || ''}
                                        </td>
                                        <td><strong>{p.amount}</strong></td>
                                        <td>{p.sourceCurrency} → {p.targetCurrency}</td>
                                        <td>{p.exchangeRate || '—'}</td>
                                        <td>{p.fee || '—'}</td>
                                        <td><Badge variant={statusVariant(p.status)} dot>{p.status}</Badge></td>
                                        <td>
                                            <div className="data-table__actions">
                                                {['quoted', 'ordered'].includes(p.status) && (
                                                    <button className="data-table__action data-table__action--danger" onClick={() => handleCancel(p.id)} title="Cancel">
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* New Payout Dialog */}
            <ResponsiveDialog
                isOpen={showForm}
                onClose={closeForm}
                title={
                    <div className="payout-dialog-title">
                        <DollarSign size={20} />
                        <span>New Payout</span>
                    </div>
                }
                footer={
                    form.quote ? (
                        <>
                            <Button variant="secondary" onClick={() => setField('quote', null)}>Back</Button>
                            <Button loading={formLoading} onClick={handleConfirmOrder} icon={<ArrowRight size={16} />}>
                                Confirm & Send
                            </Button>
                        </>
                    ) : undefined // Footer handled inside form for default view to submit type="submit"
                }
            >
                {!form.quote ? (
                    <form onSubmit={handleCreateQuote} className="kyc-form dialog-form" id="create-quote-form">
                        <div className="input-group">
                            <label className="input-group__label" htmlFor="select-beneficiary">Beneficiary</label>
                            <select
                                id="select-beneficiary"
                                className="kyc-form__select"
                                value={form.beneficiaryId}
                                onChange={(e) => setField('beneficiaryId', e.target.value)}
                            >
                                <option value="">Select recipient</option>
                                {(beneficiaries || []).map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.firstName} {b.lastName} — {b.country}</option>
                                ))}
                            </select>
                        </div>
                        <Input label="Amount" type="number" step="0.01" min="1" value={form.amount} onChange={(e) => setField('amount', e.target.value)} />
                        <div className="drawer__row">
                            <div className="input-group">
                                <label className="input-group__label" htmlFor="source-currency">Source Currency</label>
                                <select
                                    id="source-currency"
                                    className="kyc-form__select"
                                    value={form.sourceCurrency}
                                    onChange={(e) => setField('sourceCurrency', e.target.value)}
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-group__label" htmlFor="target-currency">Target Currency</label>
                                <select
                                    id="target-currency"
                                    className="kyc-form__select"
                                    value={form.targetCurrency}
                                    onChange={(e) => setField('targetCurrency', e.target.value)}
                                >
                                    <option value="NGN">NGN</option>
                                    <option value="KES">KES</option>
                                    <option value="GHS">GHS</option>
                                    <option value="ZAR">ZAR</option>
                                    <option value="INR">INR</option>
                                </select>
                            </div>
                        </div>
                        {/* Footer for Form View: included here to be inside form tag if needed, or we can use footer prop and form id */}
                        <div className="dialog-footer-actions payout-dialog-footer">
                            <Button type="submit" loading={formLoading} size="lg" fullWidth>
                                Get Quote
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="payout-quote">
                        <h3 className="payout-quote__title">Quote Summary</h3>
                        <div className="payout-quote__details">
                            <div className="payout-quote__row">
                                <span>Amount</span>
                                <strong>{form.amount} {form.sourceCurrency}</strong>
                            </div>
                            <div className="payout-quote__row">
                                <span>Exchange Rate</span>
                                <strong>{form.quote.quote?.exchange_rate || form.quote.quote?.rate || '—'}</strong>
                            </div>
                            <div className="payout-quote__row">
                                <span>Fee</span>
                                <strong>{form.quote.quote?.fee || form.quote.quote?.fees || '0'} {form.sourceCurrency}</strong>
                            </div>
                            <div className="payout-quote__row payout-quote__row--total">
                                <span>Recipient Gets</span>
                                <strong>{form.quote.quote?.target_amount || '—'} {form.targetCurrency}</strong>
                            </div>
                        </div>
                    </div>
                )}
            </ResponsiveDialog>
        </div>
    );
};
