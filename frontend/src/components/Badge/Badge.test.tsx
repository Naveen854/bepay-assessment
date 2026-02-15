import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';
import { describe, it, expect } from 'vitest';

describe('Badge', () => {
    it('renders children correctly', () => {
        render(<Badge>Status</Badge>);
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('applies variant classes', () => {
        const { container } = render(<Badge variant="success">Active</Badge>);
        expect(container.firstChild).toHaveClass('badge--success');
    });

    it('renders dot when prop is true', () => {
        const { container } = render(<Badge dot>Live</Badge>);
        expect(container.querySelector('.badge__dot')).toBeInTheDocument();
    });

    it('renders default variant if none provided', () => {
        const { container } = render(<Badge>Default</Badge>);
        expect(container.firstChild).toHaveClass('badge--default');
    });
});
