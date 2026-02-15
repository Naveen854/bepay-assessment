import React, { useState, useEffect } from 'react';
import { COUNTRIES } from '../../utils/countries';

import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Building2, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { orgApi } from '../../services/api';
import { useOrgStore } from '../../store/orgStore';
import { Button, Input, Card } from '../../components';

import './OnboardingPage.css';

// ─── Verification Schema ─────────────────
// ─── Verification Schema ─────────────────
const businessStep1Schema = z.object({
    businessType: z.literal('business').or(z.literal('non_profit')),
    name: z.string().min(2, 'Legal Business Name is required'),
    taxId: z.string().min(1, 'EIN / Tax ID is required'),
    phoneNumber: z.string().min(1, 'Phone is required'),
    website: z.string().optional(),
    expectedMonthlyVolume: z.string().optional(),
    intendedUse: z.string().optional(),
    referralSource: z.string().optional(),
});

const individualStep1Schema = z.object({
    businessType: z.literal('individual'),
    name: z.string().min(2, 'Full Name is required'),
    taxId: z.string().min(1, 'SSN / National ID is required'),
    dob: z.string().min(1, 'Date of Birth is required'), // New field
    phoneNumber: z.string().min(1, 'Phone is required'),
    expectedMonthlyVolume: z.string().optional(),
    intendedUse: z.string().optional(),
    referralSource: z.string().optional(),
});

const step1Schema = z.discriminatedUnion("businessType", [
    businessStep1Schema,
    individualStep1Schema,
]);

const step2Schema = z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP is required'),
    country: z.string().min(1, 'Country is required'),
});

// Removed Step 3 Schema

// @ts-ignore - complex union merge
const combinedSchema = step1Schema.and(step2Schema);
type FormData = z.infer<typeof combinedSchema>;

