import type { Account, Category, CreditCard, FinanceData, Transaction } from '../types';
import { invoiceDates, invoiceForDate } from '../utils/cards';
import { shiftMonth, currentMonthKey, todayISO, uid } from '../utils/format';

/** Paleta categórica validada (ordem fixa) + tons extras para categorias além da oitava. */
export const PALETTE = [
  '#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948',
  '#0e7490', '#a16207', '#7c3aed', '#64748b',
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c-moradia', name: 'Moradia', type: 'expense', color: '#2a78d6', icon: 'home' },
  { id: 'c-alimentacao', name: 'Alimentação', type: 'expense', color: '#eb6834', icon: 'utensils' },
  { id: 'c-transporte', name: 'Transporte', type: 'expense', color: '#1baf7a', icon: 'car' },
  { id: 'c-mercado', name: 'Mercado', type: 'expense', color: '#eda100', icon: 'cart' },
  { id: 'c-lazer', name: 'Lazer', type: 'expense', color: '#e87ba4', icon: 'party' },
  { id: 'c-saude', name: 'Saúde', type: 'expense', color: '#008300', icon: 'heart' },
  { id: 'c-educacao', name: 'Educação', type: 'expense', color: '#6250d6', icon: 'book' },
  { id: 'c-compras', name: 'Compras', type: 'expense', color: '#e34948', icon: 'bag' },
  { id: 'c-assinaturas', name: 'Assinaturas', type: 'expense', color: '#0e7490', icon: 'tv' },
  { id: 'c-contas', name: 'Contas e serviços', type: 'expense', color: '#a16207', icon: 'bolt' },
  { id: 'c-outros-d', name: 'Outras despesas', type: 'expense', color: '#64748b', icon: 'tag' },
  { id: 'c-salario', name: 'Salário', type: 'income', color: '#1baf7a', icon: 'briefcase' },
  { id: 'c-freela', name: 'Freelance', type: 'income', color: '#2a78d6', icon: 'laptop' },
  { id: 'c-invest', name: 'Rendimentos', type: 'income', color: '#6250d6', icon: 'trending' },
  { id: 'c-outros-r', name: 'Outras receitas', type: 'income', color: '#64748b', icon: 'tag' },
];

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'a-corrente', name: 'Conta corrente', type: 'corrente', initialBalance: 3200, color: '#2a78d6' },
  { id: 'a-poupanca', name: 'Poupança', type: 'poupanca', initialBalance: 8500, color: '#1baf7a' },
  { id: 'a-carteira', name: 'Carteira', type: 'carteira', initialBalance: 900, color: '#eda100' },
];

const DEMO_CARD: CreditCard = {
  id: 'k-principal', name: 'Cartão principal', limit: 6000, closingDay: 25, dueDay: 5, paymentAccountId: 'a-corrente', color: '#6250d6',
};

export const emptyData = (): FinanceData => ({
  version: 1,
  accounts: [{ id: 'a-corrente', name: 'Conta corrente', type: 'corrente', initialBalance: 0, color: '#2a78d6' }],
  categories: DEFAULT_CATEGORIES,
  transactions: [],
  budgets: [],
  goals: [],
  cards: [],
  settings: { userName: '', theme: 'system', hideValues: false },
});

/** Gerador pseudo-aleatório determinístico para que a demonstração seja estável. */
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

