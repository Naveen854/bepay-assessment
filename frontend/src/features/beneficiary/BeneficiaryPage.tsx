import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Plus,
    Search,
    CheckCircle,
    Trash2,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, Badge } from '../../components';
import { beneficiaryApi, orgApi } from '../../services/api';
import './Beneficiary.css';

interface BeneficiaryItem {
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

export const BeneficiaryPage: React.FC = () => {
    const [beneficiaries, setBeneficiaries] = useState<BeneficiaryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form state
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        country: '',
        city: '',
        address: '',
        zipCode: '',
        bankAccountName: '',
        bankAccountNumber: '',
        bankCode: '',
        bankName: '',
        paymentType: 'bank_transfer',
    });

    const loadBeneficiaries = useCallback(async () => {
        try {
            const { data } = await beneficiaryApi.list();
            setBeneficiaries(data);
        } catch {
            toast.error('Failed to load beneficiaries');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const { data } = await orgApi.list();
                if (data?.length > 0) {
                    setOrgId(data[0].id);
                }
            } catch { /* ignore */ }
            loadBeneficiaries();
        };
        init();
    }, [loadBeneficiaries]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) {
            toast.error('Create an organization first');
            return;
        }
        setFormLoading(true);
        try {
            await beneficiaryApi.create({ ...form, organizationId: orgId });
            toast.success('Beneficiary created');
            setShowForm(false);
            resetForm();
            loadBeneficiaries();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Creation failed');
        } finally {
            setFormLoading(false);
        }
    };

    const handleVerify = async (id: string) => {
        try {
            await beneficiaryApi.update(id, {}); // trigger verify endpoint
            toast.success('Verification initiated');
            loadBeneficiaries();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Verification failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this beneficiary?')) return;
        try {
            await beneficiaryApi.delete(id);
            toast.success('Beneficiary deleted');
            loadBeneficiaries();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Delete failed');
        }
    };

    const resetForm = () => {
        setForm({
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            country: '',
            city: '',
            address: '',
            zipCode: '',
            bankAccountName: '',
            bankAccountNumber: '',
            bankCode: '',
            bankName: '',
            paymentType: 'bank_transfer',
        });
    };

    const updateField = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const filtered = beneficiaries.filter((b) => {
        const q = search.toLowerCase();
        return (
            b.firstName?.toLowerCase().includes(q) ||
            b.lastName?.toLowerCase().includes(q) ||
            b.email?.toLowerCase().includes(q) ||
            b.bankAccountName?.toLowerCase().includes(q)
        );
    });

    const statusVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
        if (status === 'verified') return 'success';
        if (status === 'verifying') return 'warning';
        if (status === 'rejected') return 'error';
        return 'default';
    };

    return (
        <div className="beneficiary-page">
            <div className="beneficiary-page__header">
                <div>
                    <h1 className="beneficiary-page__title">Beneficiaries</h1>
                    <p className="beneficiary-page__subtitle">
                        Manage your payout recipients
                    </p>
                </div>
                <Button
                    icon={<Plus size={16} />}
                    onClick={() => setShowForm(true)}
                >
                    Add Beneficiary
                </Button>
            </div>

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
                <div className="beneficiary-table__wrapper">
                    <table className="beneficiary-table">
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
                                    <td colSpan={6} className="beneficiary-table__empty">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="beneficiary-table__empty">
                                        <Users size={32} />
                                        <p>No beneficiaries found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((b) => (
                                    <tr key={b.id}>
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
                                            <div className="beneficiary-table__actions">
                                                {b.status === 'pending' && (
                                                    <button
                                                        className="beneficiary-table__action"
                                                        onClick={() => handleVerify(b.id)}
                                                        title="Verify"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    className="beneficiary-table__action beneficiary-table__action--danger"
                                                    onClick={() => handleDelete(b.id)}
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

            {/* Add Beneficiary Drawer */}
            {showForm && (
                <div className="drawer-overlay" onClick={() => setShowForm(false)}>
                    <div className="drawer animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                        <div className="drawer__header">
                            <h2>Add Beneficiary</h2>
                            <button className="drawer__close" onClick={() => setShowForm(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form className="drawer__body" onSubmit={handleCreate}>
                            <div className="drawer__row">
                                <Input label="First Name" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
                                <Input label="Last Name" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
                            </div>
                            <Input label="Email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
                            <Input label="Phone" value={form.phoneNumber} onChange={(e) => updateField('phoneNumber', e.target.value)} />
                            <div className="drawer__row">
                                <Input label="Country" placeholder="US" value={form.country} onChange={(e) => updateField('country', e.target.value)} />
                                <Input label="City" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
                            </div>
                            <Input label="Address" value={form.address} onChange={(e) => updateField('address', e.target.value)} />
                            <Input label="Zip Code" value={form.zipCode} onChange={(e) => updateField('zipCode', e.target.value)} />

                            <div className="drawer__divider" />
                            <h3 className="drawer__section-title">Bank Details</h3>

                            <Input label="Bank Account Name" value={form.bankAccountName} onChange={(e) => updateField('bankAccountName', e.target.value)} />
                            <Input label="Bank Account Number" value={form.bankAccountNumber} onChange={(e) => updateField('bankAccountNumber', e.target.value)} />
                            <div className="drawer__row">
                                <Input label="Bank Name" value={form.bankName} onChange={(e) => updateField('bankName', e.target.value)} />
                                <Input label="Bank Code / IFSC" value={form.bankCode} onChange={(e) => updateField('bankCode', e.target.value)} />
                            </div>

                            <div className="drawer__actions">
                                <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" loading={formLoading}>
                                    Create Beneficiary
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
