import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import './DashboardLayout.css';

export const DashboardLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className={`layout ${sidebarCollapsed ? 'layout--collapsed' : ''}`}>
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <main className="layout__main">
                <Outlet />
            </main>
        </div>
    );
};
