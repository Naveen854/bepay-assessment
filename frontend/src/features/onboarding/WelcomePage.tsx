import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../../components';
import { authApi } from '../../services/api';
import './WelcomePage.css';
import { useAuthStore } from '../../store/authStore';

export const WelcomePage: React.FC = () => {
    const navigate = useNavigate();
    const [accountType, setAccountType] = useState<'business' | 'individual' | null>(null);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [expectedVolume, setExpectedVolume] = useState<string>('');
    const [referralSource, setReferralSource] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const toggleService = (service: string) => {
        setSelectedServices(prev =>
            prev.includes(service)
                ? prev.filter(s => s !== service)
                : [...prev, service]
        );
    };

    const handleContinue = async () => {
        setLoading(true);
        try {
            // Mark onboarding as completed to allow access to Dashboard
            await authApi.updateOnboarding('completed');

            const { checkAuth } = useAuthStore.getState();
            await checkAuth(); // Refresh user state to update onboardingStatus in store

            navigate('/');
        } catch (error) {
            console.error('Failed to update onboarding status', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="welcome-page">
            <div className="welcome-page__content">
                <div className="welcome-page__header">
                    <h1 className="welcome-page__title">Tell us how you'll use Bepay</h1>
                    <p className="welcome-page__subtitle">Below information will help us serve you better</p>
                </div>

                <div className="welcome-group">
                    <label className="welcome-group__label">Choose your account type</label>
                    <div className="account-type-grid">
                        <div
                            className={`selection-card ${accountType === 'business' ? 'selection-card--selected' : ''}`}
                            onClick={() => setAccountType('business')}
                        >
                            <div className="selection-card__icon">
                                <Building2 size={24} />
                            </div>
                            <span className="selection-card__title">Business</span>
                            {accountType === 'business' && <CheckCircle2 className="selection-card__check" size={20} />}
                        </div>

                        <div
                            className={`selection-card ${accountType === 'individual' ? 'selection-card--selected' : ''}`}
                            onClick={() => setAccountType('individual')}
                        >
                            <div className="selection-card__icon">
                                <User size={24} />
                            </div>
                            <span className="selection-card__title">Individual</span>
                            {accountType === 'individual' && <CheckCircle2 className="selection-card__check" size={20} />}
                        </div>
                    </div>
                </div>

                <div className="welcome-group">
                    <label className="welcome-group__label">How do you plan to use Bepay?</label>
                    <div className="service-list">
                        <div
                            className={`service-item ${selectedServices.includes('fiat_deposit') ? 'service-item--selected' : ''}`}
                            onClick={() => toggleService('fiat_deposit')}
                        >
                            <div className="service-item__content">
                                <h4>Fiat Deposits (On-ramp)</h4>
                                <p>Deposit traditional currency to convert to crypto.</p>
                            </div>
                            <div className="service-item__check">
                                {selectedServices.includes('fiat_deposit') ? <CheckCircle2 size={20} /> : <div className="service-item__check-placeholder" />}
                            </div>
                        </div>

                        <div
                            className={`service-item ${selectedServices.includes('withdraw') ? 'service-item--selected' : ''}`}
                            onClick={() => toggleService('withdraw')}
                        >
                            <div className="service-item__content">
                                <h4>Withdrawals (Off-ramp)</h4>
                                <p>Convert your crypto to fiat in your bank account.</p>
                            </div>
                            <div className="service-item__check">
                                {selectedServices.includes('withdraw') ? <CheckCircle2 size={20} /> : <div className="service-item__check-placeholder" />}
                            </div>
                        </div>

                        <div
                            className={`service-item ${selectedServices.includes('vendor_payments') ? 'service-item--selected' : ''}`}
                            onClick={() => toggleService('vendor_payments')}
                        >
                            <div className="service-item__content">
                                <h4>Vendor Payments</h4>
                                <p>Make payments in USD/EUR or stablecoins.</p>
                            </div>
                            <div className="service-item__check">
                                {selectedServices.includes('vendor_payments') ? <CheckCircle2 size={20} /> : <div className="service-item__check-placeholder" />}
                            </div>
                        </div>

                        <div
                            className={`service-item ${selectedServices.includes('crypto_card') ? 'service-item--selected' : ''}`}
                            onClick={() => toggleService('crypto_card')}
                        >
                            <div className="service-item__content">
                                <h4>Crypto Card</h4>
                                <p>Spend your crypto anywhere globally.</p>
                            </div>
                            <div className="service-item__check">
                                {selectedServices.includes('crypto_card') ? <CheckCircle2 size={20} /> : <div className="service-item__check-placeholder" />}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="welcome-group">
                    <label className="welcome-group__label">Expected Monthly Volume</label>
                    <select
                        className="welcome-group__select"
                        value={expectedVolume}
                        onChange={(e) => setExpectedVolume(e.target.value)}
                    >
                        <option value="">Select volume</option>
                        <option value="under_10k">Under $10,000</option>
                        <option value="10k_50k">$10,000 – $50,000</option>
                        <option value="50k_250k">$50,000 – $250,000</option>
                        <option value="250k_plus">$250,000+</option>
                    </select>
                </div>

                <div className="welcome-group">
                    <label className="welcome-group__label">How did you hear about Bepay?</label>
                    <select
                        className="welcome-group__select"
                        value={referralSource}
                        onChange={(e) => setReferralSource(e.target.value)}
                    >
                        <option value="">Select source</option>
                        <option value="twitter">X (Twitter)</option>
                        <option value="referral">Friend or Referral</option>
                        <option value="google">Google Search</option>
                        <option value="community">Community / Forum</option>
                        <option value="blog">Blog or Article</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <Button
                    size="lg"
                    fullWidth
                    onClick={handleContinue}
                    disabled={loading}
                    loading={loading}
                    icon={<ArrowRight size={20} />}
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};
