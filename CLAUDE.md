# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sui Chat 是一個去中心化聊天應用，建構在 Sui 區塊鏈上。無中心化後端，所有資料存儲於鏈上或 Walrus 去中心化儲存。

**核心功能**:
- 使用者註冊（鏈上 Profile）
- 公開/加密聊天室
- 端對端加密訊息
- 雙重登入方式（錢包 + zkLogin）
- Sponsored Transactions（zkLogin 用戶無需 SUI 餘額）

## Commands

```bash
npm run dev       # Start development server (localhost:3000)
npm run build     # Build for production
npm run lint      # Run ESLint
npm run test      # Run tests with Vitest (watch mode)
npm run test:run  # Run tests once
npm run ui:add    # Add shadcn/ui component (e.g., npm run ui:add button)
```

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Blockchain**: Sui via @mysten/dapp-kit and @mysten/sui
- **zkLogin**: @mysten/enoki for Google OAuth zkLogin
- **State**: React Query (TanStack Query) for async state
- **Crypto**: libsodium-wrappers for end-to-end encryption
- **UI**: Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Storage**: Walrus (for images/files)

## Key Documents

- `DESIGN.md` - 完整設計文件（使用者流程、UI/UX、技術架構）
- `SMART_CONTRACT_SPEC.md` - 智能合約完整規格

---

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Home - redirects to /rooms or /register
│   ├── register/page.tsx     # User registration form
│   ├── rooms/
│   │   ├── page.tsx          # Chat room list
│   │   ├── create/page.tsx   # Create new room
│   │   └── [id]/page.tsx     # Chat room view
│   ├── test/page.tsx         # zkLogin + Sponsored TX test page
│   ├── auth/callback/        # OAuth callback (legacy)
│   ├── api/
│   │   ├── sponsor/          # Sponsored transaction APIs
│   │   │   ├── route.ts      # POST - Get sponsored tx bytes
│   │   │   └── execute/route.ts  # POST - Execute with signature
│   │   └── zklogin/salt/     # GET userSalt from Enoki
│   ├── layout.tsx            # Root layout with Toaster
│   └── providers.tsx         # Sui + React Query providers
│
├── components/
│   ├── auth/                 # Authentication components
│   │   └── LoginOptions.tsx  # Dual login (wallet + zkLogin)
│   ├── common/               # Shared components
│   │   ├── Header.tsx        # Navigation + auth status
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── Toast.tsx
│   └── ui/                   # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
│
├── hooks/
│   ├── index.ts              # Re-exports
│   ├── useAuthMethod.ts      # Detect wallet vs zkLogin
│   ├── useUser.ts            # Current user's Profile
│   ├── useChatRooms.ts       # User's chat rooms list
│   ├── useMessages.ts        # Chat room messages + real-time
│   ├── useEncryption.ts      # Encryption keypair management
│   ├── useZkLoginKeypair.ts  # zkLogin keypair derivation
│   ├── useSponsoredTransaction.ts  # Enoki sponsored TX
│   ├── useRateLimit.ts       # Message rate limiting
│   └── useTransactionLogger.ts  # Debug logging
│
├── lib/
│   ├── crypto.ts             # E2E encryption (X25519 + XSalsa20)
│   ├── zklogin.ts            # zkLogin utilities
│   ├── constants.ts          # Environment variables + config
│   ├── types.ts              # TypeScript types + re-exports
│   ├── utils.ts              # cn() for Tailwind classes
│   ├── enoki/                # Enoki zkLogin setup
│   │   ├── config.ts         # Enoki configuration
│   │   ├── EnokiInitializer.tsx  # Register Enoki wallets
│   │   └── index.ts
│   └── sui/                  # Sui contract interactions
│       ├── client.ts         # SuiClient setup
│       ├── profile.ts        # Profile module functions
│       ├── chat.ts           # Chat module functions
│       ├── message.ts        # Message sending functions
│       ├── grpc-client.ts    # gRPC for real-time updates
│       └── transaction-logger.ts  # TX debug logging
│
└── __tests__/                # Test files
```

---

## User Flow

```
1. 連接錢包（Sui Wallet 或 zkLogin）
         ↓