export const demoData = (): FinanceData => {
  const rand = rng(42);
  const txs: Transaction[] = [];
  const today = todayISO();
  const current = currentMonthKey();
  const vary = (base: number, pct = 0.2) => Math.round(base * (1 - pct + rand() * pct * 2) * 100) / 100;

  const add = (t: Omit<Transaction, 'id' | 'paid'> & { paid?: boolean }) => {
    txs.push({ id: uid(), paid: t.paid ?? t.date <= today, ...t });
  };

  for (let i = 5; i >= 0; i--) {
    const key = shiftMonth(current, -i);
    const d = (day: number) => `${key}-${String(day).padStart(2, '0')}`;

    add({ type: 'income', description: 'Salário', amount: 7800, date: d(5), categoryId: 'c-salario', accountId: 'a-corrente' });
    if (rand() > 0.4)
      add({ type: 'income', description: 'Projeto freelance', amount: vary(1500, 0.4), date: d(18), categoryId: 'c-freela', accountId: 'a-corrente' });
    add({ type: 'income', description: 'Rendimento poupança', amount: vary(62, 0.1), date: d(28), categoryId: 'c-invest', accountId: 'a-poupanca' });

    add({ type: 'expense', description: 'Aluguel', amount: 2100, date: d(10), categoryId: 'c-moradia', accountId: 'a-corrente' });
    add({ type: 'expense', description: 'Condomínio', amount: 480, date: d(10), categoryId: 'c-moradia', accountId: 'a-corrente' });
    add({ type: 'expense', description: 'Energia elétrica', amount: vary(210), date: d(15), categoryId: 'c-contas', accountId: 'a-corrente' });
    add({ type: 'expense', description: 'Internet', amount: 119.9, date: d(12), categoryId: 'c-contas', accountId: 'a-corrente' });
    add({ type: 'expense', description: 'Streaming', amount: 55.9, date: d(8), categoryId: 'c-assinaturas', accountId: 'a-corrente' });
    add({ type: 'expense', description: 'Academia', amount: 129.9, date: d(6), categoryId: 'c-saude', accountId: 'a-corrente' });
    add({ type: 'expense', description: 'Curso online', amount: 89.9, date: d(20), categoryId: 'c-educacao', accountId: 'a-corrente' });

    for (const day of [3, 11, 19, 26])
      add({ type: 'expense', description: 'Supermercado', amount: vary(310, 0.3), date: d(day), categoryId: 'c-mercado', accountId: 'a-corrente' });
    for (const day of [2, 7, 9, 14, 17, 22, 24, 27])
      add({ type: 'expense', description: rand() > 0.5 ? 'Restaurante' : 'Delivery', amount: vary(68, 0.5), date: d(day), categoryId: 'c-alimentacao', accountId: rand() > 0.8 ? 'a-carteira' : 'a-corrente' });
    for (const day of [4, 13, 21])
      add({ type: 'expense', description: rand() > 0.5 ? 'Combustível' : 'Aplicativo de transporte', amount: vary(150, 0.4), date: d(day), categoryId: 'c-transporte', accountId: 'a-corrente' });
    if (rand() > 0.3)
      add({ type: 'expense', description: 'Cinema e lazer', amount: vary(180, 0.5), date: d(16), categoryId: 'c-lazer', accountId: 'a-corrente' });
    if (rand() > 0.5)
      add({ type: 'expense', description: 'Roupas', amount: vary(260, 0.5), date: d(23), categoryId: 'c-compras', accountId: 'a-corrente' });
    if (rand() > 0.6)
      add({ type: 'expense', description: 'Farmácia', amount: vary(75, 0.5), date: d(25), categoryId: 'c-saude', accountId: 'a-corrente' });

    add({ type: 'transfer', description: 'Reserva mensal', amount: 800, date: d(6), accountId: 'a-corrente', toAccountId: 'a-poupanca' });

    // Compras no cartão de crédito, cada uma com sua categoria
    const buy = (day: number, description: string, amount: number, categoryId: string) =>
      add({ type: 'expense', description, amount, date: d(day), categoryId, accountId: '', cardId: DEMO_CARD.id, invoice: invoiceForDate(DEMO_CARD, d(day)), paid: true });
    buy(8, 'Streaming de música', 21.9, 'c-assinaturas');
    buy(12, 'Restaurante', vary(140, 0.4), 'c-alimentacao');
    buy(19, rand() > 0.5 ? 'Loja de roupas' : 'Eletrônicos', vary(320, 0.5), 'c-compras');
    buy(26, 'Ingressos de show', vary(160, 0.4), 'c-lazer');
    if (rand() > 0.4) buy(15, 'Farmácia', vary(90, 0.4), 'c-saude');
  }

  // Pagamento das faturas já vencidas
  const invoices = [...new Set(txs.filter((t) => t.cardId).map((t) => t.invoice!))];
  for (const invoice of invoices) {
    const { due } = invoiceDates(DEMO_CARD, invoice);
    if (due > today) continue;
    const total = txs.filter((t) => t.cardId && t.invoice === invoice).reduce((s, t) => s + t.amount, 0);
    add({ type: 'transfer', description: `Pagamento fatura ${DEMO_CARD.name}`, amount: Math.round(total * 100) / 100, date: due, accountId: 'a-corrente', cardId: DEMO_CARD.id, invoice });
  }

  return {
    version: 1,
    accounts: DEFAULT_ACCOUNTS,
    categories: DEFAULT_CATEGORIES,
    transactions: txs,
    budgets: [
      { id: uid(), categoryId: 'c-alimentacao', limit: 600 },
      { id: uid(), categoryId: 'c-mercado', limit: 1300 },
      { id: uid(), categoryId: 'c-transporte', limit: 450 },
      { id: uid(), categoryId: 'c-lazer', limit: 250 },
    ],
    goals: [
      { id: uid(), name: 'Reserva de emergência', target: 30000, saved: 13300, color: '#1baf7a', deadline: `${Number(current.slice(0, 4)) + 1}-06-30` },
      { id: uid(), name: 'Viagem de férias', target: 8000, saved: 2450, color: '#2a78d6', deadline: `${Number(current.slice(0, 4)) + 1}-01-15` },
      { id: uid(), name: 'Notebook novo', target: 6500, saved: 5200, color: '#6250d6' },
    ],
    cards: [DEMO_CARD],
    settings: { userName: 'Leonardo', theme: 'system', hideValues: false },
  };
};
