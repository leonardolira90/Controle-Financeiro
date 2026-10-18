import type { FinanceData, Transaction } from '../types';
import { formatDate } from './format';

const download = (filename: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const TYPE_LABEL = { income: 'Receita', expense: 'Despesa', transfer: 'Transferência' } as const;

/** Exporta lançamentos em CSV (separador ";" e decimal com vírgula, compatível com Excel em pt-BR). */
export const exportTransactionsCSV = (txs: Transaction[], data: FinanceData, filename = 'lancamentos.csv') => {
  const header = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Conta', 'Conta destino', 'Cartão', 'Fatura', 'Valor', 'Situação', 'Observações'];
  const rows = [...txs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [
      formatDate(t.date),
      TYPE_LABEL[t.type],
      t.description,
      data.categories.find((c) => c.id === t.categoryId)?.name ?? '',
      data.accounts.find((a) => a.id === t.accountId)?.name ?? '',
      data.accounts.find((a) => a.id === t.toAccountId)?.name ?? '',
      data.cards.find((c) => c.id === t.cardId)?.name ?? '',
      t.invoice ? `${t.invoice.slice(5, 7)}/${t.invoice.slice(0, 4)}` : '',
      (t.type === 'expense' ? -t.amount : t.amount).toFixed(2).replace('.', ','),
      t.paid ? 'Efetivado' : 'Pendente',
      t.notes ?? '',
    ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(';')).join('\r\n');
  download(filename, `﻿${csv}`, 'text/csv;charset=utf-8');
};

export const exportBackup = (data: FinanceData) =>
  download(`financas-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
