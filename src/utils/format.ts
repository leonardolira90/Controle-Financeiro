const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

export const formatCurrency = (value: number) => currency.format(value);

export const formatCompact = (value: number) => `R$ ${compact.format(value)}`;

/** Rótulo curto para eixos de gráfico (sem prefixo de moeda, para não quebrar linha). */
export const formatAxis = (value: number) => compact.format(value);

export const formatPercent = (value: number, digits = 0) =>
  `${(value * 100).toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
export const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Converte "YYYY-MM-DD" em Date local (sem deslocamento de fuso). */
export const parseDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const toISODate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const todayISO = () => toISODate(new Date());

export const formatDate = (iso: string) => parseDate(iso).toLocaleDateString('pt-BR');

export const formatDayHeader = (iso: string) => {
  const date = parseDate(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (toISODate(date) === toISODate(today)) return 'Hoje';
  if (toISODate(date) === toISODate(yesterday)) return 'Ontem';
  const text = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Chave de mês "YYYY-MM" */
export const monthKey = (iso: string) => iso.slice(0, 7);

export const monthLabel = (key: string, short = false) => {
  const [y, m] = key.split('-').map(Number);
  return short ? `${MONTHS_SHORT[m - 1]}/${String(y).slice(2)}` : `${MONTHS[m - 1]} ${y}`;
};

export const shiftMonth = (key: string, delta: number) => {
  const [y, m] = key.split('-').map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const currentMonthKey = () => monthKey(todayISO());

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
