import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface TableEmptyStateProps {
    colSpan: number;
    icon: LucideIcon;
    message: string;
    description?: string;
}

import './TableEmptyState.css';

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
    colSpan,
    icon: Icon,
    message,
    description,
}) => {
    return (
        <tr>
            <td colSpan={colSpan} className="data-table__empty">
                <div className="data-table__empty-content">
                    <Icon size={32} />
                    <p className="table-empty-state__message">{message}</p>
                    {description && <p className="table-empty-state__description">{description}</p>}
                </div>
            </td>
        </tr>
    );
};
