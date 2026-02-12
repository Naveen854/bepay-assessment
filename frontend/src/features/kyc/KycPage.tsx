import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Building2,
    FileText,
    CheckCircle2,
    Upload,
    RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, CardHeader, CardBody, Badge, Stepper } from '../../components';
import { kycApi, orgApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
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

export const KycPage: React.FC = () => {
    const { user } = useAuthStore();
    const [activeStep, setActiveStep] = useState(0);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [kycStatus, setKycStatus] = useState<string>('not_started');
    const [loading, setLoading] = useState(false);
    const [docUrl, setDocUrl] = useState('');
    const [docType, setDocType] = useState('passport');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SenderForm>({
        resolver: zodResolver(senderSchema),
        defaultValues: {
            email: user?.email || '',
            firstName: user?.name?.split(' ')[0] || '',
            lastName: user?.name?.split(' ').slice(1).join(' ') || '',
        },
    });

    // Load org and KYC status on mount
    useEffect(() => {
        const loadStatus = async () => {
            try {
                const { data } = await orgApi.list();
                if (data && data.length > 0) {
                    const org = data[0];
                    setOrgId(org.id);
                    const { data: kycData } = await kycApi.getStatus(org.id);
                    setKycStatus(kycData.status);
                    // Jump to correct step based on status
                    if (kycData.status === 'pending') setActiveStep(1);
                    if (kycData.status === 'under_review') setActiveStep(2);
                    if (kycData.status === 'verified') setActiveStep(2);
                    if (kycData.status === 'rejected') setActiveStep(2);
                }
            } catch {
                // No org yet — user will create one implicitly via KYC
            }
        };
        loadStatus();
    }, []);

    // Step 1: Create Sender
    const onSubmitSender = async (formData: SenderForm) => {
        setLoading(true);
        try {
            // Create org if needed
            let currentOrgId = orgId;
            if (!currentOrgId) {
                const { data: org } = await orgApi.create({
                    name: formData.companyName,
                    country: formData.country,
                    businessType: 'company',
                });
                currentOrgId = org.id;
                setOrgId(currentOrgId);
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
            await kycApi.uploadDocument(orgId!, {
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
            await kycApi.submitForVerification(orgId!);
            setKycStatus('under_review');
            toast.success('KYC submitted for review');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    // Refresh status
    const onRefreshStatus = async () => {
        if (!orgId) return;
        try {
            const { data } = await kycApi.getStatus(orgId);
            setKycStatus(data.status);
            toast.success(`Status: ${data.status}`);
        } catch {
            toast.error('Could not refresh status');
        }
    };

    const statusBadge = () => {
        const map: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
            not_started: 'default',
            pending: 'warning',
            under_review: 'info',
            verified: 'success',
            rejected: 'error',
        };
        return <Badge variant={map[kycStatus] || 'default'} dot>{kycStatus.replace(/_/g, ' ')}</Badge>;
    };

    return (
        <div className="kyc-page">
            <div className="kyc-page__header">
                <div>
                    <h1 className="kyc-page__title">KYC / Onboarding</h1>
                    <p className="kyc-page__subtitle">Complete verification to enable payouts</p>
                </div>
                <div className="kyc-page__status">
                    {statusBadge()}
                    {orgId && (
                        <button className="kyc-page__refresh" onClick={onRefreshStatus} title="Refresh status">
                            <RefreshCw size={16} />
                        </button>
                    )}
                </div>
            </div>

            <Stepper steps={steps} activeStep={activeStep} />

            {/* Step 1: Business Info */}
            {activeStep === 0 && (
                <Card padding="lg" className="animate-fade-in-up">
                    <CardHeader><Building2 size={20} /> Business Information</CardHeader>
                    <CardBody>
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
                            <Button type="submit" loading={loading} size="lg">
                                Continue to Documents
                            </Button>
                        </form>
                    </CardBody>
                </Card>
            )}

            {/* Step 2: Document Upload */}
            {activeStep === 1 && (
                <Card padding="lg" className="animate-fade-in-up">
                    <CardHeader><FileText size={20} /> Upload Documents</CardHeader>
                    <CardBody>
                        <div className="kyc-form">
                            <div className="kyc-form__row">
                                <div className="input-group">
                                    <label className="input-group__label">Document Type</label>
                                    <select
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
                    </CardBody>
                </Card>
            )}

            {/* Step 3: Verification */}
            {activeStep === 2 && (
                <Card padding="lg" className="animate-fade-in-up">
                    <CardHeader><CheckCircle2 size={20} /> Verification</CardHeader>
                    <CardBody>
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
                    </CardBody>
                </Card>
            )}
        </div>
    );
};