2. 檢查是否已註冊（有 Profile 物件）
         ↓
3. 未註冊 → /register（建立 Profile + UserChatIndex）
         ↓
4. 已註冊 → /rooms（顯示聊天室列表）
         ↓
5. 點擊聊天室 → /rooms/[id]（查看訊息、發送訊息）
```

## Data Types

```typescript
interface Profile {
  id: string;           // Object ID
  owner: string;        // Wallet address
  customId: string;     // Unique username
  displayName: string;
  avatarBlobId: string; // Walrus blob ID
  publicKey: Uint8Array; // X25519 public key (32 bytes)
  chatIndexId: string;  // UserChatIndex object ID
  createdAt: number;
}

interface ChatRoom {
  id: string;           // Object ID
  name: string;
  creator: string;
  isEncrypted: boolean;
  members: string[];    // Member addresses
  messageCount: number;
  createdAt: number;
}

interface Message {
  sender: string;
  contentType: number;  // 0: Text, 1: Image, 2: File
  content: string;
  timestamp: number;
  messageIndex: number;
}
```

---

## Architecture Details

### Provider Setup (`src/app/providers.tsx`)

```typescript
<QueryClientProvider>
  <SuiClientProvider networks={networkConfig} defaultNetwork={SUI_NETWORK}>
    <WalletProvider autoConnect>
      <EnokiInitializer />  // Register zkLogin wallets
      {children}
    </WalletProvider>
  </SuiClientProvider>
</QueryClientProvider>
```

### Crypto Module (`src/lib/crypto.ts`)

End-to-end encryption using X25519 + XSalsa20-Poly1305:

**Wallet Key Derivation**:
```
signPersonalMessage("sui-chat:derive-encryption-key:v1")
  → BLAKE2b(signature) → 32 bytes seed
  → X25519 keypair
```

**zkLogin Key Derivation**:
```
JWT claims (sub, iss, aud) + userSalt
  → HKDF-SHA256
  → 32 bytes seed
  → X25519 keypair
```

**Key Functions**:
- `initCrypto()` - Must call before using crypto
- `deriveEncryptionKeypair(signature)` - Derive from wallet signature
- `deriveEncryptionKeypairFromZkLogin(claims)` - Derive from zkLogin
- `encryptMessage/decryptMessage` - Symmetric encryption
- `encryptWithPublicKey/decryptWithSecretKey` - Asymmetric (Sealed Box)

### zkLogin Module (`src/lib/zklogin.ts`)

```typescript
// JWT utilities
decodeJwtPayload(jwt)      // Decode without verification
isJwtExpired(jwt)          // Check expiration

// Enoki session
getJwtFromWallet(wallet)       // Get JWT from wallet
getZkLoginSessionData(wallet)  // Get { jwt, sub, iss, aud }

// User salt
fetchUserSalt(jwt)         // POST /api/zklogin/salt
```

---

## Hooks Reference

### useUser
```typescript
const { profile, isLoading, isRegistered } = useUser()
```
Fetches current user's Profile object from chain.

### useChatRooms
```typescript
const { rooms, isLoading, error, refetch } = useChatRooms(chatIndexId)
```
Fetches user's chat rooms from their UserChatIndex.

### useMessages
```typescript
const { messages, messageCount, isLoading, refetch, hasMore } = useMessages(chatId)
```
Fetches messages for a chat room. Supports real-time updates via gRPC + polling.

### useEncryption
```typescript
// Keypair management
const { keypair, loadKeypair, getPublicKeyBase64 } = useEncryptionKeypair()

// Room encryption
const { encrypt, decrypt } = useRoomEncryption(roomKey)

