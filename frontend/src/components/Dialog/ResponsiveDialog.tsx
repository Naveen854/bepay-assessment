import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './ResponsiveDialog.css';

interface ResponsiveDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string | React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    className = '',
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isOpen && e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="dialog-overlay"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                ref={dialogRef}
                className={`dialog-content animate-slide-in ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="dialog-header">
                    <div className="dialog-title">{title}</div>
                    <button
                        className="dialog-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="dialog-body">
                    {children}
                </div>

                {footer && (
                    <div className="dialog-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
