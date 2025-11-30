This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

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

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
