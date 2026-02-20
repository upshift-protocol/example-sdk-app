/**
 * SDK initialization helper
 * Handles CJS/ESM interop for @augustdigital/sdk
 */

const RPC_URL = `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`;

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
  });
}
