import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';
import { describe, it, expect, vi } from 'vitest';

describe('Input', () => {
    it('renders with label', () => {
        render(<Input label="Username" id="user-input" />);
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('renders error message', () => {
        render(<Input error="Invalid input" />);
        expect(screen.getByText('Invalid input')).toBeInTheDocument();
        // Check for error class if possible, or just text
    });

    it('renders helper text', () => {
        render(<Input helperText="Enter your name" />);
        expect(screen.getByText('Enter your name')).toBeInTheDocument();
    });

    it('handles input changes', () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} placeholder="Type here" />);

        const input = screen.getByPlaceholderText('Type here');
        fireEvent.change(input, { target: { value: 'test' } });

        expect(handleChange).toHaveBeenCalled();
        expect((input as HTMLInputElement).value).toBe('test');
    });

    it('renders icon', () => {
        const icon = <span data-testid="icon">ICON</span>;
        render(<Input leftIcon={icon} />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
});
