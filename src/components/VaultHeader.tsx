import type { IVault } from '@augustdigital/sdk';
import { truncateAddress } from '../utils/format';

export function VaultHeader({ vault }: { vault: IVault }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {vault.logoUrl && (
          <img
            src={vault.logoUrl}
            alt={vault.name}
            style={{ width: 48, height: 48, borderRadius: '50%' }}
          />
        )}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{vault.name}</h2>
          <span
            style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}
          >
            {vault.tags?.join(' / ') || vault.description || 'Vault'}
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <StatusBadge status={vault.status} />
        </div>
      </div>

      {vault.description && (
        <p
          style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          {vault.description}
        </p>
      )}

      <div
        style={{
          marginTop: '1rem',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
        }}
      >
        <span className="address">{truncateAddress(vault.address)}</span>
        {' on Chain ID '}
        {vault.chainId}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: 'var(--accent-green-dim)', text: 'var(--accent-green)' },
    closed: { bg: 'rgba(255, 68, 68, 0.1)', text: '#ff4444' },
    testing: { bg: 'rgba(255, 187, 0, 0.1)', text: '#ffbb00' },
  };
  const c = colors[status] || colors.active;
  return (
    <span
      style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        background: c.bg,
        color: c.text,
      }}
    >
      {status}
    </span>
  );
}
