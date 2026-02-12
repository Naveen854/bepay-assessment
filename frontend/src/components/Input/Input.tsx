import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, leftIcon, className = '', id, ...props }, ref) => {
        const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
        return (
            <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
                {label && (
                    <label htmlFor={inputId} className="input-group__label">
                        {label}
                    </label>
                )}
                <div className="input-group__wrapper">
                    {leftIcon && <span className="input-group__icon">{leftIcon}</span>}
                    <input
                        ref={ref}
                        id={inputId}
                        className={`input-group__input ${leftIcon ? 'input-group__input--with-icon' : ''}`}
                        {...props}
                    />
                </div>
                {error && <span className="input-group__error">{error}</span>}
                {!error && helperText && (
                    <span className="input-group__helper">{helperText}</span>
                )}
            </div>
        );
    },
);

Input.displayName = 'Input';
