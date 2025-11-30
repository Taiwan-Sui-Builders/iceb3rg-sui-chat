'use client'

import { useConnectWallet, useWallets, useCurrentAccount } from '@mysten/dapp-kit'
import { useCallback, useState } from 'react'

interface LoginOptionsProps {
  onConnected?: () => void
}

/**
 * 登入選項元件
 * 只提供 zkLogin (Google OAuth via Enoki) 登入方式
 * 不需要每次發送訊息都簽名
 */
export function LoginOptions({ onConnected }: LoginOptionsProps) {
  const wallets = useWallets()
  const { mutate: connectWallet, isPending } = useConnectWallet()
  const account = useCurrentAccount()
  const [isConnecting, setIsConnecting] = useState(false)

  // 只顯示 zkLogin 錢包（Enoki/Google）
  const zkLoginWallets = wallets.filter(
    w => w.name.toLowerCase().includes('google') || w.name.toLowerCase().includes('enoki')
  )

  const handleConnect = useCallback((wallet: typeof wallets[0]) => {
    setIsConnecting(true)
    connectWallet(
      { wallet },
      {
        onSuccess: () => {
          setIsConnecting(false)
          onConnected?.()
        },
        onError: () => {
          setIsConnecting(false)
        },
      }
    )
  }, [connectWallet, onConnected])

  if (account) {
    return null
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Welcome to Sui Chat
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sign in with Google to start chatting
        </p>
      </div>

      <div className="space-y-3">
        {zkLoginWallets.length > 0 ? (
          zkLoginWallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => handleConnect(wallet)}
              disabled={isPending || isConnecting}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {wallet.icon && (
                <img src={wallet.icon} alt={wallet.name} className="w-6 h-6" />
              )}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {isPending || isConnecting
                  ? 'Connecting...'
                  : `Continue with ${wallet.name.replace('Enoki ', '')}`}
              </span>
            </button>
          ))
        ) : (
          <div className="text-sm text-zinc-500 dark:text-zinc-400 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-center">
            <p className="mb-2">zkLogin not configured.</p>
            <p className="text-xs">
              Set <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">NEXT_PUBLIC_ENOKI_PUBLIC_KEY</code> and{' '}
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in .env.local
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-zinc-400 dark:text-zinc-500 mt-4">
        No wallet needed. Your account is secured by Google.
      </p>
    </div>
  )
}
