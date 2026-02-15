import React, { useEffect, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { LoadingSpinner } from './components';
import './index.css';

// Lazy load pages
const DashboardLayout = React.lazy(() => import('./features/layout/DashboardLayout').then(module => ({ default: module.DashboardLayout })));
const LoginPage = React.lazy(() => import('./features/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = React.lazy(() => import('./features/auth/RegisterPage').then(module => ({ default: module.RegisterPage })));
const AcceptInvitePage = React.lazy(() => import('./features/auth/AcceptInvitePage').then(module => ({ default: module.AcceptInvitePage })));
const DashboardPage = React.lazy(() => import('./features/dashboard/DashboardPage').then(module => ({ default: module.DashboardPage })));
const KycPage = React.lazy(() => import('./features/kyc/KycPage').then(module => ({ default: module.KycPage })));
const BeneficiaryPage = React.lazy(() => import('./features/beneficiary/BeneficiaryPage').then(module => ({ default: module.BeneficiaryPage })));
const ProfilePage = React.lazy(() => import('./features/profile/ProfilePage').then(module => ({ default: module.ProfilePage })));
const PayoutPage = React.lazy(() => import('./features/payout/PayoutPage').then(module => ({ default: module.PayoutPage })));
const TransactionPage = React.lazy(() => import('./features/transaction/TransactionPage').then(module => ({ default: module.TransactionPage })));
const OrganizationPage = React.lazy(() => import('./features/organization/OrganizationPage').then(module => ({ default: module.OrganizationPage })));
const OnboardingPage = React.lazy(() => import('./features/onboarding/OnboardingPage').then(module => ({ default: module.OnboardingPage })));
const WelcomePage = React.lazy(() => import('./features/onboarding/WelcomePage').then(module => ({ default: module.WelcomePage })));
const InvitePage = React.lazy(() => import('./features/invite/InvitePage').then(module => ({ default: module.InvitePage })));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth/login" />;
  if (user?.onboardingStatus === 'new') return <Navigate to="/welcome" />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) return null; // Prevent flicker

  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-error)',
              secondary: '#fff',
            },
          },
        }}
      />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/invite" element={<AcceptInvitePage />} />

          {/* Protected Welcome Route */}
          <Route
            path="/welcome"
            element={
              isAuthenticated ? <WelcomePage /> : <Navigate to="/auth/login" />
            }
          />

          {/* Onboarding Route */}
          <Route
            path="/onboarding"
            element={
              isAuthenticated ? <OnboardingPage /> : <Navigate to="/auth/login" />
            }
          />

          {/* Protected Dashboard Routes */}
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="kyc" element={<KycPage />} />
            <Route path="beneficiaries" element={<BeneficiaryPage />} />
            <Route path="payouts" element={<PayoutPage />} />
            <Route path="transactions" element={<TransactionPage />} />
            <Route path="settings" element={<OrganizationPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="invite" element={<InvitePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
