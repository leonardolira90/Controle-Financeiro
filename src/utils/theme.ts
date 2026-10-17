import { useEffect, useState } from 'react';
import { useFinance } from '../store/FinanceContext';

const media = () => window.matchMedia('(prefers-color-scheme: dark)');

/** Assina mudanças de media query (com fallback para navegadores antigos sem addEventListener). */
const subscribe = (mq: MediaQueryList, onChange: () => void) => {
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }
  mq.addListener(onChange);
  return () => mq.removeListener(onChange);
};

/** Resolve o tema efetivo (configuração do usuário ou do sistema). */
export function useResolvedTheme(): 'light' | 'dark' {
  const { data } = useFinance();
  const [systemDark, setSystemDark] = useState(() => media().matches);

  useEffect(() => {
    const mq = media();
    return subscribe(mq, () => setSystemDark(mq.matches));
  }, []);

  const pref = data.settings.theme;
  return pref === 'system' ? (systemDark ? 'dark' : 'light') : pref;
}

/** Cores de gráfico por tema (os atributos SVG não resolvem variáveis CSS). */
export function useChartColors() {
  const dark = useResolvedTheme() === 'dark';
  return dark
    ? { income: '#199e70', expense: '#d95926', balance: '#3987e5', grid: '#23272e', axis: '#898781', surface: '#16181d', cursor: 'rgba(255,255,255,0.05)' }
    : { income: '#1baf7a', expense: '#eb6834', balance: '#2a78d6', grid: '#e9ebef', axis: '#898781', surface: '#ffffff', cursor: 'rgba(15,20,25,0.04)' };
}

/** Respeita a preferência do sistema por menos animação. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    return subscribe(mq, () => setReduced(mq.matches));
  }, []);
  return reduced;
}
