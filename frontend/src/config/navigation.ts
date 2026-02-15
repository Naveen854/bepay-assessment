import {
    LayoutDashboard,
    Users,
    Send,
    ArrowRightLeft,
    Settings,
    UserPlus,
} from 'lucide-react';

export const navigationItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    // { to: '/kyc', icon: Shield, label: 'KYC' }, // Removed from sidebar, moved to Profile
    { to: '/beneficiaries', icon: Users, label: 'Beneficiaries' },
    { to: '/payouts', icon: Send, label: 'Payouts' },
    { to: '/transactions', icon: ArrowRightLeft, label: 'Transactions' },
    // { to: '/reconciliation', icon: FileText, label: 'Reconciliation' }, // Commented out or hidden if not ready
    { to: '/invite', icon: UserPlus, label: 'Invite' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

