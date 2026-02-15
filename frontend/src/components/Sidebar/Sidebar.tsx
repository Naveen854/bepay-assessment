import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { navigationItems } from '../../config/navigation';
import './Sidebar.css';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    className?: string; // Allow passing d-none classes
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, className = '' }) => {
    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${className}`}>
            {/* Logo */}
            <div className="sidebar__logo">
                <div className="sidebar__logo-icon">B</div>
                {!collapsed && <span className="sidebar__logo-text">bepay</span>}
            </div>

            {/* Navigation */}
            <nav className="sidebar__nav">
                {navigationItems.map((item) => (
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

            {/* Footer - Toggle Only */}
            <div className="sidebar__footer">
                <button className="sidebar__toggle" onClick={onToggle}>
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>
        </aside>
    );
};
