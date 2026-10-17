import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Inbox, type LucideIcon } from 'lucide-react';
import { formatCurrency, monthLabel, shiftMonth } from '../utils/format';

/** Valor monetário que respeita a opção "ocultar valores". */
export function Money({ value, signed, className = '' }: { value: number; signed?: boolean; className?: string }) {
  const text = formatCurrency(Math.abs(value));
  const sign = signed ? (value < 0 ? '− ' : '+ ') : value < 0 ? '− ' : '';
  return <span className={`money num ${className}`}>{sign}{text}</span>;
}

export function MonthPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  return (
    <div className="month-picker" role="group" aria-label="Selecionar mês">
      <button onClick={() => onChange(shiftMonth(value, -1))} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
      <span>{monthLabel(value)}</span>
      <button onClick={() => onChange(shiftMonth(value, 1))} aria-label="Próximo mês"><ChevronRight size={18} /></button>
    </div>
  );
}

export function StatCard({
  label, value, icon: Icon, tone, foot, hero,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone: 'income' | 'expense' | 'transfer' | 'brand' | 'warning';
  foot?: ReactNode;
  hero?: boolean;
}) {
  const bg = tone === 'brand' ? 'var(--brand-soft)' : `var(--${tone}-soft)`;
  const fg = tone === 'brand' ? 'var(--brand)' : `var(--${tone})`;
  return (
    <div className={`card stat ${hero ? 'stat-hero' : ''}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon" style={hero ? undefined : { background: bg, color: fg }}><Icon size={19} /></span>
      </div>
      <div className="stat-value">{value}</div>
      {foot && <div className="stat-foot">{foot}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon size={26} /></div>
      <h3>{title}</h3>
      {text && <p style={{ margin: 0, maxWidth: 360 }}>{text}</p>}
      {action}
    </div>
  );
}

export function Progress({ value, color }: { value: number; color: string }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color }} />
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value} className={o.value === value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const COLOR_CHOICES = [
  '#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948', '#0e7490', '#a16207', '#7c3aed', '#64748b',
];

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="row wrap" role="radiogroup" aria-label="Cor">
      {COLOR_CHOICES.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={c === value}
          aria-label={c}
          onClick={() => onChange(c)}
          style={{
            width: 30, height: 30, borderRadius: 9, background: c, border: 'none',
            boxShadow: c === value ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}` : 'none',
          }}
        />
      ))}
    </div>
  );
}
