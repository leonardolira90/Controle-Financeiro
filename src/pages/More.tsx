import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Layout, { NAV } from '../components/Layout';

/** Menu complementar exibido na navegação inferior do celular. */
export default function More() {
  const items = NAV.filter((n) => ['/contas', '/orcamentos', '/metas', '/configuracoes'].includes(n.to));
  return (
    <Layout title="Mais opções">
      <div className="card" style={{ padding: 8 }}>
        <div className="tx-list">
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="tx-item">
              <span className="cat-icon" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}><Icon size={20} /></span>
              <span className="tx-main" style={{ fontWeight: 600 }}>{label}</span>
              <ChevronRight size={18} className="muted" />
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
