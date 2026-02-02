import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { getAuthorizedClient } from '../lib/supabaseClient.js';
import { logger } from '../lib/logger.js';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
    supabase?: SupabaseClient;
}

export const authenticateUser = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
            return;
        }

        const token = authHeader.substring(7);

        // Use standard client to verify user token
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user || !user.id) {
            logger.warn('Authentication failed: Invalid token or user not found', {
                error: error?.message,
                hasUser: !!user,
                userId: user?.id
            });
            res.status(401).json({ error: 'Unauthorized: Invalid token' });
            return;
        }


        // Attach authorized client for downstream services
        // The Authorization header is set in getAuthorizedClient which handles RLS
        const authClient = getAuthorizedClient(token);
        req.supabase = authClient;

        // Use the authorized client for profile lookup (respects RLS)
        const { data: profiles, error: profileError } = await authClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .limit(1);

        const profile = profiles?.[0];

        if (profileError) {
            logger.warn('Profile fetch failed or RLS prevented access', {
                error: profileError.message,
                userId: user.id
            });
        }

        let userRole = profile?.role || 'student';

        req.user = {
            id: user.id,
            email: user.email || '',
            role: userRole,
        };

        next();
    } catch (error) {
        logger.error('Authentication error', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

export const requireRole = (allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            return;
        }

        next();
    };
};

