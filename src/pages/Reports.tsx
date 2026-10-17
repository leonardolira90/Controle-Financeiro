import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarRange, Download, Percent, Printer, Scale } from 'lucide-react';
import Layout from '../components/Layout';
import { BalanceChart, CashflowChart, CategoryBars, CategoryDonut, SeriesLegend } from '../components/Charts';
import { EmptyState, Money, Segmented, StatCard } from '../components/ui';
import { useFinance } from '../store/FinanceContext';
import { byCategory, monthlySeries, monthsBetween, sumTotals } from '../utils/finance';
import { exportTransactionsCSV } from '../utils/export';
import { currentMonthKey, formatPercent, monthKey, monthLabel, shiftMonth } from '../utils/format';
import { useChartColors } from '../utils/theme';

type Period = '1m' | '3m' | '6m' | '12m' | 'year' | 'custom';

const PERIODS: { value: Period; label: string }[] = [
  { value: '1m', label: 'Mês' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '12m', label: '12 meses' },
  { value: 'year', label: 'Ano' },
  { value: 'custom', label: 'Personalizado' },
];

export default function Reports() {
  const { data } = useFinance();
  const colors = useChartColors();
  const now = currentMonthKey();
  const [period, setPeriod] = useState<Period>('6m');
  const [customStart, setCustomStart] = useState(shiftMonth(now, -2));
  const [customEnd, setCustomEnd] = useState(now);
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');

  const [startKey, endKey] = useMemo((): [string, string] => {
    switch (period) {
      case '1m': return [now, now];
      case '3m': return [shiftMonth(now, -2), now];
      case '6m': return [shiftMonth(now, -5), now];
      case '12m': return [shiftMonth(now, -11), now];
      case 'year': return [`${now.slice(0, 4)}-01`, now];
      case 'custom': return customStart <= customEnd ? [customStart, customEnd] : [customEnd, customStart];
    }
  }, [period, now, customStart, customEnd]);

  const months = monthsBetween(startKey, endKey);
  const txs = useMemo(
    () => data.transactions.filter((t) => monthKey(t.date) >= startKey && monthKey(t.date) <= endKey),
    [data.transactions, startKey, endKey],
  );
  const totals = sumTotals(txs);
  const series = useMemo(() => monthlySeries(data.transactions, data.accounts, endKey, months.length), [data, endKey, months.length]);
  const cats = useMemo(() => byCategory(txs, data.categories, catType), [txs, data.categories, catType]);
  const donut = useMemo(() => byCategory(txs, data.categories, catType, 6), [txs, data.categories, catType]);
  const catTotal = catType === 'expense' ? totals.expense : totals.income;
  const avgExpense = totals.expense / months.length;
  const savingsRate = totals.income ? totals.balance / totals.income : 0;
  const periodLabel = startKey === endKey ? monthLabel(startKey) : `${monthLabel(startKey)} a ${monthLabel(endKey)}`;

  return (
    <Layout
      title="Relatórios"
      actions={
        <>
          <button className="btn hide-mobile" onClick={() => exportTransactionsCSV(txs, data, `relatorio-${startKey}-a-${endKey}.csv`)} disabled={!txs.length}>
            <Download size={16} /> CSV
          </button>
          <button className="btn hide-mobile" onClick={() => window.print()}>
            <Printer size={16} /> Imprimir / PDF
          </button>
        </>
      }
    >
      <div className="print-only" style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22 }}>Relatório financeiro</h1>
        <p className="muted">{periodLabel}</p>
      </div>

      <div className="toolbar no-print">
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}><Segmented value={period} options={PERIODS} onChange={setPeriod} /></div>
        {period === 'custom' && (
          <div className="row wrap">
            <input type="month" className="input" style={{ width: 160, height: 40 }} value={customStart} onChange={(e) => e.target.value && setCustomStart(e.target.value)} aria-label="Mês inicial" />
            <span className="muted">até</span>
            <input type="month" className="input" style={{ width: 160, height: 40 }} value={customEnd} onChange={(e) => e.target.value && setCustomEnd(e.target.value)} aria-label="Mês final" />
          </div>
        )}
        <span className="row muted" style={{ fontSize: 13, gap: 6 }}><CalendarRange size={15} />{periodLabel}</span>
      </div>

      <div className="row no-print hide-desktop" style={{ marginBottom: 14 }}>
        <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => exportTransactionsCSV(txs, data, `relatorio-${startKey}-a-${endKey}.csv`)} disabled={!txs.length}><Download size={15} /> Exportar CSV</button>
        <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => window.print()}><Printer size={15} /> PDF</button>
      </div>

      <div className="stack">
        <div className="grid grid-4">
          <StatCard label="Receitas" icon={ArrowDownLeft} tone="income" value={<Money value={totals.income} />} foot={`${txs.filter((t) => t.type === 'income').length} lançamentos`} />
          <StatCard label="Despesas" icon={ArrowUpRight} tone="expense" value={<Money value={totals.expense} />} foot={<>Média mensal: <Money value={avgExpense} /></>} />
          <StatCard label="Resultado" icon={Scale} tone={totals.balance >= 0 ? 'income' : 'expense'} value={<Money value={totals.balance} signed className={totals.balance >= 0 ? 'income' : 'expense'} />} foot={`${months.length} ${months.length === 1 ? 'mês' : 'meses'}`} />
          <StatCard label="Taxa de economia" icon={Percent} tone="brand" value={formatPercent(savingsRate, 1)} foot="Resultado ÷ receitas" />
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Receitas x despesas</div>
                <div className="card-subtitle">Comparativo mensal</div>
              </div>
              <SeriesLegend items={[{ label: 'Receitas', color: colors.income }, { label: 'Despesas', color: colors.expense }]} />
            </div>
            <CashflowChart data={series} />
          </div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Evolução do saldo</div>
                <div className="card-subtitle">Saldo total ao fim de cada mês</div>
              </div>
            </div>
            <BalanceChart data={series} />
          </div>
        </div>

        <div className="card">
          <div className="card-header wrap">
            <div>
              <div className="card-title">Análise por categoria</div>
              <div className="card-subtitle">Distribuição de {catType === 'expense' ? 'despesas' : 'receitas'} no período</div>
            </div>
            <Segmented value={catType} options={[{ value: 'expense', label: 'Despesas' }, { value: 'income', label: 'Receitas' }]} onChange={setCatType} />
          </div>
          {cats.length ? (
            <div className="donut-wrap">
              <CategoryDonut data={donut} total={catTotal} label={catType === 'expense' ? 'Despesas' : 'Receitas'} />
              <CategoryBars data={cats.slice(0, 8)} />
            </div>
          ) : (
            <EmptyState title="Sem dados" text="Não há lançamentos deste tipo no período." />
          )}
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header"><div className="card-title">Resumo mensal</div></div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Mês</th><th className="right">Receitas</th><th className="right">Despesas</th><th className="right">Resultado</th></tr>
                </thead>
                <tbody>
                  {series.map((p) => (
                    <tr key={p.key}>
                      <td>{monthLabel(p.key, true)}</td>
                      <td className="right"><Money value={p.income} className="income" /></td>
                      <td className="right"><Money value={p.expense} className="expense" /></td>
                      <td className="right"><Money value={p.result} signed /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="right"><Money value={totals.income} /></td>
                    <td className="right"><Money value={totals.expense} /></td>
                    <td className="right"><Money value={totals.balance} signed /></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">{catType === 'expense' ? 'Despesas' : 'Receitas'} por categoria</div></div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Categoria</th><th className="right">Valor</th><th className="right">%</th><th className="right hide-mobile">Média/mês</th></tr>
                </thead>
                <tbody>
                  {cats.map((c) => (
                    <tr key={c.id}>
                      <td><span className="row" style={{ gap: 8 }}><span className="dot" style={{ background: c.color }} />{c.name}</span></td>
                      <td className="right"><Money value={c.value} /></td>
                      <td className="right num">{formatPercent(c.share, 1)}</td>
                      <td className="right hide-mobile"><Money value={c.value / months.length} /></td>
                    </tr>
                  ))}
                  {!cats.length && <tr><td colSpan={4} className="muted">Sem lançamentos no período.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
