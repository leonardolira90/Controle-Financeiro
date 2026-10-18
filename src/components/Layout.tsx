import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3, CreditCard, Eye, EyeOff, LayoutDashboard, Menu, Moon, PiggyBank, Plus, Receipt, Settings, Sun, Target, Wallet, TrendingUp,
} from 'lucide-react';
import { useFinance } from '../store/FinanceContext';
import { useUI } from '../store/UIContext';
import { useResolvedTheme } from '../utils/theme';
import TransactionForm from './TransactionForm';

const NAV = [
  { to: '/', label: 'Visão geral', short: 'Início', icon: LayoutDashboard },
  { to: '/lancamentos', label: 'Lançamentos', short: 'Lançamentos', icon: Receipt },
  { to: '/contas', label: 'Contas', short: 'Contas', icon: Wallet },
  { to: '/cartoes', label: 'Cartões de crédito', short: 'Cartões', icon: CreditCard },
  { to: '/orcamentos', label: 'Orçamentos', short: 'Orçamentos', icon: PiggyBank },
  { to: '/metas', label: 'Metas', short: 'Metas', icon: Target },
  { to: '/relatorios', label: 'Relatórios', short: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', short: 'Ajustes', icon: Settings },
];

/** No celular, a barra inferior mostra os atalhos principais; o restante fica em "Mais". */
const navItem = (to: string) => NAV.find((n) => n.to === to)!;
const MOBILE_NAV = [
  navItem('/'),
  navItem('/lancamentos'),
  navItem('/relatorios'),
  { to: '/mais', label: 'Mais', short: 'Mais', icon: Menu },
];
const MORE_ROUTES = ['/mais', '/contas', '/cartoes', '/orcamentos', '/metas', '/configuracoes'];

export default function Layout({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const { data, updateSettings } = useFinance();
  const { editor, openTransaction, closeTransaction } = useUI();
  const theme = useResolvedTheme();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.title = `${title} · Finanças`;
  }, [title]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const hide = data.settings.hideValues;

  return (
    <div className={`app ${hide ? 'blur-values' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo"><TrendingUp size={19} /></span>
          Finanças
        </div>
        <button className="btn btn-primary" style={{ marginBottom: 14 }} onClick={() => openTransaction()}>
          <Plus size={18} /> Novo lançamento
        </button>
        <nav className="nav" aria-label="Principal">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={19} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontWeight: 600, fontSize: 14 }}>{data.settings.userName ? `Olá, ${data.settings.userName}` : 'Olá!'}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>Seus dados ficam salvos neste dispositivo.</div>
        </div>
      </aside>

      <div className="main">
        <header className={`topbar ${scrolled ? 'scrolled' : ''}`}>
          <h1>{title}</h1>
          <div className="spacer" />
          {actions}
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => updateSettings({ hideValues: !hide })}
            aria-label={hide ? 'Mostrar valores' : 'Ocultar valores'}
            title={hide ? 'Mostrar valores' : 'Ocultar valores'}
          >
            {hide ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
          <button
            className="btn btn-ghost btn-icon hide-mobile"
            onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
            aria-label="Alternar tema"
            title="Alternar tema"
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </header>

        <main className="content">{children}</main>
      </div>

      <nav className="bottom-nav" aria-label="Navegação">
        {MOBILE_NAV.slice(0, 2).map(({ to, short, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon size={21} /> {short}
          </NavLink>
        ))}
        <button className="add-btn" onClick={() => openTransaction()} aria-label="Novo lançamento">
          <span><Plus size={24} /></span>
          <span>Adicionar</span>
        </button>
        {MOBILE_NAV.slice(2).map(({ to, short, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive || (to === '/mais' && MORE_ROUTES.includes(location.pathname)) ? 'active' : '')}
          >
            <Icon size={21} /> {short}
          </NavLink>
        ))}
      </nav>

      {editor && <TransactionForm tx={editor.tx} defaultType={editor.defaultType} defaultCardId={editor.defaultCardId} onClose={closeTransaction} />}
    </div>
  );
}

export { NAV };
