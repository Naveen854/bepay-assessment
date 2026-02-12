import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input } from '../../components';
import { useAuthStore } from '../../store/authStore';
import './Auth.css';

const loginSchema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        try {
            await login(data.email, data.password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-page__bg" />
            <div className="auth-card animate-fade-in-up">
                <div className="auth-card__header">
                    <div className="auth-card__logo">B</div>
                    <h1 className="auth-card__title">Welcome back</h1>
                    <p className="auth-card__subtitle">Sign in to your bepay console</p>
                </div>

                <form className="auth-card__form" onSubmit={handleSubmit(onSubmit)}>
                    <Input
                        label="Email"
                        type="email"
                        placeholder="you@company.com"
                        leftIcon={<Mail size={16} />}
                        error={errors.email?.message}
                        {...register('email')}
                    />

                    <div className="auth-card__password-wrapper">
                        <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
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

                    <Button type="submit" fullWidth loading={loading} size="lg">
                        Sign In
                    </Button>
                </form>

                <div className="auth-card__footer">
                    <span>Don't have an account?</span>
                    <Link to="/auth/register">Create one</Link>
                </div>
            </div>
        </div>
    );
};
