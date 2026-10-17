import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Pencil, PiggyBank, Plus, XCircle } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import MoneyInput from '../components/MoneyInput';
import { CategoryIcon } from '../components/Icons';
import { EmptyState, Money, MonthPicker, Progress } from '../components/ui';
import { useFinance } from '../store/FinanceContext';
import { useUI } from '../store/UIContext';
import type { Budget } from '../types';
import { inMonth } from '../utils/finance';
import { formatCurrency, formatPercent, shiftMonth, uid } from '../utils/format';

function BudgetForm({ budget, onClose }: { budget?: Budget; onClose: () => void }) {
  const { data, save, remove } = useFinance();
  const { month } = useUI();
  const available = data.categories.filter(
    (c) => c.type === 'expense' && (c.id === budget?.categoryId || !data.budgets.some((b) => b.categoryId === c.id)),
  );
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? available[0]?.id ?? '');
  const [limit, setLimit] = useState(budget?.limit ?? 0);

  // Sugestão: média de gastos dos 3 meses anteriores
  const suggestion = useMemo(() => {
    const months = [1, 2, 3].map((i) => shiftMonth(month, -i));
    const total = data.transactions
      .filter((t) => t.type === 'expense' && t.categoryId === categoryId && months.some((m) => inMonth(t, m)))
      .reduce((s, t) => s + t.amount, 0);
    return Math.round(total / 3);
  }, [data.transactions, categoryId, month]);

  const submit = () => {
    if (!categoryId || limit <= 0) return;
    save('budgets', { id: budget?.id ?? uid(), categoryId, limit });
    onClose();
  };

  return (
    <Modal
      title={budget ? 'Editar orçamento' : 'Novo orçamento'}
      onClose={onClose}
      footer={
        <>
          {budget && <button className="btn btn-danger left" onClick={() => { remove('budgets', budget.id); onClose(); }}>Excluir</button>}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={!categoryId || limit <= 0}>Salvar</button>
        </>
      }
    >
      {available.length ? (
        <>
          <div className="field">
            <label htmlFor="b-cat">Categoria</label>
            <select id="b-cat" className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {available.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="b-limit">Limite mensal</label>
            <MoneyInput id="b-limit" value={limit} onChange={setLimit} />
          </div>
          {suggestion > 0 && (
            <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setLimit(suggestion)}>
              Usar média dos últimos 3 meses: {formatCurrency(suggestion)}
            </button>
          )}
        </>
      ) : (
        <p className="muted" style={{ margin: 0 }}>Todas as categorias de despesa já possuem orçamento.</p>
      )}
    </Modal>
  );
}

export default function Budgets() {
  const { data, getCategory } = useFinance();
  const { month, setMonth } = useUI();
  const [editing, setEditing] = useState<Budget | 'new' | null>(null);

  const rows = useMemo(
    () =>
      data.budgets
        .map((b) => {
          const spent = data.transactions
            .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId && inMonth(t, month))
            .reduce((s, t) => s + t.amount, 0);
          return { budget: b, cat: getCategory(b.categoryId), spent, pct: spent / b.limit };
        })
        .sort((a, b) => b.pct - a.pct),
    [data, month, getCategory],
  );

  const totalLimit = rows.reduce((s, r) => s + r.budget.limit, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const over = rows.filter((r) => r.pct > 1).length;

  return (
    <Layout title="Orçamentos" actions={<button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={17} /> <span className="hide-mobile">Novo orçamento</span></button>}>
      <div className="toolbar"><MonthPicker value={month} onChange={setMonth} /></div>

      <div className="stack">
        <div className="card">
          <div className="row-between wrap" style={{ marginBottom: 14 }}>
            <div>
              <div className="muted" style={{ fontSize: 13 }}>Total gasto em categorias orçadas</div>
              <div className="stat-value"><Money value={totalSpent} /> <span className="muted" style={{ fontSize: 16, fontWeight: 500 }}>de <Money value={totalLimit} /></span></div>
            </div>
            {over > 0
              ? <span className="badge badge-danger"><XCircle size={13} /> {over} {over === 1 ? 'categoria acima' : 'categorias acima'} do limite</span>
              : rows.length > 0 && <span className="badge badge-ok"><CheckCircle2 size={13} /> Tudo dentro do planejado</span>}
          </div>
          <Progress value={totalLimit ? totalSpent / totalLimit : 0} color={totalSpent > totalLimit ? 'var(--danger)' : 'var(--brand)'} />
          <div className="row-between" style={{ marginTop: 8, fontSize: 13 }}>
            <span className="muted">{totalLimit ? formatPercent(totalSpent / totalLimit) : '0%'} utilizado</span>
            <span className="muted">Disponível: <Money value={Math.max(0, totalLimit - totalSpent)} /></span>
          </div>
        </div>

        {rows.length ? (
          <div className="grid grid-2">
            {rows.map(({ budget, cat, spent, pct }) => {
              const status = pct > 1 ? 'over' : pct > 0.8 ? 'warn' : 'ok';
              return (
                <div key={budget.id} className="card">
                  <div className="row" style={{ marginBottom: 14 }}>
                    <CategoryIcon icon={cat?.icon} color={cat?.color ?? '#8b8f98'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{cat?.name ?? 'Categoria removida'}</div>
                      <div className="muted num" style={{ fontSize: 13 }}><Money value={spent} /> de <Money value={budget.limit} /></div>
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(budget)} aria-label="Editar orçamento"><Pencil size={16} /></button>
                  </div>
                  <Progress value={pct} color={status === 'over' ? 'var(--danger)' : status === 'warn' ? 'var(--warning)' : cat?.color ?? 'var(--brand)'} />
                  <div className="row-between" style={{ marginTop: 10, fontSize: 13 }}>
                    {status === 'over' ? (
                      <span className="badge badge-danger"><XCircle size={12} /> Excedido em <Money value={spent - budget.limit} /></span>
                    ) : status === 'warn' ? (
                      <span className="badge badge-pending"><AlertTriangle size={12} /> Restam <Money value={budget.limit - spent} /></span>
                    ) : (
                      <span className="badge badge-ok"><CheckCircle2 size={12} /> Restam <Money value={budget.limit - spent} /></span>
                    )}
                    <strong className="num">{formatPercent(pct)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card">
            <EmptyState
              icon={PiggyBank}
              title="Nenhum orçamento definido"
              text="Defina limites mensais de gastos por categoria e acompanhe quanto ainda pode gastar."
              action={<button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={16} /> Criar orçamento</button>}
            />
          </div>
        )}
      </div>

      {editing && <BudgetForm budget={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </Layout>
  );
}
