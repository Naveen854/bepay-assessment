import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Users,
    Send,
    TrendingUp,
    Download,
    RefreshCw,
} from 'lucide-react';
import { Card, CardBody, Badge, Button, ResponsiveDialog } from '../../components';
import './Dashboard.css';
import { transactionApi } from '../../services/api';
import toast from 'react-hot-toast';
import { useOrgStore } from '../../store/orgStore';
import { KycWizard } from '../kyc/KycWizard';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { activeOrg } = useOrgStore();
    const [isSyncing, setIsSyncing] = useState(false);
    const [openKyc, setOpenKyc] = useState(false);

    const handleSync = async () => {
        if (!activeOrg) return;
        setIsSyncing(true);
        try {
            await transactionApi.sync(activeOrg.id);
            toast.success('Transactions synced successfully');
        } catch (error) {
            toast.error('Failed to sync transactions');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExport = async () => {
        if (!activeOrg) return;
        try {
            const response = await transactionApi.exportCsv({ orgId: activeOrg.id });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `transactions-${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to export transactions');
        }
    };

    // Derived Key Stats
    const kycStatus = activeOrg?.kycStatus || 'pending';

    const kycDisplay = useMemo(() => {
        if (!activeOrg) return { label: 'Not Started', color: 'default' as const };
        if (kycStatus === 'verified') return { label: 'Active', color: 'success' as const };
        if (kycStatus === 'processing' || kycStatus === 'under_review') return { label: 'Processing', color: 'info' as const };
        if (kycStatus === 'rejected') return { label: 'Rejected', color: 'error' as const };
        return { label: 'Pending', color: 'warning' as const };
    }, [kycStatus, activeOrg]);

    const currentStats = useMemo(() => [
        { label: 'Total Payouts', value: '—', icon: Send, trend: null },
        { label: 'Active Beneficiaries', value: '—', icon: Users, trend: null },
        { label: 'Volume (30d)', value: '—', icon: TrendingUp, trend: null },
        { label: 'KYC Status', value: kycDisplay.label, icon: Shield, trend: null, color: kycDisplay.color },
    ], [kycDisplay]);

    const handleStepClick = (path: string, state?: any) => {
        if (kycStatus !== 'verified' && path !== '/profile') {
            toast.error('Please complete your KYC verification before performing this action.');
            return;
        }
        // Special case for KYC step
        if (path === '/profile' && state?.openKyc) {
            setOpenKyc(true);
            return;
        }
        navigate(path, { state });
    };

    const handleCreateOrg = () => {
        navigate('/onboarding');
    };

    // Unified Dashboard View logic now handles !activeOrg case

    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <div>
                    <h1 className="dashboard__title">Dashboard</h1>
                    <p className="dashboard__subtitle">
                        {activeOrg ? (
                            <>Overview of your payment operations for <strong>{activeOrg.name}</strong></>
                        ) : (
                            <>Welcome to Bepay! Please set up your organization to get started.</>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" icon={<RefreshCw size={16} />} onClick={handleSync} loading={isSyncing} disabled={!activeOrg}>
                        Sync
                    </Button>
                    <Button variant="secondary" icon={<Download size={16} />} onClick={handleExport} disabled={!activeOrg}>
                        Export
                    </Button>
                </div>
            </div>

            {/* KYC Alert if not verified OR No Organization */}
            {(!activeOrg || kycStatus !== 'verified') && (
                <Card className="dashboard__alert">
                    <CardBody>
                        <div className="dashboard__alert-body">
                            <div>
                                <h3 className="dashboard__alert-heading">
                                    <Shield size={20} />
                                    {!activeOrg ? 'Setup Required' :
                                        (kycStatus === 'processing' || kycStatus === 'under_review'
                                            ? 'Verification in Progress'
                                            : 'Complete Identity Verification')}
                                </h3>
                                <p className="dashboard__alert-text">
                                    {!activeOrg ? 'You need to create an organization to start processing payments.' :
                                        (kycStatus === 'processing' || kycStatus === 'under_review'
                                            ? 'Your documents are being reviewed. This usually takes 24-48 hours.'
                                            : 'You must complete KYC verification to enable payouts and add beneficiaries.')}
                                </p>
                            </div>
                            <Button
                                onClick={() => !activeOrg ? handleCreateOrg() : setOpenKyc(true)}
                                variant={kycStatus === 'processing' || kycStatus === 'under_review' ? 'secondary' : 'primary'}
                                disabled={!!activeOrg && (kycStatus === 'processing' || kycStatus === 'under_review')}
                            >
                                {!activeOrg ? 'Setup Organization' :
                                    (kycStatus === 'processing' || kycStatus === 'under_review' ? 'Processing...' : 'Verify Now')}
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Stats Grid */}
            <div className="dashboard__stats">
                {currentStats.map((stat) => (
                    <Card key={stat.label} hoverable>
                        <CardBody>
                            <div className="stat-card">
                                <div className={`stat-card__icon ${stat.color && stat.color !== 'default' ? `stat-card__icon--${stat.color}` : ''}`}>
                                    <stat.icon size={22} />
                                </div>
                                <div className="stat-card__content">
                                    <span className="stat-card__label">{stat.label}</span>
                                    <span className={`stat-card__value ${stat.color && stat.color !== 'default' ? `stat-card__value--${stat.color}` : ''}`}>
                                        {stat.value}
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Quick Actions — hide section when everything is done */}
            {(!activeOrg || kycStatus !== 'verified') && (
                <div className="dashboard__section">
                    <h2 className="dashboard__section-title">Getting Started</h2>
                    <div className="dashboard__steps">
                        {!activeOrg && (
                            <div className="step-card" onClick={handleCreateOrg}>
                                <div className="step-card__number">1</div>
                                <div className="step-card__content">
                                    <h3>Create Organization</h3>
                                    <p>Set up your business profile</p>
                                </div>
                                <Badge variant="warning">Pending</Badge>
                            </div>
                        )}

                        {!(activeOrg && kycStatus === 'verified') && (
                            <div className="step-card" onClick={() => handleStepClick('/profile', { openKyc: true })}>
                                <div className="step-card__number">{!activeOrg ? 2 : 1}</div>
                                <div className="step-card__content">
                                    <h3>Complete KYC</h3>
                                    <p>Submit your business documents for verification</p>
                                </div>
                                <Badge variant={!activeOrg ? 'default' : kycDisplay.color}>{!activeOrg ? 'Locked' : kycDisplay.label}</Badge>
                            </div>
                        )}

                        <div className="step-card" onClick={() => handleStepClick('/beneficiaries', { openCreate: true })}>
                            <div className="step-card__number">{!activeOrg ? 3 : kycStatus !== 'verified' ? 2 : 1}</div>
                            <div className="step-card__content">
                                <h3>Add Beneficiaries</h3>
                                <p>Set up your payout recipients</p>
                            </div>
                            <Badge>{kycStatus === 'verified' ? 'Ready' : 'Locked'}</Badge>
                        </div>
                        <div className="step-card" onClick={() => handleStepClick('/payouts', { openCreate: true })}>
                            <div className="step-card__number">{!activeOrg ? 4 : kycStatus !== 'verified' ? 3 : 2}</div>
                            <div className="step-card__content">
                                <h3>Make Your First Payout</h3>
                                <p>Initiate a cross-border payment</p>
                            </div>
                            <Badge>{kycStatus === 'verified' ? 'Ready' : 'Locked'}</Badge>
                        </div>
                    </div>
                </div>
            )}

            <ResponsiveDialog
                isOpen={openKyc}
                onClose={() => setOpenKyc(false)}
                title="Identity Verification"
            >
                <div className="dashboard__kyc-dialog">
                    <KycWizard onComplete={() => {
                        setOpenKyc(false);
                        window.location.reload();
                    }} />
                </div>
            </ResponsiveDialog>
        </div>
    );
};
