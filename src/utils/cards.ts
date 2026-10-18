import type { CreditCard, Transaction } from '../types';
import { parseDate, shiftMonth, toISODate } from './format';

/** Compra no cartão (despesa vinculada a um cartão). */
export const isCardPurchase = (tx: Transaction) => tx.type === 'expense' && !!tx.cardId;

/** Pagamento de fatura (transferência da conta para o cartão). */
export const isCardPayment = (tx: Transaction) => tx.type === 'transfer' && !!tx.cardId;

const clampDay = (key: string, day: number) => {
  const [y, m] = key.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${key}-${String(Math.min(day, last)).padStart(2, '0')}`;
};

/**
 * Fatura (identificada pelo mês de vencimento) em que cai uma compra feita na data informada.
 * Compras a partir do dia de fechamento entram na fatura seguinte.
 */
export const invoiceForDate = (card: CreditCard, iso: string) => {
  const date = parseDate(iso);
  const key = iso.slice(0, 7);
  // Em meses curtos, o fechamento é no último dia do mês (ex.: dia 31 → 28/fev)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const closingKey = date.getDate() >= Math.min(card.closingDay, lastDay) ? shiftMonth(key, 1) : key;
  return card.dueDay <= card.closingDay ? shiftMonth(closingKey, 1) : closingKey;
};

/** Datas de fechamento e vencimento de uma fatura. */
export const invoiceDates = (card: CreditCard, invoice: string) => {
  const closingKey = card.dueDay <= card.closingDay ? shiftMonth(invoice, -1) : invoice;
  return { closing: clampDay(closingKey, card.closingDay), due: clampDay(invoice, card.dueDay) };
};

export type InvoiceStatus = 'aberta' | 'fechada' | 'vencida' | 'paga' | 'futura';

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  futura: 'Futura',
  aberta: 'Aberta',
  fechada: 'Fechada',
  vencida: 'Vencida',
  paga: 'Paga',
};

export interface InvoiceSummary {
  invoice: string;
  closing: string;
  due: string;
  purchases: Transaction[];
  payments: Transaction[];
  total: number;
  paid: number;
  remaining: number;
  status: InvoiceStatus;
}

export const invoiceSummary = (card: CreditCard, txs: Transaction[], invoice: string, today = toISODate(new Date())): InvoiceSummary => {
  const purchases = txs.filter((t) => isCardPurchase(t) && t.cardId === card.id && t.invoice === invoice);
  const payments = txs.filter((t) => isCardPayment(t) && t.cardId === card.id && t.invoice === invoice);
  const total = purchases.reduce((s, t) => s + t.amount, 0);
  const paid = payments.filter((t) => t.paid).reduce((s, t) => s + t.amount, 0);
  const remaining = Math.max(0, Math.round((total - paid) * 100) / 100);
  const { closing, due } = invoiceDates(card, invoice);
  const openingKey = shiftMonth(closing.slice(0, 7), -1);
  let status: InvoiceStatus;
  if (total > 0 && remaining <= 0) status = 'paga';
  else if (today >= closing) status = today > due && remaining > 0 ? 'vencida' : total > 0 ? 'fechada' : 'paga';
  else status = today >= clampDay(openingKey, card.closingDay) ? 'aberta' : 'futura';
  return { invoice, closing, due, purchases, payments, total, paid, remaining, status };
};

/** Limite utilizado = compras ainda não pagas (inclui parcelas futuras). */
export const cardUsage = (card: CreditCard, txs: Transaction[]) => {
  let purchases = 0;
  let payments = 0;
  for (const t of txs) {
    if (t.cardId !== card.id) continue;
    if (isCardPurchase(t)) purchases += t.amount;
    else if (isCardPayment(t) && t.paid) payments += t.amount;
  }
  const used = Math.max(0, Math.round((purchases - payments) * 100) / 100);
  return { used, available: card.limit - used };
};

/** Fatura atual: a que está aberta hoje para novas compras. */
export const currentInvoice = (card: CreditCard, today = toISODate(new Date())) => invoiceForDate(card, today);
