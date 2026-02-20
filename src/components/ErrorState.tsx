export function ErrorState({ message }: { message: string }) {
  return (
    <div className="state-container">
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(255, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
        }}
      >
        !
      </div>
      <p style={{ color: 'var(--accent-red)', fontWeight: 500 }}>
        Error loading vault
      </p>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          maxWidth: 400,
          textAlign: 'center',
        }}
      >
        {message}
      </p>
    </div>
  );
}
