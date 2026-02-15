import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { orgApi } from '../../services/api';
import { useOrgStore } from '../../store/orgStore';
import { Button, Card, Input, PageHeader } from '../../components';
import './OrganizationPage.css';

interface OrgFormData {
    name: string;
    website?: string;
    businessType: string;
}

export const OrganizationPage: React.FC = () => {
    const { activeOrg } = useOrgStore();
    const [loading, setLoading] = useState(false);
    const isCreateMode = !activeOrg;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<OrgFormData>({
        defaultValues: {
            name: '',
            website: '',
            businessType: 'business',
        },
    });

    useEffect(() => {
        if (activeOrg) {
            reset({
                name: activeOrg.name || '',
                website: activeOrg.website || '',
                businessType: activeOrg.businessType || 'business',
            });
        }
    }, [activeOrg, reset]);

    const onSubmit = async (data: OrgFormData) => {
        setLoading(true);
        try {
            if (activeOrg) {
                await orgApi.update(activeOrg.id, data);
                toast.success('Organization updated!');
            } else {
                await orgApi.create(data);
                toast.success('Organization created!');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="organization-page animate-fade-in-up">
            <PageHeader
                title="Settings"
                subtitle="Manage your organization details"
            />

            <Card className="max-w-2xl">
                <div className="org-card-content">
                    <div className="org-header">
                        <div className="org-icon-wrapper">
                            <Building2 size={24} color="var(--color-accent)" />
                        </div>
                        <div>
                            <h3 className="org-title">
                                Organization Profile
                            </h3>
                            <p className="org-subtitle">
                                General information about your business
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Organization Name"
                            placeholder="Acme Corp"
                            error={errors.name?.message}
                            {...register('name')}
                        />

                        <Input
                            label="Website"
                            placeholder="https://acme.com"
                            error={errors.website?.message}
                            {...register('website')}
                        />

                        <div className="input-group">
                            <label className="input-group__label">Business Type</label>
                            <select
                                className="kyc-form__select"
                                {...register('businessType')}
                            >
                                <option value="business">Business</option>
                                <option value="individual">Individual</option>
                                <option value="non_profit">Non-Profit</option>
                            </select>
                            {errors.businessType && <span className="input-group__error">{errors.businessType.message}</span>}
                        </div>

                        <div className="org-form-actions">
                            <Button type="submit" loading={loading} icon={<Save size={16} />}>
                                {isCreateMode ? 'Create Organization' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};
