import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterPage } from './RegisterPage';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../../store/authStore', () => ({
    useAuthStore: () => ({
        register: mockRegister,
    }),
}));

vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('RegisterPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders registration form', () => {
        render(
            <MemoryRouter>
                <RegisterPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Create account')).toBeInTheDocument();
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('submits form with valid data', async () => {
        mockRegister.mockResolvedValueOnce(undefined);

        render(
            <MemoryRouter>
                <RegisterPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/full name/i), {
            target: { value: 'Test User' },
        });
        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'password123' },
        });

        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith(
                'test@example.com',
                'Test User',
                'password123'
            );
        });

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('shows error on registration failure', async () => {
        mockRegister.mockRejectedValueOnce({ response: { data: { message: 'Email already exists' } } });

        render(
            <MemoryRouter>
                <RegisterPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/full name/i), {
            target: { value: 'Test User' },
        });
        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'password123' },
        });

        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalled();
        });

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
