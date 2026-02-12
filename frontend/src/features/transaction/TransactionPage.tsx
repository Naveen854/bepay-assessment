import React, { useState, useEffect, useCallback } from 'react';
import {
    ArrowRightLeft,
    Search,
    Download,
    Filter,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components';
import { transactionApi } from '../../services/api';
import './Transaction.css';

interface TransactionItem {
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    reference?: string;
    mestaTransactionId?: string;
    createdAt: string;
}

export const TransactionPage: React.FC = () => {
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const loadTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page, limit: 15 };
            if (statusFilter) params.status = statusFilter;
            const { data } = await transactionApi.list(params);
            setTransactions(data.items || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
        } catch {
            // empty
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const filtered = transactions.filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            t.id.toLowerCase().includes(q) ||
            t.reference?.toLowerCase().includes(q) ||
            t.mestaTransactionId?.toLowerCase().includes(q)
        );
    });

    const handleExport = async () => {
        try {
            const { data } = await transactionApi.exportCsv();
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            // silent
        }
    };

    const statusVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
        const map: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
            completed: 'success',
            processing: 'warning',
            pending: 'warning',
            failed: 'error',
        };
        return map[status] || 'default';
    };

    return (
        <div className="transaction-page">
            <div className="transaction-page__header">
                <div>
                    <h1 className="transaction-page__title">Transactions</h1>
                    <p className="transaction-page__subtitle">{total} total transactions</p>
                </div>
                <Button variant="secondary" icon={<Download size={16} />} onClick={handleExport}>
                    Export CSV
                </Button>
            </div>

            {/* Filters */}
            <div className="transaction-page__filters">
                <Input
                    placeholder="Search by ID or reference..."
                    leftIcon={<Search size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="transaction-page__filter-group">
                    <Filter size={14} />
                    <select
                        className="kyc-form__select"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <Card>
                <div className="beneficiary-table__wrapper">
                    <table className="beneficiary-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Currency</th>
                                <th>Reference</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="beneficiary-table__empty">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="beneficiary-table__empty">
                                        <ArrowRightLeft size={32} />
                                        <p>No transactions found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((t) => (
                                    <tr key={t.id}>
                                        <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`transaction-type transaction-type--${t.type}`}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td><strong>{t.amount}</strong></td>
                                        <td>{t.currency}</td>
                                        <td className="truncate">{t.reference || t.mestaTransactionId || '—'}</td>
                                        <td><Badge variant={statusVariant(t.status)} dot>{t.status}</Badge></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="transaction-page__pagination">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            icon={<ChevronLeft size={14} />}
                        >
                            Prev
                        </Button>
                        <span className="transaction-page__pagination-info">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            icon={<ChevronRight size={14} />}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};
