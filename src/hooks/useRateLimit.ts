// Rate limiting hook for message sending

import { useState, useCallback, useRef } from 'react';
import { MESSAGE_RATE_LIMIT } from '@/lib/types';

interface RateLimitState {
    count: number;
    resetTime: number;
}

export function useRateLimit() {
    const [rateLimitState, setRateLimitState] = useState<Map<string, RateLimitState>>(
        new Map()
    );

    const checkRateLimit = useCallback((key: string): { allowed: boolean; remaining: number; resetIn: number } => {
        const now = Date.now();
        const state = rateLimitState.get(key);

        if (!state || now >= state.resetTime) {
            // Reset or initialize
            const newState: RateLimitState = {
                count: 1,
                resetTime: now + 60000, // 1 minute
            };
            setRateLimitState((prev) => {
                const next = new Map(prev);
                next.set(key, newState);
                return next;
            });
            return {
                allowed: true,
                remaining: MESSAGE_RATE_LIMIT - 1,
                resetIn: 60000,
            };
        }

        if (state.count >= MESSAGE_RATE_LIMIT) {
            return {
                allowed: false,
                remaining: 0,
                resetIn: state.resetTime - now,
            };
        }

        // Increment count
        const newState: RateLimitState = {
            count: state.count + 1,
            resetTime: state.resetTime,
        };
        setRateLimitState((prev) => {
            const next = new Map(prev);
            next.set(key, newState);
            return next;
        });

        return {
            allowed: true,
            remaining: MESSAGE_RATE_LIMIT - newState.count,
            resetIn: state.resetTime - now,
        };
    }, [rateLimitState]);

    return { checkRateLimit };
}

