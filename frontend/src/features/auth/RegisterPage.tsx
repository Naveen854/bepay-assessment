import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input } from '../../components';
import { useAuthStore } from '../../store/authStore';
import './Auth.css';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register: registerUser } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        setLoading(true);
        try {
            await registerUser(data.email, data.name, data.password);
            toast.success('Account created! Welcome to bepay.');
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Registration failed');
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
                    <h1 className="auth-card__title">Create account</h1>
                    <p className="auth-card__subtitle">Get started with bepay payouts</p>
                </div>

                <form className="auth-card__form" onSubmit={handleSubmit(onSubmit)}>
                    <Input
                        label="Full Name"
                        type="text"
                        placeholder="John Doe"
                        leftIcon={<User size={16} />}
                        error={errors.name?.message}
                        {...register('name')}
                    />

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

                    <Button type="submit" fullWidth loading={loading} size="lg">
                        Create Account
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
