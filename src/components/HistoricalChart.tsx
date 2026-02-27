import { useMemo, useRef, useState } from 'react';
import type { IHistoricalTimeseriesResponse } from '@augustdigital/sdk';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatUsd, formatPercent } from '../utils/format';

type Metric = 'tvl' | 'daily_apy' | 'share_price';
type Range = 7 | 30 | 90;

const METRIC_CONFIG: Record<
  Metric,
  { label: string; format: (v: number) => string; color: string }
> = {
  tvl: { label: 'TVL', format: formatUsd, color: '#00ff7e' },
  daily_apy: { label: 'APY', format: formatPercent, color: '#00ff7e' },
  share_price: {
    label: 'Share Price',
    format: (v: number) => v.toFixed(6),
    color: '#00ff7e',
  },
};

export function HistoricalChart({
  timeseries,
}: {
  timeseries: IHistoricalTimeseriesResponse;
}) {
  const [metric, setMetric] = useState<Metric>('tvl');
  const [range, setRange] = useState<Range>(30);

  const now = useRef(Date.now());

  const chartData = useMemo(() => {
    if (!timeseries?.data) return [];

    const entries = Object.entries(timeseries.data)
      .map(([dateStr, point]) => ({
        date: dateStr,
        timestamp: new Date(dateStr).getTime(),
        tvl: point.tvl,
        daily_apy: point.daily_apy,
        share_price: point.share_price,
      }))
      .filter((d) => d[metric] != null)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Filter by range
    const cutoff = now.current - range * 24 * 60 * 60 * 1000;
    return entries.filter((d) => d.timestamp >= cutoff);
  }, [timeseries, metric, range]);

  const config = METRIC_CONFIG[metric];

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
            Historical {config.label}
          </h3>
          <span className="card-subtitle">
            {config.label} over the last {range} days
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="tab-group">
            {([7, 30, 90] as Range[]).map((r) => (
              <button
                key={r}
                className={`tab-btn ${range === r ? 'active' : ''}`}
                onClick={() => setRange(r)}
              >
                {r}D
              </button>
            ))}
          </div>

          <div className="tab-group">
            {(Object.keys(METRIC_CONFIG) as Metric[]).map((m) => (
              <button
                key={m}
                className={`tab-btn ${metric === m ? 'active' : ''}`}
                onClick={() => setMetric(m)}
              >
                {METRIC_CONFIG[m].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div
          style={{
            height: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          No data available for this range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          >
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-color)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) =>
                new Date(d).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }
              stroke="var(--text-muted)"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) =>
                metric === 'tvl'
                  ? `$${(v / 1e6).toFixed(1)}M`
                  : metric === 'daily_apy'
                    ? `${v.toFixed(1)}%`
                    : v.toFixed(4)
              }
              stroke="var(--text-muted)"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-card-inner)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
              }}
              labelFormatter={(d) =>
                new Date(String(d)).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              }
              formatter={(value) => [config.format(Number(value)), config.label]}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={config.color}
              strokeWidth={2}
              fill="url(#colorMetric)"
              dot={false}
              activeDot={{
                r: 4,
                stroke: config.color,
                fill: 'var(--bg-card)',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
