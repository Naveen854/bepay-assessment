import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfilePage } from './ProfilePage';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kycApi, authApi } from '../../services/api';

// Mock stores
const mockUser = { name: 'Test User', email: 'test@example.com' };
const mockActiveOrg = { id: 'org-1' };

vi.mock('../../store/authStore', () => ({
    useAuthStore: () => ({ user: mockUser }),
}));

vi.mock('../../store/orgStore', () => ({
    useOrgStore: () => ({ activeOrg: mockActiveOrg }),
}));

// Mock APIs
vi.mock('../../services/api', () => ({
    kycApi: {
        getStatus: vi.fn(),
    },
    authApi: {
        changePassword: vi.fn(),
    },
}));

// Mock UI components that might cause issues or just to speed up
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('ProfilePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders user information', async () => {
        (kycApi.getStatus as any).mockResolvedValue({ data: { status: 'verified' } });

        render(<ProfilePage />);

        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('Personal Information')).toBeInTheDocument();

        await waitFor(() => {
            expect(kycApi.getStatus).toHaveBeenCalledWith('org-1');
        });
        expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('opens change password dialog', async () => {
        (kycApi.getStatus as any).mockResolvedValue({ data: { status: 'verified' } });
        render(<ProfilePage />);

        fireEvent.click(screen.getByText('Change Password'));
        expect(screen.getByText('Enter your current password and a new strong password.')).toBeInTheDocument();
    });

    it('handles password change submission', async () => {
        (kycApi.getStatus as any).mockResolvedValue({ data: { status: 'verified' } });
        (authApi.changePassword as any).mockResolvedValue({});

        render(<ProfilePage />);

        fireEvent.click(screen.getByText('Change Password'));

        fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'oldpass' } });
        fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass123' } });
        fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'newpass123' } });

        fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

        await waitFor(() => {
            expect(authApi.changePassword).toHaveBeenCalledWith({
                currentPassword: 'oldpass',
                newPassword: 'newpass123',
            });
        });
    });
});
