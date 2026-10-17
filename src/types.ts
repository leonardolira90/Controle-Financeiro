export type TxType = 'income' | 'expense' | 'transfer';

export type AccountType = 'corrente' | 'poupanca' | 'carteira' | 'investimento' | 'credito';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  description: string;
  amount: number;
  /** Data no formato YYYY-MM-DD */
  date: string;
  categoryId?: string;
  accountId: string;
  /** Conta de destino (somente transferências) */
  toAccountId?: string;
  paid: boolean;
  notes?: string;
  /** Identifica lançamentos gerados juntos (parcelas/recorrência) */
  groupId?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline?: string;
  color: string;
}

export interface Settings {
  userName: string;
  theme: 'light' | 'dark' | 'system';
  hideValues: boolean;
}

export interface FinanceData {
  version: number;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  settings: Settings;
}
