import { formatCurrency } from '../utils/format';

/** Campo de valor com máscara de moeda (digitação da direita para a esquerda, em centavos). */
export default function MoneyInput({ id, value, onChange, allowNegative }: { id?: string; value: number; onChange: (v: number) => void; allowNegative?: boolean }) {
  const negative = value < 0;
  return (
    <input
      id={id}
      className="input num"
      inputMode="numeric"
      value={`${negative ? '−' : ''}${formatCurrency(Math.abs(value))}`}
      onChange={(e) => {
        const raw = e.target.value;
        const cents = Number(raw.replace(/\D/g, '')) || 0;
        const neg = allowNegative && /[-−]/.test(raw);
        onChange(Math.min(cents, 99999999999) / 100 * (neg ? -1 : 1));
      }}
    />
  );
}
