import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    fullWidth = false,
    children,
    disabled,
    className = '',
    ...props
}) => {
    return (
        <button
            className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <span className="btn__spinner" />}
            {!loading && icon && <span className="btn__icon">{icon}</span>}
            {children && <span className="btn__label">{children}</span>}
        </button>
    );
};
