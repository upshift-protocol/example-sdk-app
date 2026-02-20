export function LoadingState() {
  return (
    <div className="state-container">
      <div className="spinner" />
      <p style={{ color: 'var(--text-secondary)' }}>Loading vault data...</p>
    </div>
  );
}