// Key exchange
const { createRoomKey, encryptKeyForUser, decryptKeyForUser } = useRoomKey()
```

### useAuthMethod
```typescript
const { authMethod, isZkLogin, isWallet } = useAuthMethod()
// authMethod: 'zkLogin' | 'wallet' | null
```

### useZkLoginKeypair
```typescript
const { keypair, publicKeyBase64, derive, isLoading } = useZkLoginKeypair({
  autoDerive: false,
  onSuccess: (keypair) => {},
  onError: (error) => {},
})
```

### useSponsoredTransaction
```typescript
const { execute, isPending, error } = useSponsoredTransaction()
const result = await execute(transaction)
```

---

## Contract Interaction Patterns

### Create Profile
```typescript
import { createProfileTransaction } from '@/lib/sui/profile'

const tx = new Transaction()
createProfileTransaction(tx, {
  customId: 'alice',
  displayName: 'Alice',
  avatarBlobId: '',
  publicKey: keypair.publicKey,
})
signAndExecute({ transaction: tx })
```

### Create Chat Room
```typescript
import { createChatTransaction } from '@/lib/sui/chat'

const tx = new Transaction()
createChatTransaction(tx, {
  userIndexId: profile.chatIndexId,
  name: 'My Chat',
  isEncrypted: false,
  encryptedKey: new Uint8Array(),
})
signAndExecute({ transaction: tx })
```

### Send Message
```typescript
import { sendTextMessageTransaction } from '@/lib/sui/message'

const tx = new Transaction()
sendTextMessageTransaction(tx, chatId, 'Hello!')
signAndExecute({ transaction: tx })
```

### Query Objects
```typescript
// Get owned Profile
const { data } = await client.getOwnedObjects({
  owner: address,
  filter: { StructType: `${PACKAGE_ID}::profile::Profile` },
  options: { showContent: true },
})

// Get message (dynamic field)
const result = await client.getDynamicFieldObject({
  parentId: chatId,
  name: { type: 'u64', value: messageIndex.toString() },
})
```

---

## Sponsored Transactions Flow

For zkLogin users with zero SUI balance:

```
1. Client builds transaction kind (no gas info)
         ↓
2. POST /api/sponsor { txBytes, sender }
   → Enoki sponsors → returns { bytes, digest }
         ↓
3. Client signs sponsored transaction
         ↓
4. POST /api/sponsor/execute { digest, userSignature }
   → Enoki executes → returns { success, digest }
```

---

## Smart Contract Objects

| Object | Type | Description |
|--------|------|-------------|
| AppConfig | Shared | Version control for upgrades |
| AdminCap | Owned | Admin privileges |
| Profile | Owned | User identity + public key |
| ProfileRegistry | Shared | custom_id → address mapping |
| ChatRoom | Shared | Room metadata + members |
| UserChatIndex | Shared | User's room list + blocked |

**Dynamic Fields**:
- ChatRoom: Messages stored as `u64 → Message`
- ChatRoom: Encrypted keys as `address → vector<u8>`

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0x...
NEXT_PUBLIC_APP_CONFIG_ID=0x...
NEXT_PUBLIC_PROFILE_REGISTRY_ID=0x...

# Enoki (zkLogin)
NEXT_PUBLIC_ENOKI_PUBLIC_KEY=enoki_public_xxx
ENOKI_PRIVATE_KEY=enoki_private_xxx

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## Code Style

- TypeScript with strict mode
- Functional components, avoid classes
- Use `@/*` path alias for imports from `src/`
- Prefer React Server Components; use `'use client'` only for wallet/Web API access
- Named exports for components
- 2 space indentation
- shadcn/ui for UI components

## Important Notes

1. **Clock Object**: Operations needing timestamp require Clock object (0x6)
2. **版本檢查**: 所有合約操作都需要傳入 AppConfig，合約內部會檢查版本
3. **Key Lengths**: X25519 keys = 32 bytes, Sealed Box overhead = 48 bytes, Nonce = 24 bytes
4. **Rate Limiting**: 20 messages per minute per user (client-side)
5. **Message Storage**: Messages stored as dynamic fields on ChatRoom with u64 index
