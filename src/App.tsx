import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
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
        </HashRouter>
      </UIProvider>
    </FinanceProvider>
  );
}
