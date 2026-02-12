import React from 'react';
import './Stepper.css';

interface Step {
    label: string;
    description?: string;
}

interface StepperProps {
    steps: Step[];
    activeStep: number;
    className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
    steps,
    activeStep,
    className = '',
}) => {
    return (
        <div className={`stepper ${className}`}>
            {steps.map((step, index) => {
                const isCompleted = index < activeStep;
                const isActive = index === activeStep;

                return (
                    <div
                        key={step.label}
                        className={`stepper__step ${isCompleted ? 'stepper__step--completed' : ''} ${isActive ? 'stepper__step--active' : ''}`}
                    >
                        <div className="stepper__indicator">
                            {isCompleted ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <span>{index + 1}</span>
                            )}
                        </div>
                        <div className="stepper__content">
                            <span className="stepper__label">{step.label}</span>
                            {step.description && (
                                <span className="stepper__description">{step.description}</span>
                            )}
                        </div>
                        {index < steps.length - 1 && <div className="stepper__connector" />}
                    </div>
                );
            })}
        </div>
    );
};
