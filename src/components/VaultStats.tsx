import type { IVault } from '@augustdigital/sdk';
import { formatUsd, formatPercent } from '../utils/format';

export function VaultStats({ vault }: { vault: IVault }) {
  const tvl = vault.latest_reported_tvl ?? parseFloat(vault.totalAssets?.normalized || '0');
  const apy = vault.apy?.apy ?? 0;
  const liquidApy = vault.apy?.liquidApy ?? 0;

  // Share price = totalAssets / totalSupply
  const totalAssets = parseFloat(vault.totalAssets?.normalized || '0');
  const totalSupply = parseFloat(vault.totalSupply?.normalized || '0');
  const sharePrice = totalSupply > 0 ? totalAssets / totalSupply : 1;

  return (
    <div className="card">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.5rem',
          textAlign: 'center',
        }}
      >
        <div>
          <div className="stat-value">{formatUsd(tvl)}</div>
          <div className="stat-label">TVL</div>
        </div>
        <div>
          <div className="stat-value green">{formatPercent(apy)}</div>
          <div className="stat-label">Total APY</div>
        </div>
        <div>
          <div className="stat-value green">{formatPercent(liquidApy)}</div>
          <div className="stat-label">Liquid APY</div>
        </div>
        <div>
          <div className="stat-value">
            {sharePrice.toFixed(4)}
          </div>
          <div className="stat-label">Share Price</div>
        </div>
      </div>
    </div>
  );
}
