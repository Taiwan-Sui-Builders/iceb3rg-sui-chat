'use client'

import { useCurrentAccount } from '@mysten/dapp-kit'

/**
 * Hook to check authentication status
 * Since we only support zkLogin, this is simplified
 */
export function useAuthMethod(): {
  isConnected: boolean
  isZkLogin: boolean  // Always true when connected (kept for compatibility)
  address: string | undefined
} {
  const account = useCurrentAccount()

  return {
    isConnected: !!account,
    isZkLogin: !!account,  // Always zkLogin when connected
    address: account?.address,
  }
}

// Type export for compatibility
export type AuthMethod = 'zklogin' | null
