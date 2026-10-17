import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Evita a tela vazia: se uma página falhar, mostra o erro e opções para continuar usando o app. */
export default class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro ao exibir a tela:', error, info.componentStack);
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 20, background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="card stack" style={{ maxWidth: 480, width: '100%', gap: 14 }}>
          <h2 style={{ fontSize: 18 }}>Não foi possível abrir esta tela</h2>
          <p className="text-2" style={{ margin: 0 }}>
            Seus dados continuam salvos. Tente voltar ao início ou recarregar o aplicativo.
          </p>
          <pre style={{ margin: 0, padding: 12, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 180, overflow: 'auto' }}>
            {`${error.name}: ${error.message}\n${navigator.userAgent}`}
          </pre>
          <div className="row wrap">
            <button className="btn btn-primary" onClick={() => { window.location.hash = '#/'; this.setState({ error: null }); }}>Voltar ao início</button>
            <button className="btn" onClick={() => window.location.reload()}>Recarregar</button>
          </div>
        </div>
      </div>
    );
  }
}
