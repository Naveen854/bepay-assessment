import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input } from '../../components';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import './Auth.css';

const acceptInviteSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

type AcceptInviteForm = z.infer<typeof acceptInviteSchema>;

export const AcceptInvitePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { checkAuth } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const token = searchParams.get('token');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AcceptInviteForm>({
        resolver: zodResolver(acceptInviteSchema),
    });

    const onSubmit = async (data: AcceptInviteForm) => {
        if (!token) return;
        setLoading(true);
        try {
            await authApi.acceptInvite({ token, password: data.password });
            await checkAuth(); // Refresh auth state — backend sets cookie
            toast.success('Account activated! Welcome to BePay.');
            navigate('/welcome');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Invalid or expired invite link');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="auth-page">
                <div className="auth-page__bg" />
                <div className="auth-card animate-fade-in-up">
                    <div className="auth-card__header">
                        <div className="auth-card__logo">B</div>
                        <h1 className="auth-card__title">Invalid Invite</h1>
                        <p className="auth-card__subtitle">
                            <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                            This invite link is missing a token. Please ask for a new invite.
                        </p>
                    </div>
                    <div className="auth-card__footer">
                        <span>Have an account?</span>
                        <Link to="/auth/login">Sign in</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-page__bg" />
            <div className="auth-card animate-fade-in-up">
                <div className="auth-card__header">
                    <div className="auth-card__logo">B</div>
                    <h1 className="auth-card__title">You're invited!</h1>
                    <p className="auth-card__subtitle">Set a password to activate your bepay account</p>
                </div>

                <form className="auth-card__form" onSubmit={handleSubmit(onSubmit)}>
                    <div className="auth-card__password-wrapper">
                        <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min. 8 characters"
                            leftIcon={<Lock size={16} />}
                            error={errors.password?.message}
                            {...register('password')}
                        />
                        <button
                            type="button"
                            className="auth-card__eye"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    <Input
                        label="Confirm Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        leftIcon={<Lock size={16} />}
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                    />

                    <Button type="submit" fullWidth loading={loading} size="lg">
                        Activate Account
                    </Button>
                </form>

                <div className="auth-card__footer">
                    <span>Already have an account?</span>
                    <Link to="/auth/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
};
