import React, { useState, useEffect } from 'react';
import {
    User,
    Key,
    Download,
    CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../store/authStore';
import './ProfilePage.css';
import { Button, PageHeader, Badge, ResponsiveDialog, Input } from '../../components';
import { kycApi, authApi } from '../../services/api';
import { useOrgStore } from '../../store/orgStore';

export const ProfilePage: React.FC = () => {
    const { user } = useAuthStore();
    const { activeOrg } = useOrgStore();
    const [kycStatus, setKycStatus] = useState<string>('loading');
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    // Fetch status when activeOrg changes
    useEffect(() => {
        const fetchStatus = async () => {
            if (!activeOrg) {
                setKycStatus('not_started');
                return;
            }
            try {
                setKycStatus('loading');
                const { data: kyc } = await kycApi.getStatus(activeOrg.id);
                setKycStatus(kyc.status);
            } catch {
                setKycStatus('error');
            }
        };

        fetchStatus();
    }, [activeOrg]);


    const handleChangePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error('All fields are required');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        try {
            setIsSubmittingPassword(true);
            await authApi.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            toast.success('Password changed successfully');
            setIsChangePasswordOpen(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    return (
        <div className="profile-page animate-fade-in-up">
            <PageHeader
                title="My Profile"
                subtitle="Manage your account and security settings"
            />

            <div className="profile-content">
                {/* Personal Info */}
                <section className="profile-section-group">
                    <h2 className="profile-section-title">
                        <User size={20} /> Personal Information
                    </h2>
                    <div className="profile-user-info">
                        <div className="profile-avatar">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="profile-user-details">
                            <div className="profile-user-name-row">
                                <h3>{user?.name}</h3>
                                {kycStatus === 'verified' && (
                                    <Badge variant="success">
                                        <CheckCircle2 size={12} />
                                        Verified
                                    </Badge>
                                )}
                            </div>
                            <p>{user?.email}</p>
                        </div>
                    </div>
                </section>

                <div className="profile-divider" />

                {/* Security */}
                <section className="profile-section-group">
                    <h2 className="profile-section-title">
                        <Key size={20} /> Security
                    </h2>
                    <div className="profile-action-row">
                        <div className="profile-action-info">
                            <h4>Password</h4>
                            <p>Ensure your account is using a long, random password to stay secure.</p>
                        </div>
                        <Button variant="secondary" onClick={() => setIsChangePasswordOpen(true)}>Change Password</Button>
                    </div>
                </section>

                <ResponsiveDialog
                    isOpen={isChangePasswordOpen}
                    onClose={() => setIsChangePasswordOpen(false)}
                    title="Change Password"
                >
                    <p className="text-sm text-gray-500 mb-4">Enter your current password and a new strong password.</p>
                    <div className="flex flex-col gap-4 py-4">
                        <Input
                            label="Current Password"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        />
                        <Input
                            label="New Password"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="secondary" onClick={() => setIsChangePasswordOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleChangePassword}
                                loading={isSubmittingPassword}
                            >
                                Update Password
                            </Button>
                        </div>
                    </div>
                </ResponsiveDialog>

                <div className="profile-divider" />

                {/* Data Export */}
                <section className="profile-section-group">
                    <h2 className="profile-section-title">
                        <Download size={20} /> Data Management
                    </h2>
                    <div className="profile-action-row">
                        <div className="profile-action-info">
                            <h4>Export Data</h4>
                            <p>Download a copy of your personal data and transaction history.</p>
                        </div>
                        <Button variant="secondary" onClick={() => toast.success("Data export started")}>Export to CSV</Button>
                    </div>
                </section>
            </div>
        </div>
    );
};
