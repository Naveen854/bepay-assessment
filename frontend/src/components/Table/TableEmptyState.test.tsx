import { render, screen } from '@testing-library/react';
import { TableEmptyState } from './TableEmptyState';
import { describe, it, expect } from 'vitest';
import { Search } from 'lucide-react';

describe('TableEmptyState', () => {
    it('renders message and description', () => {
        render(
            <table>
                <tbody>
                    <TableEmptyState
                        colSpan={5}
                        icon={Search}
                        message="No results"
                        description="Try another search"
                    />
                </tbody>
            </table>
        );

        expect(screen.getByText('No results')).toBeInTheDocument();
        expect(screen.getByText('Try another search')).toBeInTheDocument();
    });

    it('renders icon', () => {
        render(
            <table>
                <tbody>
                    <TableEmptyState
                        colSpan={5}
                        icon={Search}
                        message="Empty"
                    />
                </tbody>
            </table>
        );
        // Look for SVG or something indicating icon presence
        // Lucide renders SVG. We can check if svg exists in container
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('applies colSpan', () => {
        const { container } = render(
            <table>
                <tbody>
                    <TableEmptyState
                        colSpan={3}
                        icon={Search}
                        message="Empty"
                    />
                </tbody>
            </table>
        );

        const td = container.querySelector('td');
        expect(td).toHaveAttribute('colspan', '3');
    });
});
