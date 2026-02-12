import React, { useState } from 'react';
import {
    FileText,
    Download,
    Calendar,
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, CardHeader, CardBody } from '../../components';
import { transactionApi } from '../../services/api';
import './Reconciliation.css';

export const ReconciliationPage: React.FC = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);

    const handleGenerate = async () => {
        if (!startDate || !endDate) {
            toast.error('Select a date range');
            return;
        }
        setLoading(true);
        try {
            const { data } = await transactionApi.list({
                startDate,
                endDate,
                limit: 1000,
            });
            const items = data.items || [];

            // Build reconciliation summary
            const summary = {
                totalTransactions: items.length,
                totalAmount: items.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0),
                byStatus: {} as Record<string, { count: number; amount: number }>,
                byType: {} as Record<string, { count: number; amount: number }>,
            };

            for (const tx of items) {
                // Group by status
                if (!summary.byStatus[tx.status]) {
                    summary.byStatus[tx.status] = { count: 0, amount: 0 };
                }
                summary.byStatus[tx.status].count++;
                summary.byStatus[tx.status].amount += parseFloat(tx.amount || 0);

                // Group by type
                if (!summary.byType[tx.type]) {
                    summary.byType[tx.type] = { count: 0, amount: 0 };
                }
                summary.byType[tx.type].count++;
                summary.byType[tx.type].amount += parseFloat(tx.amount || 0);
            }

            setReport({ ...summary, items, startDate, endDate });
            toast.success('Report generated');
        } catch {
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const { data } = await transactionApi.exportCsv({ startDate, endDate });
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reconciliation_${startDate}_${endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('CSV exported');
        } catch {
            toast.error('Export failed');
        }
    };

    return (
        <div className="reconciliation-page">
            <div className="reconciliation-page__header">
                <div>
                    <h1 className="reconciliation-page__title">Reconciliation</h1>
                    <p className="reconciliation-page__subtitle">Generate reports and reconcile transactions</p>
                </div>
            </div>

            {/* Date Range Selector */}
            <Card padding="lg" className="reconciliation-page__generator">
                <CardHeader><Calendar size={20} /> Report Period</CardHeader>
                <CardBody>
                    <div className="reconciliation-page__date-row">
                        <Input
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <Button
                            loading={loading}
                            onClick={handleGenerate}
                            icon={<RefreshCw size={16} />}
                            size="lg"
                        >
                            Generate Report
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Report */}
            {report && (
                <div className="reconciliation-report animate-fade-in-up">
                    {/* Summary Cards */}
                    <div className="reconciliation-report__summary">
                        <Card padding="md" hoverable>
                            <CardBody>
                                <div className="reconciliation-stat">
                                    <span className="reconciliation-stat__label">Total Transactions</span>
                                    <span className="reconciliation-stat__value">{report.totalTransactions}</span>
                                </div>
                            </CardBody>
                        </Card>
                        <Card padding="md" hoverable>
                            <CardBody>
                                <div className="reconciliation-stat">
                                    <span className="reconciliation-stat__label">Total Volume</span>
                                    <span className="reconciliation-stat__value">${report.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </CardBody>
                        </Card>
                        <Card padding="md" hoverable>
                            <CardBody>
                                <div className="reconciliation-stat">
                                    <span className="reconciliation-stat__label">Completed</span>
                                    <span className="reconciliation-stat__value reconciliation-stat__value--success">
                                        <CheckCircle2 size={18} /> {report.byStatus?.completed?.count || 0}
                                    </span>
                                </div>
                            </CardBody>
                        </Card>
                        <Card padding="md" hoverable>
                            <CardBody>
                                <div className="reconciliation-stat">
                                    <span className="reconciliation-stat__label">Failed</span>
                                    <span className="reconciliation-stat__value reconciliation-stat__value--error">
                                        <AlertTriangle size={18} /> {report.byStatus?.failed?.count || 0}
                                    </span>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Breakdown by Status */}
                    <div className="reconciliation-report__breakdown">
                        <Card padding="md">
                            <CardHeader><FileText size={18} /> By Status</CardHeader>
                            <CardBody>
                                <table className="reconciliation-breakdown__table">
                                    <thead>
                                        <tr><th>Status</th><th>Count</th><th>Amount</th></tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(report.byStatus).map(([status, data]: [string, any]) => (
                                            <tr key={status}>
                                                <td className="capitalize">{status}</td>
                                                <td>{data.count}</td>
                                                <td>${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardBody>
                        </Card>

                        <Card padding="md">
                            <CardHeader><FileText size={18} /> By Type</CardHeader>
                            <CardBody>
                                <table className="reconciliation-breakdown__table">
                                    <thead>
                                        <tr><th>Type</th><th>Count</th><th>Amount</th></tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(report.byType).map(([type, data]: [string, any]) => (
                                            <tr key={type}>
                                                <td className="capitalize">{type}</td>
                                                <td>{data.count}</td>
                                                <td>${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Export */}
                    <div className="reconciliation-report__export">
                        <Button variant="secondary" icon={<Download size={16} />} onClick={handleExport}>
                            Export Full Report as CSV
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
