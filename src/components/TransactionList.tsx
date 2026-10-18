import { ArrowLeftRight, Clock, CreditCard } from 'lucide-react';
import { useFinance } from '../store/FinanceContext';
import { useUI } from '../store/UIContext';
import type { Transaction } from '../types';
import { formatDayHeader, monthLabel } from '../utils/format';
import { CategoryIcon, IconBadge } from './Icons';
import { Money } from './ui';

function TransactionRow({ tx }: { tx: Transaction }) {
  const { getCategory, getAccount, getCard } = useFinance();
  const { openTransaction } = useUI();
  const cat = getCategory(tx.categoryId);
  const acc = getAccount(tx.accountId);
  const to = getAccount(tx.toAccountId);
  const card = getCard(tx.cardId);
  const source = card && tx.type === 'expense' ? card.name : acc?.name ?? '—';
  const meta = tx.type !== 'transfer'
    ? `${cat?.name ?? 'Sem categoria'} · ${source}`
    : card
      ? `${acc?.name ?? '—'} → fatura ${card.name}${tx.invoice ? ` (${monthLabel(tx.invoice, true)})` : ''}`
      : `${acc?.name ?? '—'} → ${to?.name ?? '—'}`;
  const sign = tx.type === 'income' ? 1 : tx.type === 'expense' ? -1 : 0;

  return (
    <button className="tx-item" onClick={() => openTransaction(tx)}>
      {tx.type === 'transfer'
        ? <IconBadge icon={card ? CreditCard : ArrowLeftRight} color={card?.color ?? '#2a78d6'} />
        : <CategoryIcon icon={cat?.icon} color={cat?.color ?? '#8b8f98'} />}
      <div className="tx-main">
        <div className="tx-desc">{tx.description}</div>
        <div className="tx-meta">
          <span>{meta}</span>
          {card && tx.type === 'expense' && <span className="badge badge-neutral"><CreditCard size={11} />Cartão</span>}
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
