import { ArrowLeftRight, Clock } from 'lucide-react';
import { useFinance } from '../store/FinanceContext';
import { useUI } from '../store/UIContext';
import type { Transaction } from '../types';
import { formatDayHeader } from '../utils/format';
import { CategoryIcon, IconBadge } from './Icons';
import { Money } from './ui';

function TransactionRow({ tx }: { tx: Transaction }) {
  const { getCategory, getAccount } = useFinance();
  const { openTransaction } = useUI();
  const cat = getCategory(tx.categoryId);
  const acc = getAccount(tx.accountId);
  const to = getAccount(tx.toAccountId);
  const sign = tx.type === 'income' ? 1 : tx.type === 'expense' ? -1 : 0;

  return (
    <button className="tx-item" onClick={() => openTransaction(tx)}>
      {tx.type === 'transfer'
        ? <IconBadge icon={ArrowLeftRight} color="#2a78d6" />
        : <CategoryIcon icon={cat?.icon} color={cat?.color ?? '#8b8f98'} />}
      <div className="tx-main">
        <div className="tx-desc">{tx.description}</div>
        <div className="tx-meta">
          <span>{tx.type === 'transfer' ? `${acc?.name ?? '—'} → ${to?.name ?? '—'}` : `${cat?.name ?? 'Sem categoria'} · ${acc?.name ?? '—'}`}</span>
          {!tx.paid && <span className="badge badge-pending"><Clock size={11} />Pendente</span>}
        </div>
      </div>
      <Money
        value={sign === 0 ? tx.amount : sign * tx.amount}
        signed={sign !== 0}
        className={`tx-amount ${tx.type}`}
      />
    </button>
  );
}

/** Lista agrupada por dia, do mais recente para o mais antigo (ou o inverso com `ascending`). */
export default function TransactionList({ items, limit, ascending }: { items: Transaction[]; limit?: number; ascending?: boolean }) {
  const dir = ascending ? -1 : 1;
  const sorted = [...items].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? dir : -dir));
  const shown = limit ? sorted.slice(0, limit) : sorted;
  const groups = new Map<string, Transaction[]>();
  for (const tx of shown) groups.set(tx.date, [...(groups.get(tx.date) ?? []), tx]);

  return (
    <div>
      {[...groups.entries()].map(([date, txs]) => {
        const net = txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0), 0);
        return (
          <div className="tx-group" key={date}>
            <div className="tx-group-header">
              <span>{formatDayHeader(date)}</span>
              <Money value={net} signed />
            </div>
            <div className="tx-list">
              {txs.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
