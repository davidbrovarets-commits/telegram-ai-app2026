import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { UserData } from '../types';

interface TelegramWebApp {
    ready: () => void;
    expand: () => void;
    setHeaderColor: (color: string) => void;
}

const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;

interface UseAuthReturn {
    session: any;
    userData: UserData | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error?: string }>;
    register: (email: string, password: string, username: string, land: string, residencePermit: string) => Promise<{ error?: string }>;
    recovery: (email: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
    updatePassword: (newPassword: string) => Promise<{ error?: string }>;
    updateProfile: (data: Partial<UserData>) => Promise<{ error?: string }>;
    setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
}

export const useAuth = (): UseAuthReturn => {
    const [session, setSession] = useState<any>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUserProfile = useCallback(async (userId: string) => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (profile) {
            setUserData(profile);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        // Telegram WebApp setup
        if (tg) {
            tg.ready();
            tg.expand();
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [loadUserProfile]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        return { error: error?.message };
    };

    const register = async (
        email: string,
        password: string,
        username: string,
        land: string,
        residencePermit: string
    ) => {
        if (!email || !password || !username || !land) {
            return { error: 'Täida kõik väljad!' };
        }

        setLoading(true);
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setLoading(false);
            return { error: error.message };
        }

        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                email,
                username,
                land,
                residence_permit: residencePermit,
                credits: 5,
                created_at: new Date()
            });
        }

        setLoading(false);
        return {};
    };

    const recovery = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        return { error: error?.message };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUserData(null);
    };

    const updatePassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error: error?.message };
    };

    const updateProfile = async (data: Partial<UserData>) => {
        if (!session?.user?.id) return { error: 'Pole sisse logitud' };

        const { error } = await supabase
            .from('profiles')
            .update(data)
            .eq('id', session.user.id);

        if (!error && userData) {
            setUserData({ ...userData, ...data });
        }

        return { error: error?.message };
    };

    return {
        session,
        userData,
        loading,
        login,
        register,
        recovery,
        logout,
        updatePassword,
        updateProfile,
        setUserData
    };
};
