"use client";

import { useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export const OnboardingGuard = () => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && user) {
            // If onboarding not completed and we are NOT already on the onboarding page
            if (!user.onboarding_completed && pathname !== '/onboarding') {
                router.replace('/onboarding');
            }
        }
    }, [user, loading, pathname, router]);

    return null; // This component handles side effects only
};
