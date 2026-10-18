import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { Account, Category, CreditCard, FinanceData, Settings } from '../types';
import { demoData, emptyData } from './seed';

const STORAGE_KEY = 'financas:data';

type Collection = 'accounts' | 'categories' | 'transactions' | 'budgets' | 'goals' | 'cards';
type Item<C extends Collection> = FinanceData[C][number];

type Action =
  | { type: 'upsert'; collection: Collection; items: { id: string }[] }
  | { type: 'remove'; collection: Collection; ids: string[] }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'replace'; data: FinanceData };

const reducer = (state: FinanceData, action: Action): FinanceData => {
  switch (action.type) {
    case 'upsert': {
      const list = [...(state[action.collection] as { id: string }[])];
      for (const item of action.items) {
        const idx = list.findIndex((x) => x.id === item.id);
        if (idx >= 0) list[idx] = item;
        else list.push(item);
      }
      return { ...state, [action.collection]: list };
    }
    case 'remove': {
      const ids = new Set(action.ids);
      const next = { ...state, [action.collection]: (state[action.collection] as { id: string }[]).filter((x) => !ids.has(x.id)) };
      // Remove dependências órfãs
      if (action.collection === 'accounts')
        next.transactions = next.transactions.filter((t) => !ids.has(t.accountId) && !(t.toAccountId && ids.has(t.toAccountId)));
      if (action.collection === 'cards') next.transactions = next.transactions.filter((t) => !(t.cardId && ids.has(t.cardId)));
      if (action.collection === 'categories') {
        next.transactions = next.transactions.map((t) => (t.categoryId && ids.has(t.categoryId) ? { ...t, categoryId: undefined } : t));
        next.budgets = next.budgets.filter((b) => !ids.has(b.categoryId));
      }
      return next;
    }
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'replace':
      return action.data;
  }
};

const load = (): FinanceData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FinanceData;
      if (parsed && Array.isArray(parsed.transactions)) return { ...emptyData(), ...parsed };
    }
  } catch {
    /* armazenamento indisponível: segue com dados de demonstração */
  }
  return demoData();
};

export const isValidData = (data: unknown): data is FinanceData => {
  const d = data as FinanceData;
  return !!d && Array.isArray(d.accounts) && Array.isArray(d.categories) && Array.isArray(d.transactions);
};

interface FinanceApi {
  data: FinanceData;
  save: <C extends Collection>(collection: C, ...items: Item<C>[]) => void;
  remove: (collection: Collection, ...ids: string[]) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceAll: (data: FinanceData) => void;
  getCategory: (id?: string) => Category | undefined;
  getAccount: (id?: string) => Account | undefined;
  getCard: (id?: string) => CreditCard | undefined;
}

const FinanceContext = createContext<FinanceApi | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignora falhas de quota/modo privado */
    }
  }, [data]);

  const api = useMemo<FinanceApi>(
    () => ({
      data,
      save: (collection, ...items) => dispatch({ type: 'upsert', collection, items }),
      remove: (collection, ...ids) => dispatch({ type: 'remove', collection, ids }),
      updateSettings: (patch) => dispatch({ type: 'settings', patch }),
      replaceAll: (next) => dispatch({ type: 'replace', data: { ...emptyData(), ...next } }),
      getCategory: (id) => data.categories.find((c) => c.id === id),
      getAccount: (id) => data.accounts.find((a) => a.id === id),
      getCard: (id) => data.cards.find((c) => c.id === id),
    }),
    [data],
  );

  return <FinanceContext.Provider value={api}>{children}</FinanceContext.Provider>;
}

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance deve ser usado dentro de FinanceProvider');
  return ctx;
};

