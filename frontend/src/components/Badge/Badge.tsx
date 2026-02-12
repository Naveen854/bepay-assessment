import React from 'react';
import './Badge.css';

interface BadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    children: React.ReactNode;
    dot?: boolean;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    variant = 'default',
    children,
    dot = false,
    className = '',
}) => {
    return (
        <span className={`badge badge--${variant} ${className}`}>
            {dot && <span className="badge__dot" />}
            {children}
        </span>
    );
};
