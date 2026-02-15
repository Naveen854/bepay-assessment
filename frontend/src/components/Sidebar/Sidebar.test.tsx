import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock navigation config
vi.mock('../../config/navigation', () => ({
    navigationItems: [
        { label: 'Dashboard', to: '/dashboard', icon: () => <span data-testid="icon-dashboard" /> },
        { label: 'Beneficiaries', to: '/beneficiaries', icon: () => <span data-testid="icon-beneficiaries" /> },
    ],
}));

describe('Sidebar', () => {
    it('renders navigation items', () => {
        render(
            <MemoryRouter>
                <Sidebar collapsed={false} onToggle={() => { }} />
            </MemoryRouter>
        );

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Beneficiaries')).toBeInTheDocument();
        expect(screen.getByText('bepay')).toBeInTheDocument();
    });

    it('renders in collapsed state', () => {
        render(
            <MemoryRouter>
                <Sidebar collapsed={true} onToggle={() => { }} />
            </MemoryRouter>
        );

        expect(screen.queryByText('bepay')).not.toBeInTheDocument();
        expect(screen.getByTestId('icon-dashboard')).toBeInTheDocument();
    });

    it('handles toggle', () => {
        const handleToggle = vi.fn();
        const { container } = render(
            <MemoryRouter>
                <Sidebar collapsed={false} onToggle={handleToggle} />
            </MemoryRouter>
        );

        const toggleBtn = container.querySelector('.sidebar__toggle');
        expect(toggleBtn).toBeInTheDocument();

        if (toggleBtn) {
            fireEvent.click(toggleBtn);
            expect(handleToggle).toHaveBeenCalled();
        }
    });
});
