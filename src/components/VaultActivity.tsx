import { useState } from 'react';
import type { IVaultActivityItem } from '../sdk';
import { truncateAddress, formatUsd } from '../utils/format';

type FilterType = 'all' | 'deposit' | 'withdraw';

const PAGE_SIZE = 15;

export function VaultActivity({
  activity,
}: {
  activity: IVaultActivityItem[];
}) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(0);

  const filtered = activity.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'deposit') return item.type === 'deposit';
    return item.type === 'withdraw-request' || item.type === 'withdraw-processed';
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset to first page when filter changes
  const handleFilter = (f: FilterType) => {
    setFilter(f);
    setPage(0);
  };

  const depositCount = activity.filter((a) => a.type === 'deposit').length;
  const withdrawCount = activity.filter(
    (a) => a.type === 'withdraw-request' || a.type === 'withdraw-processed',
  ).length;

  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>
            Vault Activity
          </h3>
          <span className="card-subtitle">
            {activity.length} total events
          </span>
        </div>
        <div className="tab-group">
          <button
            className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilter('all')}
          >
            All ({activity.length})
          </button>
          <button
            className={`tab-btn ${filter === 'deposit' ? 'active' : ''}`}
            onClick={() => handleFilter('deposit')}
          >
            Deposits ({depositCount})
          </button>
          <button
            className={`tab-btn ${filter === 'withdraw' ? 'active' : ''}`}
            onClick={() => handleFilter('withdraw')}
          >
            Withdrawals ({withdrawCount})
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          No activity found
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th>Type</Th>
                <Th align="right">Amount</Th>
                <Th>Address</Th>
                <Th>Date</Th>
                <Th>Tx</Th>
              </tr>
            </thead>
            <tbody>
              {paged.map((item, i) => (
                <ActivityRow key={`${item.transactionHash}-${i}`} item={item} />
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 0.5rem 0',
                borderTop: '1px solid var(--border-color)',
                marginTop: '0.5rem',
              }}
            >
              <span
                style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}
              >
                Showing {page * PAGE_SIZE + 1}-
                {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{' '}
                {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <PageBtn
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                >
                  Prev
                </PageBtn>
                <PageBtn
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </PageBtn>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '0.75rem 0.5rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      {children}
    </th>
  );
}

function ActivityRow({ item }: { item: IVaultActivityItem }) {
  const isDeposit = item.type === 'deposit';
  const isWithdrawRequest = item.type === 'withdraw-request';

  const typeLabel = isDeposit
    ? 'Deposit'
    : isWithdrawRequest
      ? 'Withdraw Request'
      : 'Withdraw Processed';

  const typeColor = isDeposit ? 'var(--accent-green)' : '#ff8844';

  const amount = parseFloat(item.amount);
  const date = item.timestamp
    ? new Date(item.timestamp * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '-';

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <td style={{ padding: '0.75rem 0.5rem' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: typeColor,
            background: isDeposit
              ? 'var(--accent-green-dim)'
              : 'rgba(255, 136, 68, 0.1)',
          }}
        >
          {typeLabel}
        </span>
      </td>
      <td
        style={{
          padding: '0.75rem 0.5rem',
          textAlign: 'right',
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {isDeposit ? '+' : '-'}
        {isNaN(amount) ? item.amount : formatUsd(amount)}
      </td>
      <td
        style={{
          padding: '0.75rem 0.5rem',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
        }}
      >
        {item.address ? (
          <span className="address">{truncateAddress(item.address)}</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>-</span>
        )}
      </td>
      <td
        style={{
          padding: '0.75rem 0.5rem',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
        }}
      >
        {date}
      </td>
      <td
        style={{
          padding: '0.75rem 0.5rem',
          fontSize: '0.8125rem',
        }}
      >
        {item.transactionHash ? (
          <a
            href={`https://etherscan.io/tx/${item.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
            style={{ color: 'var(--accent-green)' }}
          >
            {truncateAddress(item.transactionHash)}
          </a>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>-</span>
        )}
      </td>
    </tr>
  );
}

function PageBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.375rem 0.875rem',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        background: disabled ? 'transparent' : 'var(--bg-card-inner)',
        color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
        fontSize: '0.8125rem',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
