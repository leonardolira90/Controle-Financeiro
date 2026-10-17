import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { CategorySlice, MonthPoint } from '../utils/finance';
import { formatAxis, formatCurrency, formatPercent, monthLabel } from '../utils/format';
import { useChartColors, usePrefersReducedMotion } from '../utils/theme';

interface TooltipRow { label: string; value: number; color: string }

function TooltipBox({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="chart-tooltip">
      <div className="tt-title">{title}</div>
      {rows.map((r) => (
        <div className="tt-row" key={r.label}>
          <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: r.color }} />{r.label}</span>
          <b>{formatCurrency(r.value)}</b>
        </div>
      ))}
    </div>
  );
}

const axisProps = (color: string) => ({
  tick: { fill: color, fontSize: 12 },
  tickLine: false,
  axisLine: false,
});

/** Barras agrupadas de receitas x despesas por mês. */
export function CashflowChart({ data, height = 280 }: { data: MonthPoint[]; height?: number }) {
  const c = useChartColors();
  const animate = !usePrefersReducedMotion();
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="key" tickFormatter={(k) => monthLabel(k, true)} {...axisProps(c.axis)} />
          <YAxis tickFormatter={formatAxis} width={52} {...axisProps(c.axis)} />
          <Tooltip
            cursor={{ fill: c.cursor }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TooltipBox
                  title={monthLabel(String(label))}
                  rows={[
                    { label: 'Receitas', value: Number(payload[0]?.payload.income), color: c.income },
                    { label: 'Despesas', value: Number(payload[0]?.payload.expense), color: c.expense },
                    { label: 'Resultado', value: Number(payload[0]?.payload.result), color: 'transparent' },
                  ]}
                />
              ) : null
            }
          />
          <Bar dataKey="income" name="Receitas" fill={c.income} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={animate} />
          <Bar dataKey="expense" name="Despesas" fill={c.expense} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={animate} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Evolução do saldo total ao fim de cada mês. */
export function BalanceChart({ data, height = 280 }: { data: MonthPoint[]; height?: number }) {
  const c = useChartColors();
  const animate = !usePrefersReducedMotion();
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.balance} stopOpacity={0.22} />
              <stop offset="100%" stopColor={c.balance} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="key" tickFormatter={(k) => monthLabel(k, true)} {...axisProps(c.axis)} />
          <YAxis tickFormatter={formatAxis} width={52} domain={['auto', 'auto']} {...axisProps(c.axis)} />
          <Tooltip
            cursor={{ stroke: c.axis, strokeDasharray: '3 3' }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TooltipBox title={monthLabel(String(label))} rows={[{ label: 'Saldo', value: Number(payload[0].value), color: c.balance }]} />
              ) : null
            }
          />
          <Area
            type="monotone" dataKey="balance" name="Saldo" stroke={c.balance} strokeWidth={2} fill="url(#balanceFill)" isAnimationActive={animate}
            dot={{ r: 4, fill: c.balance, stroke: c.surface, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: c.balance, stroke: c.surface, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Rosca de participação por categoria. */
export function CategoryDonut({ data, total, label = 'Total' }: { data: CategorySlice[]; total: number; label?: string }) {
  const c = useChartColors();
  const animate = !usePrefersReducedMotion();
  return (
    <div className="donut-center">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data as unknown as Record<string, unknown>[]} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%"
            paddingAngle={data.length > 1 ? 1.5 : 0} stroke={c.surface} strokeWidth={2} isAnimationActive={animate}
          >
            {data.map((s) => <Cell key={s.id} fill={s.color} />)}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const s = payload[0].payload as CategorySlice;
              return (
                <div className="chart-tooltip">
                  <div className="tt-title row" style={{ gap: 6 }}><span className="dot" style={{ background: s.color }} />{s.name}</div>
                  <div className="tt-row"><span>Valor</span><b>{formatCurrency(s.value)}</b></div>
                  <div className="tt-row"><span>Participação</span><b>{formatPercent(s.share, 1)}</b></div>
                  <div className="tt-row"><span>Lançamentos</span><b>{s.count}</b></div>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="label">
        <span className="muted" style={{ fontSize: 12 }}>{label}</span>
        <strong className="money num" style={{ fontSize: 17 }}>{formatCurrency(total)}</strong>
      </div>
    </div>
  );
}

/** Barras horizontais por categoria (ranking). */
export function CategoryBars({ data, height }: { data: CategorySlice[]; height?: number }) {
  const c = useChartColors();
  const animate = !usePrefersReducedMotion();
  return (
    <div style={{ width: '100%', height: height ?? Math.max(160, data.length * 40) }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke={c.grid} />
          <XAxis type="number" tickFormatter={formatAxis} {...axisProps(c.axis)} />
          <YAxis type="category" dataKey="name" width={130} {...axisProps(c.axis)} />
          <Tooltip
            cursor={{ fill: c.cursor }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const s = payload[0].payload as CategorySlice;
              return <TooltipBox title={s.name} rows={[{ label: formatPercent(s.share, 1), value: s.value, color: s.color }]} />;
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={animate}>
            {data.map((s) => <Cell key={s.id} fill={s.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SeriesLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.label}><span className="dot" style={{ background: i.color }} />{i.label}</span>
      ))}
    </div>
  );
}
