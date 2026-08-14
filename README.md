# August SDK Example App

A working example showing how to use `@augustdigital/sdk` to fetch and display Upshift vault data -- TVL, APY, historical charts, and deposit/withdrawal activity.

## Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) (or npm/yarn)

## API Keys

You need to provide your own keys via a `.env` file at the project root. Copy the template and fill in your values:

```bash
cp .env.example .env
```

### Required keys

| Variable | What it's for | How to get it |
|---|---|---|
| `VITE_ALCHEMY_API_KEY` | Ethereum RPC provider (read calls) | Sign up at [alchemy.com](https://www.alchemy.com/) -- **you must provide your own key** |
| `VITE_AUGUST_API_KEY` | August API authentication | **Contact the August team** -- requires an August subaccount |
| `VITE_SUBGRAPH_API_KEY` | The Graph subgraph queries | **Contact the August team** |
| `VITE_GOLDSKY_API_KEY` | Goldsky subgraph for vault activity | **Contact the August team** -- we provide access to our subgraphs |

> **Alchemy**: You are responsible for creating your own Alchemy account and API key. A free-tier key is sufficient for development.
>
> **August API key**: If you have an August subaccount with us and need an API key, reach out to the August team directly.
>
> **Goldsky API token**: If you need a Goldsky API token, ask the August team -- we will grant you access to the relevant subgraphs.

### `.env` format

```env
VITE_ALCHEMY_API_KEY=your_alchemy_key
VITE_AUGUST_API_KEY=your_august_key
VITE_SUBGRAPH_API_KEY=your_subgraph_key
VITE_GOLDSKY_API_KEY=your_goldsky_key
```

## Install & Run

```bash
# Install dependencies (also builds the local SDK link)
pnpm install

# Start dev server
pnpm dev
```

The app will be available at `http://localhost:5173`.

## What the example demonstrates

### SDK initialization (`src/sdk.ts`)

```ts
import AugustSDK from '@augustdigital/sdk';

const sdk = new AugustSDK({
  providers: {
    1: `https://eth-mainnet.g.alchemy.com/v2/${YOUR_ALCHEMY_KEY}`,
  },
  appName: 'example-app',
  keys: {
    august: YOUR_AUGUST_API_KEY,
    graph: YOUR_SUBGRAPH_API_KEY,
  },
});
```

The `providers` object maps chain IDs to RPC URLs. Chain `1` is Ethereum mainnet.

### Fetching vault data

```ts
// Get vault metadata + snapshots
const vault = await sdk.getVault({
  vault: '0x80E1048eDE66ec4c364b4F22C8768fc657FF6A42',
  options: { loadSnapshots: true },
});

// Get 90 days of historical timeseries (TVL, APY, share price)
const timeseries = await sdk.getVaultHistoricalTimeseries({
  vault: '0x80E1048eDE66ec4c364b4F22C8768fc657FF6A42',
  nDays: 90,
});
```

### Vault activity via Goldsky subgraph

The app also queries on-chain deposit/withdrawal events directly from a Goldsky-hosted subgraph. See `src/sdk.ts` for the full implementation -- it resolves the subgraph URL from vault metadata, then runs GraphQL queries authenticated with your Goldsky bearer token.

## Project structure

```
src/
  sdk.ts              # SDK init + subgraph activity queries
  App.tsx             # Main component, data fetching
  components/
    VaultHeader.tsx   # Vault name, logo, status
    VaultStats.tsx    # TVL, APY, share price cards
    VaultInfo.tsx     # Detailed metadata table
    HistoricalChart.tsx  # Interactive 7/30/90-day charts
    VaultActivity.tsx # Deposit/withdrawal activity table
  utils/
    format.ts         # Number/address formatting helpers
```

## Vite configuration notes

The SDK is a CommonJS package. The Vite config includes polyfills and interop settings needed for it to work in a browser/ESM environment:

- `global: 'globalThis'` -- polyfills the Node `global` reference
- `buffer` alias -- polyfills the Node `buffer` module
- `defaultIsModuleExports: true` -- handles CJS default export interop

See `vite.config.ts` for the full configuration.

## Available scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm lint` | Run ESLint |
