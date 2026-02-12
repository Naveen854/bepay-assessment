import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Send,
    ArrowRightLeft,
    FileText,
    Settings,
    LogOut,
    Shield,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import './Sidebar.css';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/kyc', icon: Shield, label: 'KYC / Onboarding' },
    { to: '/beneficiaries', icon: Users, label: 'Beneficiaries' },
    { to: '/payouts', icon: Send, label: 'Payouts' },
    { to: '/transactions', icon: ArrowRightLeft, label: 'Transactions' },
    { to: '/reconciliation', icon: FileText, label: 'Reconciliation' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/auth/login');
    };

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
            {/* Logo */}
            <div className="sidebar__logo">
                <div className="sidebar__logo-icon">B</div>
                {!collapsed && <span className="sidebar__logo-text">bepay</span>}
            </div>

            {/* Navigation */}
            <nav className="sidebar__nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                        }
                        title={collapsed ? item.label : undefined}
                    >
                        <item.icon size={20} />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar__footer">
                {!collapsed && user && (
                    <div className="sidebar__user">
                        <div className="sidebar__avatar">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="sidebar__user-info">
                            <span className="sidebar__user-name">{user.name}</span>
                            <span className="sidebar__user-email">{user.email}</span>
                        </div>
                    </div>
                )}
                <button className="sidebar__link" onClick={handleLogout} title="Logout">
                    <LogOut size={20} />
                    {!collapsed && <span>Logout</span>}
                </button>
                <button className="sidebar__toggle" onClick={onToggle}>
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>
        </aside>
    );
};
