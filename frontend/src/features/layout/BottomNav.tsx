import React from 'react';
import { NavLink } from 'react-router-dom';
import { navigationItems } from '../../config/navigation';
import './BottomNav.css';

export const BottomNav: React.FC = () => {
    // Show only primary items on mobile to save space
    // Dashboard, Beneficiaries, Payouts, Transactions
    const mobileItems = navigationItems.filter(item =>
        ['/dashboard', '/beneficiaries', '/payouts', '/transactions'].includes(item.to)
    );

    return (
        <nav className="bottom-nav">
            {mobileItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
                    }
                >
                    <item.icon size={24} />
                    <span className="bottom-nav__label">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};
