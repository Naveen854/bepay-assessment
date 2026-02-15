import React, { useState } from 'react';
import { UserPlus, Copy, Check, Send, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, PageHeader } from '../../components';
import { authApi } from '../../services/api';
import './Invite.css';

export const InvitePage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [invitesSent, setInvitesSent] = useState(0);

    const baseUrl = window.location.origin;

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !name) {
            toast.error('Please fill in both name and email');
            return;
        }

        setLoading(true);
        try {
            const { data } = await authApi.invite({ email, name });
            const link = `${baseUrl}/auth/invite?token=${data.token}`;
            setInviteLink(link);
            setInvitesSent((prev) => prev + 1);
            setEmail('');
            setName('');
            toast.success(`Invite sent to ${email}!`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send invite');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!inviteLink) return;
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy');
        }
    };

    return (
        <div className="invite-page">
            <PageHeader
                title="Invite"
                subtitle="Invite teammates and friends to BePay"
            />

            <div className="invite-page__content">
                {/* Stats Card */}
                <Card>
                    <div className="invite-page__stats">
                        <div className="invite-page__stat">
                            <span className="invite-page__stat-label">Your Invites</span>
                            <span className="invite-page__stat-value">{invitesSent}</span>
                        </div>
                    </div>
                </Card>

                {/* Invite Form */}
                <Card>
                    <div className="invite-page__form-section">
                        <h3 className="invite-page__section-title">
                            <UserPlus size={20} />
                            Send an Invite
                        </h3>
                        <p className="invite-page__section-desc">
                            Enter their details to generate a unique invite link
                        </p>

                        <form onSubmit={handleInvite} className="invite-page__form">
                            <div className="invite-page__form-row">
                                <Input
                                    label="Name"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                loading={loading}
                                icon={<Send size={16} />}
                                size="lg"
                                fullWidth
                            >
                                Send Invite
                            </Button>
                        </form>
                    </div>
                </Card>

                {/* Generated Invite Link */}
                {inviteLink && (
                    <Card>
                        <div className="invite-page__link-section">
                            <h3 className="invite-page__section-title">
                                <Link2 size={20} />
                                Your Invite Link
                            </h3>
                            <p className="invite-page__section-desc">
                                Share this link with your invitee
                            </p>

                            <div className="invite-page__link-box">
                                <span className="invite-page__link-text">{inviteLink}</span>
                                <button
                                    className="invite-page__copy-btn"
                                    onClick={handleCopy}
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};
