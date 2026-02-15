import React from 'react';
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardLayout } from './features/layout/DashboardLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { KycPage } from './features/kyc/KycPage';
import { BeneficiaryPage } from './features/beneficiary/BeneficiaryPage';
import { PayoutPage } from './features/payout/PayoutPage';
import { TransactionPage } from './features/transaction/TransactionPage';
import { ReconciliationPage } from './features/reconciliation/ReconciliationPage';

import './Router.css';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="loading-overlay">
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    return <>{children}</>;
};

// Placeholder pages for later phases
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
    <div className="placeholder-page">
        <h1 className="placeholder-title">
            {title}
        </h1>
        <p className="placeholder-text">
            This section is coming soon.
        </p>
    </div>
);

export const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Auth routes */}
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />

                {/* Protected dashboard routes */}
                <Route
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/kyc" element={<KycPage />} />
                    <Route path="/beneficiaries" element={<BeneficiaryPage />} />
                    <Route path="/payouts" element={<PayoutPage />} />
                    <Route path="/transactions" element={<TransactionPage />} />
                    <Route path="/reconciliation" element={<ReconciliationPage />} />
                    <Route path="/settings" element={<PlaceholderPage title="Organization Settings" />} />
                </Route>

                {/* Default redirect */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
};
