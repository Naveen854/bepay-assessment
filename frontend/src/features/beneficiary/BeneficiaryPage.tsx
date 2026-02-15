import React, { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Search,
    CheckCircle,
    Trash2,
    Eye,
    Send,
    ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, Badge, ResponsiveDialog, PageHeader, TableEmptyState } from '../../components';
import './Beneficiary.css';
import { useDisclosure } from '../../hooks/useDisclosure';
import { useFormReducer } from '../../hooks/useFormReducer';
import {
    useBeneficiaries,
    useCreateBeneficiary,
    useVerifyBeneficiary,
    useDeleteBeneficiary
} from '../../hooks/useBeneficiaries';
import { useCreateQuote, useCreateOrder } from '../../hooks/usePayouts';
import { useOrgStore } from '../../store/orgStore';
import { useLocation } from 'react-router-dom';

const initialFormState = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    country: 'US',
    city: '',
    state: '',
    address: '',
    zipCode: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankName: '',
    bankCode: '',
    paymentType: 'bank_account',
};

const initialTransferForm = {
    amount: '',
    sourceCurrency: 'USD',
    targetCurrency: 'NGN',
    quote: null as any,
};

export const BeneficiaryPage: React.FC = () => {
    // Hooks
    const { isOpen: showForm, open: openForm, close: closeForm } = useDisclosure();
    const { isOpen: showDetail, open: openDetail, close: closeDetail } = useDisclosure();
    const { isOpen: showTransfer, open: openTransfer, close: closeTransfer } = useDisclosure();
    const location = useLocation();
    const { activeOrg } = useOrgStore();

    // Auto-open form
    useEffect(() => {
        if (location.state?.openCreate) {
            openForm();
        }
    }, [location.state, openForm]);

    // Queries & Mutations
    const { data: beneficiaries, isLoading: loading } = useBeneficiaries(activeOrg?.id);
    const createMutation = useCreateBeneficiary();
    const verifyMutation = useVerifyBeneficiary();
    const deleteMutation = useDeleteBeneficiary();
    const createQuoteMutation = useCreateQuote();
    const createOrderMutation = useCreateOrder();

    // Form
    const { form, setField, reset: resetForm } = useFormReducer(initialFormState);
    const { form: transferForm, setField: setTransferField, reset: resetTransfer } = useFormReducer(initialTransferForm);

    // Local State
    const [search, setSearch] = useState('');
    const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);

    // Handlers
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeOrg?.id) return toast.error('Create an organization first');

        const payload = {
            organizationId: activeOrg.id,
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phoneNumber: form.phoneNumber,
            paymentType: form.paymentType,
            address: {
                street: form.address,
                city: form.city,
                state: form.state,
                country: form.country,
                postalCode: form.zipCode,
            },
            bankAccountName: form.bankAccountName,
            bankAccountNumber: form.bankAccountNumber,
            bankName: form.bankName,
            bankCode: form.bankCode,
        };

        createMutation.mutate(
            payload,
            {
                onSuccess: () => {
                    toast.success('Beneficiary created');
                    closeForm();
                    resetForm();
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || 'Creation failed');
                },
            }
        );
    };

    const getBankCodeLabel = (country: string) => {
        switch (country?.toUpperCase()) {
            case 'US': return 'Routing Number';
            case 'IN': return 'IFSC Code';
            case 'GB': return 'Sort Code';
            case 'CA': return 'Branch Code';
            default: return 'Bank Code / BIC';
        }
    };

    const handleVerify = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        // Find the beneficiary to check current status
        const beneficiary = (beneficiaries || []).find((b: any) => b.id === id);
        if (!beneficiary || beneficiary.status !== 'pending') {
            // Already verifying or verified — no repeated API calls
            toast('Verification is already in progress', { icon: '⏳' });
            return;
        }

        verifyMutation.mutate(id, {
            onSuccess: () => toast.success('Verification initiated — status will update automatically'),
            onError: (err: any) => toast.error(err.response?.data?.message || 'Verification failed'),
        });
    };

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm('Delete this beneficiary?')) return;
        deleteMutation.mutate(id, {
            onSuccess: () => {
                toast.success('Beneficiary deleted');
                if (selectedBeneficiary?.id === id) closeDetail();
            },
            onError: (err: any) => toast.error(err.response?.data?.message || 'Delete failed'),
        });
    };

    const handleRowClick = (b: any) => {
        setSelectedBeneficiary(b);
        openDetail();
    };

    const handleSendMoney = (b: any) => {
        setSelectedBeneficiary(b);
        closeDetail();
        resetTransfer();
        openTransfer();
    };

    const handleCreateQuote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeOrg?.id || !selectedBeneficiary?.id || !transferForm.amount) {
            toast.error('Fill in all fields');
            return;
        }
        createQuoteMutation.mutate(
            {
                organizationId: activeOrg.id,
                beneficiaryId: selectedBeneficiary.id,
                amount: parseFloat(transferForm.amount),
                sourceCurrency: transferForm.sourceCurrency,
                targetCurrency: transferForm.targetCurrency,
            },
            {
                onSuccess: (data) => {
                    setTransferField('quote', data);
                    toast.success('Quote received!');
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || 'Quote failed');
                },
            }
        );
    };

    const handleConfirmOrder = () => {
        if (!transferForm.quote?.quote?.id || !activeOrg?.id) return;
        createOrderMutation.mutate(
            {
                organizationId: activeOrg.id,
                quoteId: transferForm.quote.quote.id,
                purpose: 'Payment for services',
            },
            {
                onSuccess: () => {
                    toast.success('Transfer initiated successfully!');
                    closeTransfer();
                    resetTransfer();
                },
                onError: (err: any) => {
                    toast.error(err.response?.data?.message || 'Order failed');
                },
            }
        );
    };

    // Filtering
    const filtered = (beneficiaries || []).filter((b: any) => {
        const q = search.toLowerCase();
        return (
            b.firstName?.toLowerCase().includes(q) ||
            b.lastName?.toLowerCase().includes(q) ||
            b.email?.toLowerCase().includes(q) ||
            b.bankAccountName?.toLowerCase().includes(q)
        );
    });

    const statusVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
        const map: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
            verified: 'success',
            verifying: 'warning',
            rejected: 'error',
        };
        return map[status] || 'default';
    };

    const formLoading = createMutation.isPending;
    const transferLoading = createQuoteMutation.isPending || createOrderMutation.isPending;

    return (
        <div className="beneficiary-page">
            <PageHeader
                title="Beneficiaries"
                subtitle="Manage your payout recipients"
                action={
                    <Button
                        icon={<Plus size={16} />}
                        onClick={() => {
                            if (activeOrg?.kycStatus !== 'verified') {
                                toast.error('Please complete your KYC verification before adding a beneficiary.');
                                return;
                            }
                            openForm();
                        }}
                        title={activeOrg?.kycStatus !== 'verified' ? 'Verify organization first' : 'Add Beneficiary'}
                    >
                        Add Beneficiary
                    </Button>
                }
            />

            {/* Search */}
            <div className="beneficiary-page__search">
                <Input
                    placeholder="Search beneficiaries..."
                    leftIcon={<Search size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <Card>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Country</th>
                                <th>Account</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="data-table__empty">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <TableEmptyState
                                    colSpan={6}
                                    icon={Users}
                                    message="No beneficiaries found"
                                    description={search ? "Try adjusting your search terms" : "Get started by adding a new beneficiary"}
                                />
                            ) : (
                                filtered.map((b: any) => (
                                    <tr key={b.id} className="data-table__row--clickable" onClick={() => handleRowClick(b)}>
                                        <td>
                                            <span className="beneficiary-table__name">
                                                {b.firstName} {b.lastName}
                                            </span>
                                        </td>
                                        <td>{b.email}</td>
                                        <td>{b.country}</td>
                                        <td className="truncate">
                                            {b.bankAccountName} ••{b.bankAccountNumber?.slice(-4)}
                                        </td>
                                        <td>
                                            <Badge variant={statusVariant(b.status)} dot>
                                                {b.status}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="data-table__actions">
                                                <button
                                                    className="data-table__action"
                                                    onClick={(e) => { e.stopPropagation(); handleRowClick(b); }}
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {b.status === 'verified' && (
                                                    <button
                                                        className="data-table__action"
                                                        onClick={(e) => { e.stopPropagation(); handleSendMoney(b); }}
                                                        title="Send Money"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                )}
                                                {b.status === 'pending' && (
                                                    <button
                                                        className="data-table__action"
                                                        onClick={(e) => handleVerify(b.id, e)}
                                                        title="Verify"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    className="data-table__action data-table__action--danger"
                                                    onClick={(e) => handleDelete(b.id, e)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Beneficiary Detail Dialog */}
            <ResponsiveDialog
                isOpen={showDetail}
                onClose={closeDetail}
                title="Beneficiary Details"
                footer={
                    <div className="data-table__actions" style={{ width: '100%', justifyContent: 'flex-end' }}>
                        {selectedBeneficiary?.status === 'verified' && (
                            <Button icon={<Send size={16} />} onClick={() => handleSendMoney(selectedBeneficiary)}>
                                Send Money
                            </Button>
                        )}
                        {selectedBeneficiary?.status === 'pending' && (
                            <Button variant="secondary" icon={<CheckCircle size={16} />} onClick={() => { handleVerify(selectedBeneficiary.id); closeDetail(); }}>
                                Verify
                            </Button>
                        )}
                        <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => handleDelete(selectedBeneficiary?.id)}>
                            Delete
                        </Button>
                    </div>
                }
            >
                {selectedBeneficiary && (
                    <div className="detail-list">
                        <div className="detail-list__item">
                            <span className="detail-list__label">Full Name</span>
                            <span className="detail-list__value">{selectedBeneficiary.firstName} {selectedBeneficiary.lastName}</span>
                        </div>
                        <div className="detail-list__item">
                            <span className="detail-list__label">Email</span>
                            <span className="detail-list__value">{selectedBeneficiary.email}</span>
                        </div>
                        <div className="detail-list__item">
                            <span className="detail-list__label">Phone</span>
                            <span className="detail-list__value">{selectedBeneficiary.phoneNumber || '—'}</span>
                        </div>
                        <div className="detail-list__item">
                            <span className="detail-list__label">Country</span>
                            <span className="detail-list__value">{selectedBeneficiary.country}</span>
                        </div>
                        <div className="detail-list__item">
                            <span className="detail-list__label">City</span>
                            <span className="detail-list__value">{selectedBeneficiary.city || '—'}</span>
                        </div>
                        <div className="detail-list__item">
                            <span className="detail-list__label">Address</span>
                            <span className="detail-list__value">{selectedBeneficiary.address || '—'}</span>
                        </div>
                        <div className="detail-list__item">
                            <span className="detail-list__label">Zip Code</span>
                            <span className="detail-list__value">{selectedBeneficiary.zipCode || '—'}</span>
                        </div>
                        <div className="detail-list__item">
                            <span className="detail-list__label">Status</span>
                            <span className="detail-list__value">
                                <Badge variant={statusVariant(selectedBeneficiary.status)} dot>
                                    {selectedBeneficiary.status}
                                </Badge>
                            </span>
                        </div>

                        <div className="detail-list__section-title">Bank Details</div>
                        <div className="detail-list__item">
                            <span className="detail-list__label">Account Name</span>
                            <span className="detail-list__value">{selectedBeneficiary.bankAccountName}</span>
                        </div>
                        <div className="detail-list__item">
                            <span className="detail-list__label">Account Number</span>
                            <span className="detail-list__value">{selectedBeneficiary.bankAccountNumber}</span>
                        </div>
                        <div className="detail-list__item">
                            <span className="detail-list__label">Bank Name</span>
                            <span className="detail-list__value">{selectedBeneficiary.bankName || '—'}</span>
                        </div>
                        <div className="detail-list__item">
                            <span className="detail-list__label">Bank Code</span>
                            <span className="detail-list__value">{selectedBeneficiary.bankCode || '—'}</span>
                        </div>
                        <div className="detail-list__item">
                            <span className="detail-list__label">Payment Type</span>
                            <span className="detail-list__value">{selectedBeneficiary.paymentType || '—'}</span>
                        </div>
                    </div>
                )}
            </ResponsiveDialog>

            {/* Transfer Money Dialog */}
            <ResponsiveDialog
                isOpen={showTransfer}
                onClose={() => { closeTransfer(); resetTransfer(); }}
                title={
                    <div className="payout-dialog-title">
                        <Send size={20} />
                        <span>Send Money to {selectedBeneficiary?.firstName} {selectedBeneficiary?.lastName}</span>
                    </div>
                }
                footer={
                    transferForm.quote ? (
                        <>
                            <Button variant="secondary" onClick={() => setTransferField('quote', null)}>Back</Button>
                            <Button loading={transferLoading} onClick={handleConfirmOrder} icon={<ArrowRight size={16} />}>
                                Confirm & Send
                            </Button>
                        </>
                    ) : undefined
                }
            >
                {!transferForm.quote ? (
                    <form onSubmit={handleCreateQuote} className="kyc-form dialog-form" id="transfer-form">
                        <div className="detail-list" style={{ marginBottom: 'var(--space-4)' }}>
                            <div className="detail-list__item">
                                <span className="detail-list__label">Recipient</span>
                                <span className="detail-list__value">{selectedBeneficiary?.firstName} {selectedBeneficiary?.lastName}</span>
                            </div>
                            <div className="detail-list__item">
                                <span className="detail-list__label">Account</span>
                                <span className="detail-list__value">{selectedBeneficiary?.bankAccountName} ••{selectedBeneficiary?.bankAccountNumber?.slice(-4)}</span>
                            </div>
                            <div className="detail-list__item">
                                <span className="detail-list__label">Country</span>
                                <span className="detail-list__value">{selectedBeneficiary?.country}</span>
                            </div>
                        </div>

                        <Input label="Amount" type="number" step="0.01" min="1" value={transferForm.amount} onChange={(e) => setTransferField('amount', e.target.value)} />
                        <div className="drawer__row">
                            <div className="input-group">
                                <label className="input-group__label" htmlFor="transfer-source-currency">Source Currency</label>
                                <select
                                    id="transfer-source-currency"
                                    className="kyc-form__select"
                                    value={transferForm.sourceCurrency}
                                    onChange={(e) => setTransferField('sourceCurrency', e.target.value)}
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-group__label" htmlFor="transfer-target-currency">Target Currency</label>
                                <select
                                    id="transfer-target-currency"
                                    className="kyc-form__select"
                                    value={transferForm.targetCurrency}
                                    onChange={(e) => setTransferField('targetCurrency', e.target.value)}
                                >
                                    <option value="NGN">NGN</option>
                                    <option value="KES">KES</option>
                                    <option value="GHS">GHS</option>
                                    <option value="ZAR">ZAR</option>
                                    <option value="INR">INR</option>
                                </select>
                            </div>
                        </div>
                        <div className="dialog-footer-actions payout-dialog-footer">
                            <Button type="submit" loading={transferLoading} size="lg" fullWidth>
                                Get Quote
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="payout-quote">
                        <h3 className="payout-quote__title">Quote Summary</h3>
                        <div className="payout-quote__details">
                            <div className="payout-quote__row">
                                <span>Recipient</span>
                                <strong>{selectedBeneficiary?.firstName} {selectedBeneficiary?.lastName}</strong>
                            </div>
                            <div className="payout-quote__row">
                                <span>Amount</span>
                                <strong>{transferForm.amount} {transferForm.sourceCurrency}</strong>
                            </div>
                            <div className="payout-quote__row">
                                <span>Exchange Rate</span>
                                <strong>{transferForm.quote.quote?.exchange_rate || transferForm.quote.quote?.rate || '—'}</strong>
                            </div>
                            <div className="payout-quote__row">
                                <span>Fee</span>
                                <strong>{transferForm.quote.quote?.fee || transferForm.quote.quote?.fees || '0'} {transferForm.sourceCurrency}</strong>
                            </div>
                            <div className="payout-quote__row payout-quote__row--total">
                                <span>Recipient Gets</span>
                                <strong>{transferForm.quote.quote?.target_amount || '—'} {transferForm.targetCurrency}</strong>
                            </div>
                        </div>
                    </div>
                )}
            </ResponsiveDialog>

            {/* Add Beneficiary Dialog */}
            <ResponsiveDialog
                isOpen={showForm}
                onClose={closeForm}
                title="Add Beneficiary"
                footer={
                    <>
                        <Button variant="secondary" type="button" onClick={closeForm}>
                            Cancel
                        </Button>
                        <Button type="submit" form="create-beneficiary-form" loading={formLoading}>
                            Create Beneficiary
                        </Button>
                    </>
                }
            >
                <form id="create-beneficiary-form" onSubmit={handleCreate} className="dialog-form">
                    <div className="drawer__row">
                        <Input label="First Name" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} />
                        <Input label="Last Name" value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} />
                    </div>
                    <Input label="Email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
                    <Input label="Phone" value={form.phoneNumber} onChange={(e) => setField('phoneNumber', e.target.value)} />
                    <div className="drawer__row">
                        <Input label="Country" placeholder="US" value={form.country} onChange={(e) => setField('country', e.target.value)} />
                        <Input label="State" value={form.state} onChange={(e) => setField('state', e.target.value)} />
                    </div>
                    <div className="drawer__row">
                        <Input label="City" value={form.city} onChange={(e) => setField('city', e.target.value)} />
                        <Input label="Zip Code" value={form.zipCode} onChange={(e) => setField('zipCode', e.target.value)} />
                    </div>
                    <Input label="Address" value={form.address} onChange={(e) => setField('address', e.target.value)} />

                    <div className="drawer__divider" />
                    <h3 className="drawer__section-title">Bank Details</h3>

                    <Input label="Bank Account Name" value={form.bankAccountName} onChange={(e) => setField('bankAccountName', e.target.value)} />
                    <Input label="Bank Account Number" value={form.bankAccountNumber} onChange={(e) => setField('bankAccountNumber', e.target.value)} />
                    <div className="drawer__row">
                        <Input label="Bank Name" value={form.bankName} onChange={(e) => setField('bankName', e.target.value)} />
                        <Input label={getBankCodeLabel(form.country)} value={form.bankCode} onChange={(e) => setField('bankCode', e.target.value)} placeholder={getBankCodeLabel(form.country)} />
                    </div>
                </form>
            </ResponsiveDialog>
        </div>
    );
};
