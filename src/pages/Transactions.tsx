import { useMemo, useState } from 'react';
import { Download, Plus, Search, SearchX } from 'lucide-react';
import Layout from '../components/Layout';
import TransactionList from '../components/TransactionList';
import { EmptyState, Money, MonthPicker } from '../components/ui';
import { useFinance } from '../store/FinanceContext';
import { useUI } from '../store/UIContext';
import type { TxType } from '../types';
import { inMonth, sumTotals } from '../utils/finance';
import { exportTransactionsCSV } from '../utils/export';

export default function Transactions() {
  const { data } = useFinance();
  const { month, setMonth, openTransaction } = useUI();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | TxType>('all');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [status, setStatus] = useState<'all' | 'paid' | 'pending'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.transactions.filter(
      (t) =>
        inMonth(t, month) &&
        (type === 'all' || t.type === type) &&
        (!categoryId || t.categoryId === categoryId) &&
        (!accountId || (accountId.startsWith('card:') ? t.cardId === accountId.slice(5) : t.accountId === accountId || t.toAccountId === accountId)) &&
        (status === 'all' || (status === 'paid' ? t.paid : !t.paid)) &&
        (!q || t.description.toLowerCase().includes(q) || (t.notes ?? '').toLowerCase().includes(q)),
    );
  }, [data.transactions, month, query, type, categoryId, accountId, status]);

  const totals = sumTotals(filtered);
  const hasFilters = query || type !== 'all' || categoryId || accountId || status !== 'all';

  return (
    <Layout
      title="Lançamentos"
      actions={
        <>
          <button className="btn hide-mobile" onClick={() => exportTransactionsCSV(filtered, data, `lancamentos-${month}.csv`)} disabled={!filtered.length}>
            <Download size={16} /> Exportar CSV
          </button>
          <button className="btn btn-primary hide-mobile" onClick={() => openTransaction()}>
            <Plus size={17} /> Novo
          </button>
        </>
      }
    >
      <div className="toolbar">
        <MonthPicker value={month} onChange={setMonth} />
        <div className="search">
          <Search size={16} />
          <input className="input" placeholder="Buscar por descrição" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar" />
        </div>
        <select className="select" value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label="Tipo">
          <option value="all">Todos os tipos</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
          <option value="transfer">Transferências</option>
        </select>
        <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="select" value={accountId} onChange={(e) => setAccountId(e.target.value)} aria-label="Conta">
          <option value="">{data.cards.length ? 'Todas as contas e cartões' : 'Todas as contas'}</option>
          {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          {data.cards.map((c) => <option key={c.id} value={`card:${c.id}`}>Cartão: {c.name}</option>)}
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Situação">
          <option value="all">Todas as situações</option>
          <option value="paid">Efetivados</option>
          <option value="pending">Pendentes</option>
        </select>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="card row-between"><span className="text-2">Receitas</span><Money value={totals.income} className="income" /></div>
        <div className="card row-between"><span className="text-2">Despesas</span><Money value={totals.expense} className="expense" /></div>
        <div className="card row-between"><span className="text-2">Resultado</span><strong><Money value={totals.balance} signed /></strong></div>
      </div>

      <div className="card">
        {filtered.length ? (
          <TransactionList items={filtered} />
        ) : hasFilters ? (
          <EmptyState icon={SearchX} title="Nada encontrado" text="Ajuste os filtros ou a busca para ver outros lançamentos." />
        ) : (
          <EmptyState
            title="Nenhum lançamento neste mês"
            text="Registre receitas, despesas e transferências para acompanhar sua vida financeira."
            action={<button className="btn btn-primary" onClick={() => openTransaction()}><Plus size={16} /> Novo lançamento</button>}
          />
        )}
      </div>
    </Layout>
  );
}
