import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

const root = document.getElementById('root')!;

/** Se um erro fora das telas derrubar o app, mostra o motivo em vez de uma tela vazia. */
const showFatal = (reason: unknown) => {
  if (root.childElementCount > 0) return;
  const message = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason);
  root.innerHTML = `
    <div style="min-height:100dvh;display:grid;place-items:center;padding:20px;font-family:system-ui,sans-serif">
      <div style="max-width:480px;width:100%;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:14px;padding:20px">
        <h2 style="font-size:18px;margin:0 0 8px">Algo deu errado</h2>
        <p style="margin:0 0 12px;color:var(--text-2)">Seus dados continuam salvos. Recarregue o aplicativo.</p>
        <pre style="white-space:pre-wrap;word-break:break-word;font-size:12px;background:var(--surface-2);padding:12px;border-radius:10px;margin:0 0 12px"></pre>
        <button style="height:40px;padding:0 16px;border-radius:10px;border:none;background:var(--brand);color:var(--brand-ink);font-weight:600">Recarregar</button>
      </div>
    </div>`;
  root.querySelector('pre')!.textContent = `${message}\n${navigator.userAgent}`;
  root.querySelector('button')!.addEventListener('click', () => location.reload());
};
window.addEventListener('error', (e) => setTimeout(() => showFatal(e.error ?? e.message), 0));
window.addEventListener('unhandledrejection', (e) => setTimeout(() => showFatal(e.reason), 0));

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* PWA opcional: o app funciona normalmente sem service worker */
    });
  });
}
