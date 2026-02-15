import React, { useState } from 'react';
import {
    ArrowRightLeft,
    Search,
    Download,
    Filter,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Button, Input, Card, Badge, PageHeader, TableEmptyState } from '../../components';
import './Transaction.css';
import { useTransactions, useExportTransactions } from '../../hooks/useTransactions';
import { useOrgStore } from '../../store/orgStore';

export const TransactionPage: React.FC = () => {
    // UI State
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    // Query
    const { activeOrg } = useOrgStore();
    const queryParams: Record<string, any> = { page, limit: 15 };
    if (statusFilter) queryParams.status = statusFilter;
    if (activeOrg?.id) queryParams.orgId = activeOrg.id;

    const { data: transactionData, isLoading: loading } = useTransactions(queryParams, { enabled: !!activeOrg?.id });
    const exportMutation = useExportTransactions();

    // Derived State
    const transactions = transactionData?.items || [];
    const total = transactionData?.total || 0;
    const totalPages = transactionData?.totalPages || 1;

    // Filter Logic
    const filtered = transactions.filter((t: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            t.id.toLowerCase().includes(q) ||
            (t.reference && t.reference.toLowerCase().includes(q)) ||
            (t.mestaTransactionId && t.mestaTransactionId.toLowerCase().includes(q))
        );
    });

    const handleExport = () => {
        exportMutation.mutate(undefined, {
            onSuccess: (data) => {
                const url = window.URL.createObjectURL(new Blob([data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            },
        });
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
            <PageHeader
                title="Transactions"
                subtitle={`${total} total transactions`}
                action={
                    <Button variant="secondary" icon={<Download size={16} />} onClick={handleExport} loading={exportMutation.isPending}>
                        Export CSV
                    </Button>
                }
            />

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
                <div className="table-wrapper">
                    <table className="data-table">
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
                                <tr><td colSpan={6} className="data-table__empty">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <TableEmptyState
                                    colSpan={6}
                                    icon={ArrowRightLeft}
                                    message="No transactions found"
                                    description={search ? "Try adjusting your filters" : "No transaction history available"}
                                />
                            ) : (
                                filtered.map((t: any) => (
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
