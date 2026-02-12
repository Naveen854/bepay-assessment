import React, { useState, useEffect, useCallback } from 'react';
import {
    Send,
    DollarSign,
    ArrowRight,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, Badge } from '../../components';
import { payoutApi, beneficiaryApi, orgApi } from '../../services/api';
import './Payout.css';

interface PayoutItem {
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

interface BeneficiaryOption {
    id: string;
    firstName: string;
    lastName?: string;
    country: string;
}

export const PayoutPage: React.FC = () => {
    const [payouts, setPayouts] = useState<PayoutItem[]>([]);
    const [beneficiaries, setBeneficiaries] = useState<BeneficiaryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    // Quote form
    const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
    const [amount, setAmount] = useState('');
    const [sourceCurrency, setSourceCurrency] = useState('USD');
    const [targetCurrency, setTargetCurrency] = useState('NGN');

    // Quote result
    const [quoteResult, setQuoteResult] = useState<any>(null);

    const loadPayouts = useCallback(async () => {
        try {
            const { data } = await payoutApi.list();
            setPayouts(Array.isArray(data) ? data : []);
        } catch {
            // empty
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const { data: orgs } = await orgApi.list();
                if (orgs?.length > 0) {
                    setOrgId(orgs[0].id);
                }
                const { data: bens } = await beneficiaryApi.list();
                setBeneficiaries(Array.isArray(bens) ? bens : []);
            } catch { /* ignore */ }
            loadPayouts();
        };
        init();
    }, [loadPayouts]);

    const handleCreateQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId || !selectedBeneficiary || !amount) {
            toast.error('Fill in all fields');
            return;
        }
        setFormLoading(true);
        try {
            const { data } = await payoutApi.createQuote({
                organizationId: orgId,
                beneficiaryId: selectedBeneficiary,
                amount: parseFloat(amount),
                sourceCurrency,
                targetCurrency,
            });
            setQuoteResult(data);
            toast.success('Quote received!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Quote failed');
        } finally {
            setFormLoading(false);
        }
    };

    const handleConfirmOrder = async () => {
        if (!quoteResult?.quote?.id || !orgId) return;
        setFormLoading(true);
        try {
            await payoutApi.createOrder({
                organizationId: orgId,
                quoteId: quoteResult.quote.id,
                purpose: 'Payment for services',
            });
            toast.success('Payout order created!');
            setShowForm(false);
            setQuoteResult(null);
            setAmount('');
            loadPayouts();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Order failed');
        } finally {
            setFormLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await payoutApi.cancelOrder(id);
            toast.success('Order cancelled');
            loadPayouts();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Cancel failed');
        }
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

    return (
        <div className="payout-page">
            <div className="payout-page__header">
                <div>
                    <h1 className="payout-page__title">Payouts</h1>
                    <p className="payout-page__subtitle">Create and manage cross-border payouts</p>
                </div>
                <Button icon={<Send size={16} />} onClick={() => { setShowForm(true); setQuoteResult(null); }}>
                    New Payout
                </Button>
            </div>

            {/* Payouts Table */}
            <Card>
                <div className="beneficiary-table__wrapper">
                    <table className="beneficiary-table">
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
                            {loading ? (
                                <tr><td colSpan={7} className="beneficiary-table__empty">Loading...</td></tr>
                            ) : payouts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="beneficiary-table__empty">
                                        <Send size={32} />
                                        <p>No payouts yet</p>
                                    </td>
                                </tr>
                            ) : (
                                payouts.map((p) => (
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
                                            <div className="beneficiary-table__actions">
                                                {['quoted', 'ordered'].includes(p.status) && (
                                                    <button className="beneficiary-table__action beneficiary-table__action--danger" onClick={() => handleCancel(p.id)} title="Cancel">
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

            {/* New Payout Drawer */}
            {showForm && (
                <div className="drawer-overlay" onClick={() => setShowForm(false)}>
                    <div className="drawer animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                        <div className="drawer__header">
                            <h2><DollarSign size={20} /> New Payout</h2>
                            <button className="drawer__close" onClick={() => setShowForm(false)}><X size={20} /></button>
                        </div>
                        <div className="drawer__body">
                            {!quoteResult ? (
                                <form onSubmit={handleCreateQuote} className="kyc-form">
                                    <div className="input-group">
                                        <label className="input-group__label">Beneficiary</label>
                                        <select className="kyc-form__select" value={selectedBeneficiary} onChange={(e) => setSelectedBeneficiary(e.target.value)}>
                                            <option value="">Select recipient</option>
                                            {beneficiaries.map((b) => (
                                                <option key={b.id} value={b.id}>{b.firstName} {b.lastName} — {b.country}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Input label="Amount" type="number" step="0.01" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                    <div className="drawer__row">
                                        <div className="input-group">
                                            <label className="input-group__label">Source Currency</label>
                                            <select className="kyc-form__select" value={sourceCurrency} onChange={(e) => setSourceCurrency(e.target.value)}>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-group__label">Target Currency</label>
                                            <select className="kyc-form__select" value={targetCurrency} onChange={(e) => setTargetCurrency(e.target.value)}>
                                                <option value="NGN">NGN</option>
                                                <option value="KES">KES</option>
                                                <option value="GHS">GHS</option>
                                                <option value="ZAR">ZAR</option>
                                                <option value="INR">INR</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Button type="submit" loading={formLoading} size="lg" fullWidth>
                                        Get Quote
                                    </Button>
                                </form>
                            ) : (
                                <div className="payout-quote">
                                    <h3 className="payout-quote__title">Quote Summary</h3>
                                    <div className="payout-quote__details">
                                        <div className="payout-quote__row">
                                            <span>Amount</span>
                                            <strong>{amount} {sourceCurrency}</strong>
                                        </div>
                                        <div className="payout-quote__row">
                                            <span>Exchange Rate</span>
                                            <strong>{quoteResult.quote?.exchange_rate || quoteResult.quote?.rate || '—'}</strong>
                                        </div>
                                        <div className="payout-quote__row">
                                            <span>Fee</span>
                                            <strong>{quoteResult.quote?.fee || quoteResult.quote?.fees || '0'} {sourceCurrency}</strong>
                                        </div>
                                        <div className="payout-quote__row payout-quote__row--total">
                                            <span>Recipient Gets</span>
                                            <strong>{quoteResult.quote?.target_amount || '—'} {targetCurrency}</strong>
                                        </div>
                                    </div>
                                    <div className="drawer__actions">
                                        <Button variant="secondary" onClick={() => setQuoteResult(null)}>Back</Button>
                                        <Button loading={formLoading} onClick={handleConfirmOrder} icon={<ArrowRight size={16} />}>
                                            Confirm & Send
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
