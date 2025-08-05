// Debug component to show initialization status
export function DebugInfo() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <h3>Debug Info</h3>
      <p>Mode: {import.meta.env.MODE}</p>
      <p>Base URL: {import.meta.env.BASE_URL}</p>
      <p>Location: {window.location.href}</p>
      <p>Pathname: {window.location.pathname}</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}