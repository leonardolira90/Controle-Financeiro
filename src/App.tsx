import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { FinanceProvider, useFinance } from './store/FinanceContext';
import { UIProvider } from './store/UIContext';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import More from './pages/More';

/** Aplica o tema escolhido no elemento <html>. */
function ThemeSync() {
  const { data } = useFinance();
  useEffect(() => {
    const root = document.documentElement;
    if (data.settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', data.settings.theme);
  }, [data.settings.theme]);
  return null;
}

export default function App() {
  return (
    <FinanceProvider>
      <UIProvider>
        <ThemeSync />
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </UIProvider>
    </FinanceProvider>
  );
}

function AppRoutes() {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lancamentos" element={<Transactions />} />
            <Route path="/contas" element={<Accounts />} />
            <Route path="/orcamentos" element={<Budgets />} />
            <Route path="/metas" element={<Goals />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/mais" element={<More />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
    </ErrorBoundary>
  );
}
