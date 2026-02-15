import { create } from 'zustand';
import { orgApi } from '../services/api';

interface Organization {
    id: string;
    name: string;
    slug: string;
    businessType: string;
    website?: string;
    logoUrl?: string;
    country?: string;
    kycStatus: string;
    // KYB
    taxId?: string;
    phoneNumber?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    incorporationCertificateUrl?: string;
    identityDocumentUrl?: string;
}

interface OrgState {
    organizations: Organization[];
    activeOrg: Organization | null;
    isLoading: boolean;
    error: string | null;

    fetchOrgs: () => Promise<void>;
    setActiveOrg: (org: Organization) => void;
    addOrg: (org: Organization) => void;
}

export const useOrgStore = create<OrgState>((set) => ({
    organizations: [],
    activeOrg: null,
    isLoading: false,
    error: null,

    fetchOrgs: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await orgApi.list();
            // Since we enforce single org, we just take the first one if it exists
            const orgs = Array.isArray(data) ? data : [data];
            set({ organizations: orgs });

            if (orgs.length > 0) {
                set({ activeOrg: orgs[0] });
            } else {
                set({ activeOrg: null });
            }
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch organizations' });
        } finally {
            set({ isLoading: false });
        }
    },

    setActiveOrg: (org) => {
        set({ activeOrg: org });
        localStorage.setItem('active_org_id', org.id);
    },

    addOrg: (org) => {
        set({
            organizations: [org],
            activeOrg: org
        });
    }
}));
