import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Upload,
    RefreshCw,
    CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Stepper } from '../../components';
import { kycApi, orgApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useOrgStore } from '../../store/orgStore';
import './Kyc.css';

const steps = [
    { label: 'Business Info', description: 'Sender details' },
    { label: 'Documents', description: 'Upload KYC docs' },
    { label: 'Verification', description: 'Submit & track' },
];

const senderSchema = z.object({
    companyName: z.string().min(2, 'Company name is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional(),
    email: z.string().email('Valid email required'),
    phoneNumber: z.string().optional(),
    country: z.string().min(2, 'Country is required'),
    state: z.string().min(1, 'State is required'),
    city: z.string().min(1, 'City is required'),
    address: z.string().min(3, 'Address is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
});

type SenderForm = z.infer<typeof senderSchema>;

interface KycWizardProps {
    onComplete?: () => void;
}

export const KycWizard: React.FC<KycWizardProps> = ({ onComplete }) => {
    const { user } = useAuthStore();
    const { activeOrg, addOrg } = useOrgStore(); // Use global store
    const [activeStep, setActiveStep] = useState(0);
    const [kycStatus, setKycStatus] = useState<string>('not_started');
    const [loading, setLoading] = useState(false);
    const [docUrl, setDocUrl] = useState('');
    const [docType, setDocType] = useState('passport');

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<SenderForm>({
        resolver: zodResolver(senderSchema),
        defaultValues: {
            email: user?.email || '',
            firstName: user?.name?.split(' ')[0] || '',
            lastName: user?.name?.split(' ').slice(1).join(' ') || '',
        },
    });

    // Load KYC status for active org
    useEffect(() => {
        const loadStatus = async () => {
            if (activeOrg) {
                // Pre-fill form if org exists
                setValue('companyName', activeOrg.name);
                setValue('country', activeOrg.country || '');

                try {
                    const { data: kycData } = await kycApi.getStatus(activeOrg.id);
                    setKycStatus(kycData.status);

                    // Jump to correct step based on status
                    if (kycData.status === 'pending') setActiveStep(1);
                    if (kycData.status === 'under_review') setActiveStep(2);
                    if (kycData.status === 'verified') setActiveStep(2);
                    if (kycData.status === 'rejected') setActiveStep(2);
                } catch {
                    // Status fetch failed or not exists
                }
            }
        };
        loadStatus();
    }, [activeOrg, setValue]);

    // Step 1: Create Sender
    const onSubmitSender = async (formData: SenderForm) => {
        setLoading(true);
        try {
            // Create org if needed
            let currentOrgId = activeOrg?.id;
            if (!currentOrgId) {
                const { data: org } = await orgApi.create({
                    name: formData.companyName,
                    businessType: 'company',
                });
                addOrg(org); // Update global store
                currentOrgId = org.id;
            }

            await kycApi.createSender(currentOrgId!, {
                type: 'business',
                ...formData,
            });

            setKycStatus('pending');
            setActiveStep(1);
            toast.success('Business info submitted');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create sender');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Upload Document
    const onUploadDocument = async () => {
        if (!docUrl.trim()) {
            toast.error('Enter a document URL');
            return;
        }
        setLoading(true);
        try {
            await kycApi.uploadDocument(activeOrg?.id!, {
                type: docType,
                documentUrl: docUrl,
            });
            toast.success('Document uploaded');
            setDocUrl('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Submit for Verification
    const onSubmitVerification = async () => {
        setLoading(true);
        try {
            await kycApi.submitForVerification(activeOrg?.id!);
            setKycStatus('under_review');
            toast.success('KYC submitted for review');
            if (onComplete) onComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    // Refresh status
    const onRefreshStatus = async () => {
        if (!activeOrg?.id) return;
        try {
            const { data } = await kycApi.getStatus(activeOrg.id);
            setKycStatus(data.status);
            toast.success(`Status: ${data.status}`);
        } catch {
            toast.error('Could not refresh status');
        }
    };

    return (
        <div className="kyc-wizard">
            <Stepper steps={steps} activeStep={activeStep} />

            <div className="kyc-step-content">
                {/* Step 1: Business Info */}
                {activeStep === 0 && (
                    <form className="kyc-form" onSubmit={handleSubmit(onSubmitSender)}>
                        <div className="kyc-form__row">
                            <Input label="Company Name" error={errors.companyName?.message} {...register('companyName')} />
                            <Input label="Country" placeholder="US" error={errors.country?.message} {...register('country')} />
                        </div>
                        <div className="kyc-form__row">
                            <Input label="First Name" error={errors.firstName?.message} {...register('firstName')} />
                            <Input label="Last Name" {...register('lastName')} />
                        </div>
                        <div className="kyc-form__row">
                            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
                            <Input label="Phone Number" {...register('phoneNumber')} />
                        </div>
                        <div className="kyc-form__row">
                            <Input label="State" error={errors.state?.message} {...register('state')} />
                            <Input label="City" error={errors.city?.message} {...register('city')} />
                        </div>
                        <div className="kyc-form__row">
                            <Input label="Address" error={errors.address?.message} {...register('address')} />
                            <Input label="Zip Code" error={errors.zipCode?.message} {...register('zipCode')} />
                        </div>
                        <Button type="submit" loading={loading} size="lg" className="w-full">
                            Continue to Documents
                        </Button>
                    </form>
                )}

                {/* Step 2: Document Upload */}
                {activeStep === 1 && (
                    <div className="kyc-form">
                        <div className="kyc-form__row">
                            <div className="input-group">
                                <label className="input-group__label" htmlFor="doc-type-select">Document Type</label>
                                <select
                                    id="doc-type-select"
                                    className="kyc-form__select"
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                >
                                    <option value="passport">Passport</option>
                                    <option value="national_id">National ID</option>
                                    <option value="business_registration">Business Registration</option>
                                    <option value="proof_of_address">Proof of Address</option>
                                    <option value="tax_document">Tax Document</option>
                                </select>
                            </div>
                            <Input
                                label="Document URL"
                                placeholder="https://example.com/document.pdf"
                                value={docUrl}
                                onChange={(e) => setDocUrl(e.target.value)}
                            />
                        </div>
                        <div className="kyc-form__actions">
                            <Button
                                variant="secondary"
                                icon={<Upload size={16} />}
                                loading={loading}
                                onClick={onUploadDocument}
                            >
                                Upload Document
                            </Button>
                            <Button onClick={() => setActiveStep(2)}>
                                Continue to Verification
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Verification */}
                {activeStep === 2 && (
                    <div className="kyc-verification">
                        {kycStatus === 'verified' ? (
                            <div className="kyc-verification__success">
                                <CheckCircle2 size={48} />
                                <h3>KYC Verified</h3>
                                <p>Your business is verified. You can now manage beneficiaries and initiate payouts.</p>
                            </div>
                        ) : kycStatus === 'under_review' ? (
                            <div className="kyc-verification__review">
                                <RefreshCw size={48} className="animate-spin" />
                                <h3>Under Review</h3>
                                <p>Your documents are being reviewed. This typically takes 1–2 business days.</p>
                                <Button variant="secondary" onClick={onRefreshStatus} icon={<RefreshCw size={16} />}>
                                    Check Status
                                </Button>
                            </div>
                        ) : kycStatus === 'rejected' ? (
                            <div className="kyc-verification__rejected">
                                <h3>Verification Rejected</h3>
                                <p>Please review your documents and resubmit.</p>
                                <Button onClick={() => setActiveStep(1)}>
                                    Re-upload Documents
                                </Button>
                            </div>
                        ) : (
                            <div className="kyc-verification__submit">
                                <h3>Ready to Submit?</h3>
                                <p>Make sure all documents are uploaded before submitting for verification.</p>
                                <div className="kyc-form__actions">
                                    <Button variant="secondary" onClick={() => setActiveStep(1)}>
                                        Back to Documents
                                    </Button>
                                    <Button loading={loading} onClick={onSubmitVerification}>
                                        Submit for Verification
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
