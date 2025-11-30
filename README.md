# Sui Chat Project Guide

Sui Chat 是一個去中心化聊天應用，建構在 Sui 區塊鏈上。無中心化後端，所有資料存儲於鏈上或 Walrus 去中心化儲存。

## Documentation

- `SMART_CONTRACT_SPEC.md` - 智能合約完整規格
- `CLAUDE.md` - 開發者技術指南

## Features

- **雙重登入方式**: 支援傳統錢包（Sui Wallet）和 zkLogin（Google OAuth）
- **Sponsored Transactions**: zkLogin 用戶無需 SUI 餘額即可發送交易
- **端對端加密**: 使用 X25519 + XSalsa20-Poly1305 加密訊息
- **去中心化儲存**: 訊息和檔案存儲於 Sui 鏈上和 Walrus

## Getting Started

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Fill in your environment variables in `.env.local`:
   - `NEXT_PUBLIC_SUI_NETWORK`: The Sui network to use (`devnet`, `testnet`, or `mainnet`)
   - `NEXT_PUBLIC_PACKAGE_ID`: Your deployed smart contract package ID
   - `NEXT_PUBLIC_APP_CONFIG_ID`: The AppConfig shared object ID
   - `NEXT_PUBLIC_PROFILE_REGISTRY_ID`: The ProfileRegistry shared object ID

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Sui Network
NEXT_PUBLIC_SUI_NETWORK=testnet

# Enoki (zkLogin)
NEXT_PUBLIC_ENOKI_PUBLIC_KEY=enoki_public_xxx
ENOKI_PRIVATE_KEY=enoki_private_xxx

# Google OAuth (for zkLogin)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

### Setting up zkLogin with Enoki

1. Create an account at [Enoki Developer Portal](https://portal.enoki.mystenlabs.com/)
2. Create a new project and get your API keys
3. Configure Google OAuth in [Google Cloud Console](https://console.cloud.google.com/)
4. Add your Google Client ID to Enoki Dashboard
5. Set up authorized redirect URIs in both Enoki and Google Console

## Usage Examples

### zkLogin Keypair Derivation

```typescript
import { useZkLoginKeypair } from '@/hooks'

function MyComponent() {
  const { keypair, publicKeyBase64, derive, isLoading } = useZkLoginKeypair()

  const handleDerive = async () => {
    const result = await derive()
    if (result) {
      console.log('Public Key:', result.publicKeyBase64)
      // Use keypair for encryption
    }
  }

  return (
    <button onClick={handleDerive} disabled={isLoading}>
      {isLoading ? 'Deriving...' : 'Derive Keypair'}
    </button>
  )
}
```

### Sponsored Transactions

```typescript
import { useSponsoredTransaction } from '@/hooks'
import { Transaction } from '@mysten/sui/transactions'

function MyComponent() {
  const { execute, isPending } = useSponsoredTransaction()

  const handleSend = async () => {
    const tx = new Transaction()
    tx.moveCall({
      target: '0x2::clock::timestamp_ms',
      arguments: [tx.object('0x6')],
    })

    const result = await execute(tx)
    if (result.success) {
      console.log('Transaction digest:', result.digest)
    }
  }

  return (
    <button onClick={handleSend} disabled={isPending}>
      Send Sponsored TX
    </button>
  )
}
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── api/              # API routes
│   │   ├── sponsor/      # Sponsored transaction endpoints
│   │   └── zklogin/      # zkLogin salt endpoint
│   └── test/             # Test page for zkLogin + sponsored TX
├── components/           # React components
├── hooks/                # Custom React hooks
│   ├── useAuthMethod.ts      # Detect auth method (wallet vs zkLogin)
│   ├── useSponsoredTransaction.ts  # Execute sponsored transactions
│   └── useZkLoginKeypair.ts  # Derive keypair from zkLogin
└── lib/                  # Utility libraries
    ├── crypto.ts         # Encryption utilities
    └── zklogin.ts        # zkLogin utilities
```

## UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) for UI components built on top of Radix UI and Tailwind CSS.

### Adding Components

To add a new shadcn/ui component, use:

```bash
npm run ui:add [component-name]
# Example: npm run ui:add button
# Example: npm run ui:add card dialog
```

Components will be added to `src/components/ui/` and can be imported like:

```tsx
import { Button } from '@/components/ui/button'
```

### Available Utilities

- `cn()` - Utility function for merging Tailwind classes (from `@/lib/utils`)
- CSS variables are configured in `src/app/globals.css` for theming

## Learn More

- [Sui Documentation](https://docs.sui.io/)
- [Enoki Documentation](https://docs.enoki.mystenlabs.com/)
- [zkLogin Guide](https://docs.sui.io/concepts/cryptography/zklogin)
- [Next.js Documentation](https://nextjs.org/docs)
