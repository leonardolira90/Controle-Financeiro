import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Transaction, TxType } from '../types';
import { currentMonthKey } from '../utils/format';

interface TxEditorState {
  tx?: Transaction;
  defaultType?: TxType;
  defaultCardId?: string;
}

interface UIApi {
  month: string;
  setMonth: (key: string) => void;
  editor: TxEditorState | null;
  openTransaction: (tx?: Transaction, defaultType?: TxType, defaultCardId?: string) => void;
  closeTransaction: () => void;
}

const UIContext = createContext<UIApi | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(currentMonthKey);
  const [editor, setEditor] = useState<TxEditorState | null>(null);

  const openTransaction = useCallback(
    (tx?: Transaction, defaultType?: TxType, defaultCardId?: string) => setEditor({ tx, defaultType, defaultCardId }),
    [],
  );
  const closeTransaction = useCallback(() => setEditor(null), []);

  const api = useMemo(
    () => ({ month, setMonth, editor, openTransaction, closeTransaction }),
    [month, editor, openTransaction, closeTransaction],
  );
  return <UIContext.Provider value={api}>{children}</UIContext.Provider>;
}

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI deve ser usado dentro de UIProvider');
  return ctx;
};
