import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        // Exchange the code for a session
        await supabase.auth.exchangeCodeForSession(code);

        // Check if we need to sync user data with backend
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // We will let the client side (AuthContext.tsx) handle the profile syncing 
                // to avoid double writes and race conditions, as it already has the logic.
            }
        } catch (error) {
            console.error('Error in auth callback:', error);
        }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
