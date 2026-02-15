import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import './DashboardLayout.css';

import { useOrgStore } from '../../store/orgStore';

export const DashboardLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { fetchOrgs, activeOrg } = useOrgStore();

    React.useEffect(() => {
        fetchOrgs();
    }, [fetchOrgs]);

    return (
        <div className={`layout ${sidebarCollapsed ? 'layout--collapsed' : ''}`}>
            {/* Desktop Sidebar: Hidden on mobile (d-md-none handled by CSS class passed or wrapper? 
                Sidebar prop accepts className now. but strictly Sidebar usually has media queries.
                Let's pass className="d-none d-md-block" to Sidebar.
             */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="d-none d-md-block"
            />

            <div className="layout__content">
                <Header />

                {activeOrg && activeOrg.kycStatus !== 'verified' && (
                    <div className="layout__kyc-banner">
                        <span>⚠️</span>
                        <span>
                            <strong>Account Under Review:</strong> You cannot process payouts until your organization is verified.
                        </span>
                    </div>
                )}

                <main className="layout__main" id="main-content">
                    <Outlet />
                </main>
                <div className="d-md-none">
                    <BottomNav />
                </div>
            </div>
        </div>
    );
};
