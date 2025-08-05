import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Global error logging for debugging white screen
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  console.error('Error stack:', e.error?.stack);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// Log app initialization
console.log('🚀 Initializing app...');
console.log('Environment:', import.meta.env.MODE);
console.log('Base URL:', import.meta.env.BASE_URL);

const root = document.getElementById("root");
if (!root) {
  console.error('❌ Root element not found');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Root element not found</div>';
  throw new Error('Root element not found');
}

console.log('✅ Root element found, rendering app...');

try {
  createRoot(root).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Failed to render app:', error);
  root.innerHTML = `
    <div style="padding: 20px; font-family: system-ui; color: red;">
      <h1>Application Render Error</h1>
      <p>Failed to initialize the React application.</p>
      <details>
        <summary>Error Details</summary>
        <pre>${String(error)}</pre>
      </details>
    </div>
  `;
}
