import type { Account, Category, Transaction } from '../types';
import { monthKey, shiftMonth } from './format';

/** Variação do saldo de uma conta causada por um lançamento. */
export const txDelta = (tx: Transaction, accountId: string) => {
  // Compras no cartão não saem da conta: o dinheiro sai quando a fatura é paga
  if (!tx.paid || (tx.type === 'expense' && tx.cardId)) return 0;
  if (tx.type === 'income' && tx.accountId === accountId) return tx.amount;
  if (tx.type === 'expense' && tx.accountId === accountId) return -tx.amount;
  if (tx.type === 'transfer') {
    if (tx.accountId === accountId) return -tx.amount;
    if (tx.toAccountId === accountId) return tx.amount;
  }
  return 0;
};

/** Saldo da conta considerando lançamentos efetivados até a data (inclusive). */
export const accountBalance = (account: Account, txs: Transaction[], upTo?: string) =>
  txs.reduce(
    (sum, tx) => (upTo && tx.date > upTo ? sum : sum + txDelta(tx, account.id)),
    account.initialBalance,
  );

export const totalBalance = (accounts: Account[], txs: Transaction[], upTo?: string) =>
  accounts.reduce((sum, acc) => sum + accountBalance(acc, txs, upTo), 0);

export const inRange = (tx: Transaction, start: string, end: string) => tx.date >= start && tx.date <= end;

export const inMonth = (tx: Transaction, key: string) => monthKey(tx.date) === key;

export interface Totals {
  income: number;
  expense: number;
  balance: number;
  pendingIncome: number;
  pendingExpense: number;
}

export const sumTotals = (txs: Transaction[]): Totals => {
  const t: Totals = { income: 0, expense: 0, balance: 0, pendingIncome: 0, pendingExpense: 0 };
  for (const tx of txs) {
    if (tx.type === 'income') {
      t.income += tx.amount;
      if (!tx.paid) t.pendingIncome += tx.amount;
    } else if (tx.type === 'expense') {
      t.expense += tx.amount;
      if (!tx.paid) t.pendingExpense += tx.amount;
    }
  }
  t.balance = t.income - t.expense;
  return t;
};

export interface CategorySlice {
  id: string;
  name: string;
  color: string;
  icon: string;
  value: number;
  share: number;
  count: number;
}

export const OTHER_COLOR = '#8b8f98';

/** Soma por categoria, ordenada da maior para a menor. Opcionalmente agrupa a cauda em "Outros". */
export const byCategory = (
  txs: Transaction[],
  categories: Category[],
  type: 'income' | 'expense',
  maxSlices?: number,
): CategorySlice[] => {
  const map = new Map<string, { value: number; count: number }>();
  for (const tx of txs) {
    if (tx.type !== type) continue;
    const key = tx.categoryId ?? 'none';
    const entry = map.get(key) ?? { value: 0, count: 0 };
    entry.value += tx.amount;
    entry.count += 1;
    map.set(key, entry);
  }
  const total = [...map.values()].reduce((s, e) => s + e.value, 0) || 1;
  const slices = [...map.entries()]
    .map(([id, e]) => {
      const cat = categories.find((c) => c.id === id);
      return {
        id,
        name: cat?.name ?? 'Sem categoria',
        color: cat?.color ?? OTHER_COLOR,
        icon: cat?.icon ?? 'tag',
        value: e.value,
        count: e.count,
        share: e.value / total,
      };
    })
    .sort((a, b) => b.value - a.value);

  if (maxSlices && slices.length > maxSlices) {
    const head = slices.slice(0, maxSlices - 1);
    const tail = slices.slice(maxSlices - 1);
    const value = tail.reduce((s, x) => s + x.value, 0);
    head.push({
      id: 'others',
      name: 'Outros',
      color: OTHER_COLOR,
      icon: 'more',
      value,
      count: tail.reduce((s, x) => s + x.count, 0),
      share: value / total,
    });
    return head;
  }
  return slices;
};

export interface MonthPoint {
  key: string;
  income: number;
  expense: number;
  result: number;
  balance: number;
}

/** Série mensal (receitas, despesas, resultado e saldo ao fim do mês) dos `count` meses até `endKey`. */
export const monthlySeries = (
  txs: Transaction[],
  accounts: Account[],
  endKey: string,
  count: number,
): MonthPoint[] => {
  const points: MonthPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const key = shiftMonth(endKey, -i);
    const totals = sumTotals(txs.filter((tx) => inMonth(tx, key)));
    points.push({
      key,
      income: totals.income,
      expense: totals.expense,
      result: totals.balance,
      balance: totalBalance(accounts, txs, `${key}-31`),
    });
  }
  return points;
};

export const monthsBetween = (startKey: string, endKey: string) => {
  const keys: string[] = [];
  let key = startKey;
  while (key <= endKey && keys.length < 120) {
    keys.push(key);
    key = shiftMonth(key, 1);
  }
  return keys;
};
