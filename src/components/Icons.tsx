import {
  BookOpen, Briefcase, Car, Gift, HeartPulse, Home, Laptop, MoreHorizontal, PartyPopper, Plane,
  PawPrint, ShoppingBag, ShoppingCart, Tag, TrendingUp, Tv, Utensils, Zap, Shirt, Baby, Dumbbell,
  Coffee, Smartphone, PiggyBank, Landmark, Wallet, CreditCard, Banknote, type LucideIcon,
} from 'lucide-react';
import type { AccountType } from '../types';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  home: Home,
  utensils: Utensils,
  car: Car,
  cart: ShoppingCart,
  party: PartyPopper,
  heart: HeartPulse,
  book: BookOpen,
  bag: ShoppingBag,
  tv: Tv,
  bolt: Zap,
  tag: Tag,
  briefcase: Briefcase,
  laptop: Laptop,
  trending: TrendingUp,
  gift: Gift,
  plane: Plane,
  pet: PawPrint,
  shirt: Shirt,
  baby: Baby,
  gym: Dumbbell,
  coffee: Coffee,
  phone: Smartphone,
  piggy: PiggyBank,
  more: MoreHorizontal,
};

export const ACCOUNT_ICONS: Record<AccountType, LucideIcon> = {
  corrente: Landmark,
  poupanca: PiggyBank,
  carteira: Wallet,
  investimento: TrendingUp,
  credito: CreditCard,
};

export const ACCOUNT_LABELS: Record<AccountType, string> = {
  corrente: 'Conta corrente',
  poupanca: 'Poupança',
  carteira: 'Carteira',
  investimento: 'Investimentos',
  credito: 'Cartão de crédito',
};

/** Ícone sobre fundo suave na cor da categoria/conta. */
export function IconBadge({ icon: Icon = Banknote, color, size = 40 }: { icon?: LucideIcon; color: string; size?: number }) {
  return (
    <span
      className="cat-icon"
      style={{ width: size, height: size, background: `${color}1f`, color }}
      aria-hidden="true"
    >
      <Icon size={Math.round(size * 0.48)} strokeWidth={2} />
    </span>
  );
}

export function CategoryIcon({ icon, color, size }: { icon?: string; color: string; size?: number }) {
  return <IconBadge icon={CATEGORY_ICONS[icon ?? 'tag'] ?? Tag} color={color} size={size} />;
}
