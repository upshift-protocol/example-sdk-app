import type { IVault } from '@augustdigital/sdk';
import { truncateAddress, formatDuration } from '../utils/format';

export function VaultInfo({ vault }: { vault: IVault }) {
  const depositSymbol =
    vault.depositAssets?.[0]?.symbol || 'Unknown';
  const receiptSymbol = vault.receipt?.symbol || 'Unknown';
  const strategistName = vault.strategists?.[0]?.name || 'Unknown';
  const withdrawalFee = vault.fees?.management ?? 0;
  const performanceFee = vault.fees?.performance ?? 0;

  return (
    <div className="card">
      <h3 className="card-title">Vault Info</h3>

      <InfoRow label="Chain" value={`Chain ID ${vault.chainId}`} />
      <InfoRow
        label="Vault Address"
        value={
          <span className="address">{truncateAddress(vault.address)}</span>
        }
      />

      <div style={{ height: '0.5rem' }} />

      <InfoRow label="Deposit Token" value={depositSymbol} />
      <InfoRow label="Receipt Token" value={receiptSymbol} />

      <div style={{ height: '0.5rem' }} />

      <InfoRow label="Strategist" value={strategistName} />
      <InfoRow
        label="Withdrawal Fee"
        value={withdrawalFee > 0 ? `${withdrawalFee}%` : 'None'}
      />
      <InfoRow
        label="Performance Fee"
        value={`${performanceFee.toFixed(2)}%`}
      />
      <InfoRow
        label="Withdrawal Period"
        value={formatDuration(vault.lagDuration)}
      />

      {vault.rewards?.points && (
        <InfoRow
          label="Rewards"
          value={`${vault.rewards.multiplier}x ${vault.rewards.points}`}
        />
      )}

      {vault.reserveTarget > 0 && (
        <InfoRow
          label="Reserve Target"
          value={`${vault.reserveTarget}%`}
        />
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}
