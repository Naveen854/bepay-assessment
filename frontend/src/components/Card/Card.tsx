import React from 'react';
import './Card.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'sm' | 'md' | 'lg';
    hoverable?: boolean;
}

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}

interface CardBodyProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'md',
    hoverable = false,
}) => {
    return (
        <div
            className={`card card--pad-${padding} ${hoverable ? 'card--hoverable' : ''} ${className}`}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
    children,
    className = '',
    action,
}) => {
    return (
        <div className={`card__header ${className}`}>
            <div className="card__header-title">{children}</div>
            {action && <div className="card__header-action">{action}</div>}
        </div>
    );
};

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
    return <div className={`card__body ${className}`}>{children}</div>;
};
