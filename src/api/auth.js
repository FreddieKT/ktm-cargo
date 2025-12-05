import { supabase } from './supabaseClient';

export const auth = {
    isAuthenticated: async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        return !!session;
    },

    me: async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return null;
        }

        // Fetch profile data
        let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        // If profile doesn't exist, create it (Self-healing)
        if (!profile) {
            console.log('Profile missing, creating default profile...');
            const newProfile = {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                role: 'staff',
                staff_role: 'marketing_manager', // Default role
                created_date: new Date().toISOString(),
                updated_date: new Date().toISOString(),
            };

            const { data: created, error } = await supabase
                .from('profiles')
                .insert(newProfile)
                .select()
                .single();

            if (!error) {
                profile = created;
            } else {
                console.error('Error creating profile:', error);
                // Fallback so app doesn't crash
                profile = { staff_role: 'marketing_manager', role: 'staff' };
            }
        }

        return {
            ...user,
            ...profile,
            // Map Supabase user fields to expected app fields
            email: user.email,
            id: user.id,
            // Ensure staff_role is present for RBAC
            staff_role: profile?.staff_role || 'marketing_manager',
            role: profile?.role || 'staff',
        };
    },

    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data.user;
    },

    logout: async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    },

    redirectToLogin: (redirectUrl) => {
        window.location.href = '/ClientPortal';
    },
};
