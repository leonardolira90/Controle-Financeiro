import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Clock, CreditCard, Landmark, Scale } from 'lucide-react';
import Layout from '../components/Layout';
import { BalanceChart, CashflowChart, CategoryDonut, SeriesLegend } from '../components/Charts';
import { ACCOUNT_ICONS, IconBadge } from '../components/Icons';
import TransactionList from '../components/TransactionList';
import { EmptyState, Money, MonthPicker, Progress, StatCard } from '../components/ui';
import { useFinance } from '../store/FinanceContext';
import { useUI } from '../store/UIContext';
import { accountBalance, byCategory, inMonth, monthlySeries, sumTotals, totalBalance } from '../utils/finance';
import { formatDate, formatPercent, monthLabel, shiftMonth, todayISO } from '../utils/format';
import { cardUsage, currentInvoice, INVOICE_STATUS_LABEL, invoiceSummary } from '../utils/cards';
import { useChartColors } from '../utils/theme';

export default function Dashboard() {
  const { data, getCategory } = useFinance();
  const { month, setMonth, openTransaction } = useUI();
  const colors = useChartColors();

  const monthTxs = useMemo(() => data.transactions.filter((t) => inMonth(t, month)), [data.transactions, month]);
  const totals = useMemo(() => sumTotals(monthTxs), [monthTxs]);
  const prevTotals = useMemo(
    () => sumTotals(data.transactions.filter((t) => inMonth(t, shiftMonth(month, -1)))),
    [data.transactions, month],
  );
  const balance = useMemo(() => totalBalance(data.accounts, data.transactions, todayISO()), [data]);
  const series = useMemo(() => monthlySeries(data.transactions, data.accounts, month, 6), [data, month]);
  const expenseCats = useMemo(() => byCategory(monthTxs, data.categories, 'expense', 6), [monthTxs, data.categories]);

  const budgets = data.budgets
    .map((b) => {
      const spent = monthTxs.filter((t) => t.type === 'expense' && t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
      return { ...b, spent, cat: getCategory(b.categoryId) };
    })
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit)
    .slice(0, 4);

  const delta = (cur: number, prev: number) => (prev ? (cur - prev) / prev : 0);
  const expDelta = delta(totals.expense, prevTotals.expense);
  const incDelta = delta(totals.income, prevTotals.income);
  const savingsRate = totals.income ? totals.balance / totals.income : 0;

  const upcoming = data.transactions
    .filter((t) => !t.paid && t.type !== 'transfer')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  return (
    <Layout title="Visão geral" actions={<span className="hide-mobile"><MonthPicker value={month} onChange={setMonth} /></span>}>
      <div className="hide-desktop" style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <div className="stack">
        <div className="grid grid-4">
          <StatCard
            hero
            label="Saldo atual"
            icon={Landmark}
            tone="brand"
            value={<Money value={balance} />}
            foot={`${data.accounts.length} ${data.accounts.length === 1 ? 'conta' : 'contas'}`}
          />
          <StatCard
            label="Receitas do mês"
            icon={ArrowDownLeft}
            tone="income"
            value={<Money value={totals.income} />}
            foot={prevTotals.income ? `${incDelta >= 0 ? '▲' : '▼'} ${formatPercent(Math.abs(incDelta))} vs. mês anterior` : 'Sem dados no mês anterior'}
          />
          <StatCard
            label="Despesas do mês"
            icon={ArrowUpRight}
            tone="expense"
            value={<Money value={totals.expense} />}
            foot={prevTotals.expense ? `${expDelta >= 0 ? '▲' : '▼'} ${formatPercent(Math.abs(expDelta))} vs. mês anterior` : 'Sem dados no mês anterior'}
          />
          <StatCard
            label="Resultado do mês"
            icon={Scale}
            tone={totals.balance >= 0 ? 'income' : 'expense'}
            value={<Money value={totals.balance} signed className={totals.balance >= 0 ? 'income' : 'expense'} />}
            foot={totals.income ? `Taxa de economia: ${formatPercent(savingsRate)}` : '—'}
          />
        </div>

        <div className="grid grid-main">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Fluxo de caixa</div>
                <div className="card-subtitle">Receitas e despesas dos últimos 6 meses</div>
              </div>
              <SeriesLegend items={[{ label: 'Receitas', color: colors.income }, { label: 'Despesas', color: colors.expense }]} />
            </div>
            <CashflowChart data={series} />
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Despesas por categoria</div>
                <div className="card-subtitle">{monthLabel(month)}</div>
              </div>
            </div>
            {expenseCats.length ? (
              <div className="stack" style={{ gap: 18 }}>
                <CategoryDonut data={expenseCats} total={totals.expense} label="Despesas" />
                <div className="cat-rows">
                  {expenseCats.map((s) => (
                    <div className="cat-row" key={s.id}>
                      <span className="row" style={{ gap: 8 }}><span className="dot" style={{ background: s.color }} />{s.name}</span>
                      <span className="num text-2">{formatPercent(s.share)} · <Money value={s.value} /></span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Sem despesas" text="Nenhuma despesa registrada neste mês." />
            )}
          </div>
        </div>

        <div className="grid grid-main">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Últimos lançamentos</div>
                <div className="card-subtitle">{monthTxs.length} lançamentos em {monthLabel(month).toLowerCase()}</div>
              </div>
              <Link to="/lancamentos" className="btn btn-sm">Ver todos <ChevronRight size={15} /></Link>
            </div>
            {monthTxs.length ? (
              <TransactionList items={monthTxs} limit={7} />
            ) : (
              <EmptyState
                title="Nenhum lançamento"
                text="Comece cadastrando suas receitas e despesas."
                action={<button className="btn btn-primary" onClick={() => openTransaction()}>Novo lançamento</button>}
              />
            )}
          </div>

          <div className="stack">
            <div className="card">
              <div className="card-header">
                <div className="card-title">Contas</div>
                <Link to="/contas" className="btn btn-sm btn-ghost">Gerenciar</Link>
              </div>
              <div className="stack" style={{ gap: 12 }}>
                {data.accounts.map((a) => (
                  <div key={a.id} className="row">
                    <IconBadge icon={ACCOUNT_ICONS[a.type]} color={a.color} size={36} />
                    <span style={{ flex: 1, fontWeight: 600 }}>{a.name}</span>
                    <Money value={accountBalance(a, data.transactions, todayISO())} className="text-2" />
                  </div>
                ))}
              </div>
            </div>

            {data.cards.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Cartões de crédito</div>
                  <Link to="/cartoes" className="btn btn-sm btn-ghost">Ver faturas</Link>
                </div>
                <div className="stack" style={{ gap: 14 }}>
                  {data.cards.map((c) => {
                    const inv = invoiceSummary(c, data.transactions, currentInvoice(c));
                    const { available } = cardUsage(c, data.transactions);
                    return (
                      <div key={c.id} className="row">
                        <IconBadge icon={CreditCard} color={c.color} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div className="muted" style={{ fontSize: 12.5 }}>
                            Fatura {INVOICE_STATUS_LABEL[inv.status].toLowerCase()} · vence {formatDate(inv.due)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Money value={inv.total} className="expense" />
                          <div className="muted" style={{ fontSize: 12 }}>Disp. <Money value={available} /></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <div className="card-title">Orçamentos do mês</div>
                <Link to="/orcamentos" className="btn btn-sm btn-ghost">Ver todos</Link>
              </div>
              {budgets.length ? (
                <div className="stack" style={{ gap: 14 }}>
                  {budgets.map((b) => {
                    const pct = b.spent / b.limit;
                    return (
                      <div key={b.id} className="stack" style={{ gap: 6 }}>
                        <div className="row-between" style={{ fontSize: 14 }}>
                          <span style={{ fontWeight: 600 }}>{b.cat?.name ?? '—'}</span>
                          <span className={`num ${pct > 1 ? 'expense' : 'text-2'}`}>{formatPercent(pct)}</span>
                        </div>
                        <Progress value={pct} color={pct > 1 ? 'var(--danger)' : pct > 0.8 ? 'var(--warning)' : 'var(--brand)'} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="Sem orçamentos" text="Defina limites mensais por categoria." />
              )}
            </div>

            {upcoming.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Próximos vencimentos</div>
                  <span className="badge badge-pending"><Clock size={11} />{upcoming.length}</span>
                </div>
                <TransactionList items={upcoming} ascending />
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Evolução do patrimônio</div>
              <div className="card-subtitle">Saldo total ao fim de cada mês</div>
            </div>
          </div>
          <BalanceChart data={series} height={240} />
        </div>
      </div>
    </Layout>
  );
}
