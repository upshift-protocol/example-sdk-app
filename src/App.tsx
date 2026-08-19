import { useEffect, useState } from 'react';
import type { IVault, IHistoricalTimeseriesResponse } from '@augustdigital/sdk';
import { VaultHeader } from './components/VaultHeader';
import { VaultStats } from './components/VaultStats';
import { VaultInfo } from './components/VaultInfo';
import { HistoricalChart } from './components/HistoricalChart';
import { VaultActivity } from './components/VaultActivity';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { initSDK, fetchVaultActivity } from './sdk';
import type { IVaultActivityItem } from './sdk';
import './App.css';

// --- Configuration ---
// The Sentora USD vault on Ethereum mainnet
const VAULT_ADDRESS = '0x74aD2F789Ed583DBd141bbdafC673fE1F033718b';

function App() {
  const [vault, setVault] = useState<IVault | null>(null);
  const [timeseries, setTimeseries] =
    useState<IHistoricalTimeseriesResponse | null>(null);
  const [activity, setActivity] = useState<IVaultActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //no-op
  useEffect(() => {
    async function fetchVaultData() {
      try {
        setLoading(true);
        setError(null);

        const sdk = await initSDK();

        // Fetch vault data and historical timeseries (critical)
        const [vaultData, timeseriesData] = await Promise.all([
          sdk.getVault({
            vault: VAULT_ADDRESS as `0x${string}`,
            loadSnapshots: true,
          }),
          sdk.getVaultHistoricalTimeseries({
            vault: VAULT_ADDRESS as `0x${string}`,
            nDays: 90,
          }),
        ]);

        setVault(vaultData);
        setTimeseries(timeseriesData);

        // Fetch activity separately so subgraph issues don't block the page
        fetchVaultActivity(VAULT_ADDRESS)
          .then(setActivity)
          .catch((err) => console.warn('Activity fetch failed:', err));
      } catch (err) {
        console.error('Failed to fetch vault data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch vault data',
        );
      } finally {
        setLoading(false);
      }
    }

    fetchVaultData();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!vault) return <ErrorState message="No vault data available" />;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">August SDK Example</h1>
        <span className="app-subtitle">Vault Detail View</span>
      </header>

      <VaultHeader vault={vault} />
      <VaultStats vault={vault} />
      <VaultInfo vault={vault} />
      {timeseries && <HistoricalChart timeseries={timeseries} />}
      <VaultActivity activity={activity} />
    </div>
  );
}

export default App;
