/**
 * SDK initialization helper
 * Handles CJS/ESM interop for @augustdigital/sdk
 */

const RPC_URL = `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`;
const AUGUST_API_KEY = import.meta.env.VITE_AUGUST_API_KEY as string;
const SUBGRAPH_API_KEY = import.meta.env.VITE_SUBGRAPH_API_KEY as string;

export async function initSDK() {
  // Dynamic import to handle CJS default export interop
  const mod = await import('@augustdigital/sdk');
  // CJS interop: the class may be at mod.default.default or mod.default
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SDK = (mod as any).default?.default ?? (mod as any).default ?? mod;

  return new SDK({
    providers: {
      1: RPC_URL,
    },
    keys: {
      august: AUGUST_API_KEY,
      graph: SUBGRAPH_API_KEY,
    },
  });
}

/**
 * Activity item representing an on-chain deposit or withdrawal event
 */
export interface IVaultActivityItem {
  type: 'deposit' | 'withdraw-request' | 'withdraw-processed';
  address: string;
  amount: string;
  timestamp: number;
  transactionHash: string;
}

/**
 * Fetch vault-level deposit/withdrawal history from the Goldsky subgraph.
 * Queries on-chain events directly - no wallet address required.
 */

const UPSHIFT_METADATA_URL =
  'https://app.upshift.finance/api/sdk/vaults-metadata';
const GOLDSKY_API_KEY = import.meta.env.VITE_GOLDSKY_API_KEY as string;

// Resolve the subgraph URL for a given vault from the metadata endpoint
async function getSubgraphUrl(vaultSymbol: string): Promise<string | null> {
  try {
    const res = await fetch(UPSHIFT_METADATA_URL, {
      headers: {
        'content-type': 'application/json',
        'x-request-client': 'august-sdk',
      },
    });
    if (!res.ok) return null;
    const metadata = await res.json();
    const entry = metadata?.[vaultSymbol.toLowerCase()];
    return entry?.subgraph || null;
  } catch {
    return null;
  }
}

// Query the Goldsky subgraph (matches SDK's fetchSubgraph auth pattern)
async function querySubgraph(
  url: string,
  query: string,
): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (GOLDSKY_API_KEY) {
    headers['Authorization'] = `Bearer ${GOLDSKY_API_KEY}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: `query ${query}` }),
  });
  if (!res.ok) throw new Error(`Subgraph query failed: ${res.status}`);
  const json = await res.json();
  return json?.data ?? {};
}

// USDC has 6 decimals
function formatAmount(raw: string, decimals = 6): string {
  if (!raw) return '0';
  const num = Number(raw) / 10 ** decimals;
  return num.toFixed(2);
}

export async function fetchVaultActivity(
  _vaultAddress: string,
  vaultSymbol = 'upusdc',
  decimals = 6,
): Promise<IVaultActivityItem[]> {
  // 1. Resolve subgraph URL from metadata
  let subgraphUrl = await getSubgraphUrl(vaultSymbol);
  if (!subgraphUrl) {
    // Fallback: construct the default Goldsky URL
    subgraphUrl = `https://api.goldsky.com/api/public/project_cm9g0xy3o4j6v01vd34r3hvv9/subgraphs/august-eth-${vaultSymbol}/1.0.0/gn`;
  }

  // 2. Query deposits, withdrawal requests, and processed withdrawals
  const data = await querySubgraph(
    subgraphUrl,
    `{
      deposits(first: 1000, orderBy: timestamp_, orderDirection: desc) {
        id
        assets
        transactionHash_
        timestamp_
        contractId_
        sender
        shares
        owner
      }
      withdraws(first: 1000, orderBy: timestamp_, orderDirection: desc) {
        id
        transactionHash_
        timestamp_
        contractId_
        assets
        receiver
        sender
      }
      withdrawalRequesteds(first: 1000, orderBy: timestamp_, orderDirection: desc) {
        id
        shares
        assets
        receiverAddr
        ownerAddr
        timestamp_
        transactionHash_
        contractId_
      }
      withdrawalProcesseds(first: 1000, orderBy: timestamp_, orderDirection: desc) {
        id
        receiverAddr
        assetsAmount
        timestamp_
        transactionHash_
        contractId_
      }
    }`,
  );

  const activity: IVaultActivityItem[] = [];

  // Parse deposits
  const deposits = (data.deposits ?? []) as Array<{
    sender?: string;
    owner?: string;
    assets?: string;
    timestamp_: string;
    transactionHash_: string;
  }>;
  for (const d of deposits) {
    activity.push({
      type: 'deposit',
      address: d.sender || d.owner || '',
      amount: formatAmount(d.assets || '0', decimals),
      timestamp: Number(d.timestamp_),
      transactionHash: d.transactionHash_,
    });
  }

  // Parse instant withdrawals (withdraws)
  const withdraws = (data.withdraws ?? []) as Array<{
    receiver?: string;
    sender?: string;
    assets?: string;
    timestamp_: string;
    transactionHash_: string;
  }>;
  for (const w of withdraws) {
    activity.push({
      type: 'withdraw-processed',
      address: w.receiver || w.sender || '',
      amount: formatAmount(w.assets || '0', decimals),
      timestamp: Number(w.timestamp_),
      transactionHash: w.transactionHash_,
    });
  }

  // Parse withdrawal requests
  const requests = (data.withdrawalRequesteds ?? []) as Array<{
    receiverAddr?: string;
    ownerAddr?: string;
    shares?: string;
    assets?: string;
    timestamp_: string;
    transactionHash_: string;
  }>;
  for (const r of requests) {
    activity.push({
      type: 'withdraw-request',
      address: r.receiverAddr || r.ownerAddr || '',
      amount: formatAmount(r.assets || r.shares || '0', decimals),
      timestamp: Number(r.timestamp_),
      transactionHash: r.transactionHash_,
    });
  }

  // Parse processed withdrawals
  const processed = (data.withdrawalProcesseds ?? []) as Array<{
    receiverAddr?: string;
    assetsAmount?: string;
    timestamp_: string;
    transactionHash_: string;
  }>;
  for (const p of processed) {
    activity.push({
      type: 'withdraw-processed',
      address: p.receiverAddr || '',
      amount: formatAmount(p.assetsAmount || '0', decimals),
      timestamp: Number(p.timestamp_),
      transactionHash: p.transactionHash_,
    });
  }

  // Deduplicate by transactionHash + type (withdraws and withdrawalProcesseds can overlap)
  const seen = new Set<string>();
  const deduped = activity.filter((item) => {
    const key = `${item.transactionHash}-${item.type}`;
    if (!item.transactionHash || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by timestamp descending (most recent first)
  deduped.sort((a, b) => b.timestamp - a.timestamp);

  return deduped;
}
