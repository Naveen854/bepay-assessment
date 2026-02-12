import React from 'react';
import {
    Shield,
    Users,
    Send,
    TrendingUp,
} from 'lucide-react';
import { Card, CardBody, Badge } from '../../components';
import './Dashboard.css';

const stats = [
    { label: 'Total Payouts', value: '—', icon: Send, trend: null },
    { label: 'Active Beneficiaries', value: '—', icon: Users, trend: null },
    { label: 'Volume (30d)', value: '—', icon: TrendingUp, trend: null },
    { label: 'KYC Status', value: 'Not Started', icon: Shield, trend: null },
];

export const DashboardPage: React.FC = () => {
    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <h1 className="dashboard__title">Dashboard</h1>
                <p className="dashboard__subtitle">
                    Overview of your payment operations
                </p>
            </div>

            {/* Stats Grid */}
            <div className="dashboard__stats">
                {stats.map((stat) => (
                    <Card key={stat.label} hoverable>
                        <CardBody>
                            <div className="stat-card">
                                <div className="stat-card__icon">
                                    <stat.icon size={22} />
                                </div>
                                <div className="stat-card__content">
                                    <span className="stat-card__label">{stat.label}</span>
                                    <span className="stat-card__value">{stat.value}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="dashboard__section">
                <h2 className="dashboard__section-title">Getting Started</h2>
                <div className="dashboard__steps">
                    <div className="step-card">
                        <div className="step-card__number">1</div>
                        <div className="step-card__content">
                            <h3>Complete KYC</h3>
                            <p>Submit your business documents for verification</p>
                        </div>
                        <Badge variant="warning" dot>Pending</Badge>
                    </div>
                    <div className="step-card">
                        <div className="step-card__number">2</div>
                        <div className="step-card__content">
                            <h3>Add Beneficiaries</h3>
                            <p>Set up your payout recipients</p>
                        </div>
                        <Badge>Not Started</Badge>
                    </div>
                    <div className="step-card">
                        <div className="step-card__number">3</div>
                        <div className="step-card__content">
                            <h3>Make Your First Payout</h3>
                            <p>Initiate a cross-border payment</p>
                        </div>
                        <Badge>Not Started</Badge>
                    </div>
                </div>
            </div>
        </div>
    );
};
