'use client'

import { ConnectButton, useDisconnectWallet, useCurrentAccount } from '@mysten/dapp-kit'
import Link from 'next/link'
import { useAuthMethod } from '@/hooks/useAuthMethod'
import { useUser } from '@/hooks/useUser'

interface HeaderProps {
  title?: string
}

/**
 * Header component with authentication status and navigation
 * Shows different UI for zkLogin vs wallet users
 */
export function Header({ title = 'Sui Chat' }: HeaderProps) {
  const account = useCurrentAccount()
  const { authMethod, isZkLogin } = useAuthMethod()
  const { mutate: disconnect } = useDisconnectWallet()
  const { profile } = useUser()

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-semibold text-black dark:text-zinc-50">
              {title}
            </Link>
          </div>

          {/* Navigation and Auth */}
          <nav className="flex items-center space-x-4">
            {account && profile && (
              <>
                <Link
                  href="/rooms"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50"
                >
                  Rooms
                </Link>
                <Link
                  href="/users"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50"
                >
                  Users
                </Link>
              </>
            )}

            {account ? (
              <div className="flex items-center gap-3">
                {/* Login method badge */}
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    isZkLogin
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  }`}
                >
                  {isZkLogin ? 'zkLogin' : 'Wallet'}
                </span>

                {/* Profile name or address */}
                <span className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                  {profile?.displayName || truncateAddress(account.address)}
                </span>

                {/* Disconnect button */}
                <button
                  onClick={() => disconnect()}
                  className="px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <ConnectButton />
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