export const OnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addOrg, organizations } = useOrgStore();

    useEffect(() => {
        if (organizations.length > 0) {
            navigate('/dashboard');
        }
    }, [organizations, navigate]);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    // const [uploading, setUploading] = useState(false); // Unused

    const {
        register,
        handleSubmit,
        trigger,
        setValue,
        setError,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        mode: 'onChange',
        defaultValues: {
            businessType: 'business',
            country: 'US',
        },
    });

    useEffect(() => {
        const state = location.state as any;
        if (state) {
            if (state.accountType) setValue('businessType', state.accountType === 'individual' ? 'individual' : 'business');
            if (state.expectedVolume) setValue('expectedMonthlyVolume', state.expectedVolume);
            if (state.services) setValue('intendedUse', state.services.join(', '));
            if (state.referralSource) setValue('referralSource', state.referralSource);
        }
    }, [location.state, setValue]);



    const nextStep = async () => {
        let valid = false;
        if (step === 1) {
            const type = watch('businessType');
            const fields: any[] = ['name', 'businessType', 'taxId', 'phoneNumber'];
            if (type === 'individual') {
                fields.push('dob');
            } else {
                fields.push('website');
            }
            valid = await trigger(fields);
        } else if (step === 2) {
            // Should not happen as step 2 is submit, but for safety
            valid = await trigger(['street', 'city', 'state', 'zip', 'country']);
        }

        if (valid) setStep((s) => s + 1);
    };

    const prevStep = () => setStep((s) => s - 1);

    // handleFileUpload removed

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            // Sanitize data based on business type
            const payload = { ...data };
            if (payload.businessType === 'business' || payload.businessType === 'non_profit') {
                // Remove individual fields
                delete (payload as any).dob;
            } else if (payload.businessType === 'individual') {
                // Remove business fields
                delete (payload as any).website;
                // delete (payload as any).incorporationCertificateUrl; // Field removed
            }

            const { data: newOrg } = await orgApi.create(payload);
            addOrg(newOrg);
            toast.success('Organization created!');
            navigate('/dashboard');
        } catch (err: any) {
            const responseData = err.response?.data;
            if (responseData?.message && Array.isArray(responseData.message)) {
                let hasUnknownError = false;
                responseData.message.forEach((msg: string) => {
                    const lowerMsg = msg.toLowerCase();
                    if (lowerMsg.includes('property') && lowerMsg.includes('should not exist')) {
                        const field = msg.split(' ')[1];
                        toast.error(`System Error: Field '${field}' is not supported by the server.`);
                    } else if (lowerMsg.includes('name')) {
                        setError('name', { type: 'server', message: msg });
                    } else if (lowerMsg.includes('tax')) {
                        setError('taxId', { type: 'server', message: msg });
                    } else if (lowerMsg.includes('phone')) {
                        setError('phoneNumber', { type: 'server', message: msg });
                    } else if (lowerMsg.includes('street')) {
                        setError('street', { type: 'server', message: msg });
                    } else if (lowerMsg.includes('city')) {
                        setError('city', { type: 'server', message: msg });
                    } else if (lowerMsg.includes('state')) {
                        setError('state', { type: 'server', message: msg });
                    } else if (lowerMsg.includes('zip') || lowerMsg.includes('postal')) {
                        setError('zip', { type: 'server', message: msg });
                    } else if (lowerMsg.includes('country')) {
                        setError('country', { type: 'server', message: msg });
                    } else {
                        hasUnknownError = true;
                    }
                });
                if (hasUnknownError) {
                    toast.error('Please check your input and try again.');
                }
            } else {
                toast.error(responseData?.message || 'Failed to create organization');
            }
        } finally {
            setLoading(false);
        }
    };

    // const handleLogout = () => { ... } // Removed

    return (
        <div className="onboarding-page">
            <div className="onboarding-header">
                <div className="onboarding-icon-wrapper">
                    <Building2 size={32} />
                </div>
                <h1 className="onboarding-title">Setup your Business</h1>
                <p className="onboarding-subtitle">Step {step} of 2</p>
            </div>

            <Card className="onboarding-card">
                <form onSubmit={handleSubmit(onSubmit)} className="onboarding-form">

                    {/* STEP 1: Basic Info */}
                    {step === 1 && (
                        <div className="form-section">
                            <h3 className="section-title">
                                {watch('businessType') === 'individual' ? 'Personal Details' : 'Business Details'}
                            </h3>

                            {/* Hidden field to maintain state but we control it via WelcomePage or here if needed 
                                Actually we allow switching types? The design implies they selected it in WelcomePage.
                                But let's keep the select if they want to change, or make it read-only? 
                                User request says: "remove bepay names... put them with bepay... fields for individual and business will be different"
                            */}

                            <div className="input-group">
                                <label className="input-group__label">Account Type</label>
                                <select className="kyc-form__select" {...register('businessType')}>
                                    <option value="business">Business (LLC, Corp)</option>
                                    <option value="individual">Individual / Sole Prop</option>
                                    <option value="non_profit">Non-Profit</option>
                                </select>
                            </div>

                            <Input
                                label={watch('businessType') === 'individual' ? 'Full Legal Name' : 'Legal Business Name'}
                                placeholder={watch('businessType') === 'individual' ? 'John Doe' : 'Acme Inc.'}
                                error={errors.name?.message}
                                {...register('name')}
                            />

                            {watch('businessType') === 'individual' && (
                                <Input
                                    type="date"
                                    label="Date of Birth"
                                    error={(errors as any).dob?.message}
                                    {...register('dob' as any)}
                                />
                            )}

                            <div className="form-grid-2">
                                <Input
                                    label={watch('businessType') === 'individual' ? 'SSN / National ID' : 'EIN / Tax ID'}
                                    placeholder={watch('businessType') === 'individual' ? '000-00-0000' : '00-0000000'}
                                    error={errors.taxId?.message}
                                    {...register('taxId')}
                                />
                                <Input label="Phone Number" placeholder="+1..." error={errors.phoneNumber?.message} {...register('phoneNumber')} />
                            </div>

                            {watch('businessType') !== 'individual' && (
                                <Input label="Website (Optional)" placeholder="https://..." {...register('website')} />
                            )}
                        </div>
                    )}

                    {/* STEP 2: Address */}
                    {step === 2 && (
                        <div className="form-section">
                            <h3 className="section-title">Registered Address</h3>
                            <Input label="Street Address" placeholder="123 Market St" error={errors.street?.message} {...register('street')} />

                            <div className="form-grid-2">
                                <Input label="City" placeholder="San Francisco" error={errors.city?.message} {...register('city')} />
                                <Input label="State / Province" placeholder="CA" error={errors.state?.message} {...register('state')} />
                            </div>

                            <div className="form-grid-2">
                                <Input label="ZIP / Postal Code" placeholder="94105" error={errors.zip?.message} {...register('zip')} />
                                <div className="input-group">
                                    <label className="input-group__label">Country</label>
                                    <select className="kyc-form__select" {...register('country')}>
                                        <option value="">Select Country</option>
                                        {COUNTRIES.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.country && <span className="input-group__error">{errors.country.message}</span>}
                                </div>
                            </div>

                        </div>
                    )}


                    {/* ACTIONS */}
                    <div className="form-actions">
                        {step > 1 ? (
                            <Button variant="secondary" onClick={prevStep} type="button" icon={<ChevronLeft size={16} />}>
                                Back
                            </Button>
                        ) : (
                            <Button variant="ghost" onClick={() => navigate('/')} type="button" className="text-muted">
                                Cancel
                            </Button>
                        )}

                        {step < 2 ? (
                            <Button onClick={nextStep} type="button" icon={<ChevronRight size={16} />}>
                                Next Step
                            </Button>
                        ) : (
                            <Button type="submit" loading={loading} icon={<Check size={16} />}>
                                Create Organization
                            </Button>
                        )}
                    </div>
                </form>
            </Card>
        </div>
    );
};
