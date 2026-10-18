import { useMemo, useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CreditCard as CardIcon, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { useFinance } from '../store/FinanceContext';
import type { Transaction, TxType } from '../types';
import { formatCurrency, formatDate, monthLabel, parseDate, shiftMonth, toISODate, todayISO, uid } from '../utils/format';
import { invoiceDates, invoiceForDate, isCardPayment } from '../utils/cards';
import { Segmented } from './ui';

type Repeat = 'none' | 'installments' | 'monthly';

const addMonths = (iso: string, n: number) => {
  const d = parseDate(iso);
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return toISODate(target);
};

export default function TransactionForm({ tx, defaultType = 'expense', defaultCardId, onClose }: { tx?: Transaction; defaultType?: TxType; defaultCardId?: string; onClose: () => void }) {
  const { data, save, remove, getCard } = useFinance();
  const editing = !!tx;
  /** Pagamento de fatura: edita-se como transferência da conta para o cartão */
  const payment = tx && isCardPayment(tx) ? tx : undefined;

  const [type, setType] = useState<TxType>(tx?.type ?? defaultType);
  const [cents, setCents] = useState(tx ? Math.round(tx.amount * 100) : 0);
  const [description, setDescription] = useState(tx?.description ?? '');
  const [date, setDate] = useState(tx?.date ?? todayISO());
  const [categoryId, setCategoryId] = useState(tx?.categoryId ?? '');
  const [accountId, setAccountId] = useState(tx?.accountId ?? data.accounts[0]?.id ?? '');
  const [toAccountId, setToAccountId] = useState(tx?.toAccountId ?? data.accounts[1]?.id ?? '');
  const [paid, setPaid] = useState(tx?.paid ?? true);
  const [notes, setNotes] = useState(tx?.notes ?? '');
  const [repeat, setRepeat] = useState<Repeat>('none');
  const [times, setTimes] = useState(2);
  const [error, setError] = useState('');
  const [payWith, setPayWith] = useState<'account' | 'card'>(
    (tx?.type === 'expense' && tx.cardId) || (!tx && defaultCardId && data.cards.some((c) => c.id === defaultCardId)) ? 'card' : 'account',
  );
  const [cardId, setCardId] = useState(tx?.cardId ?? defaultCardId ?? data.cards[0]?.id ?? '');
  /** Fatura escolhida manualmente ('' = automática pela data e dia de fechamento) */
  const [invoice, setInvoice] = useState(tx?.type === 'expense' && tx.cardId ? tx.invoice ?? '' : '');

  const useCard = type === 'expense' && payWith === 'card' && data.cards.length > 0;
  const card = getCard(cardId);
  const autoInvoice = card ? invoiceForDate(card, date) : '';
  const chosenInvoice = invoice || autoInvoice;

  const categories = useMemo(
    () => data.categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense')),
    [data.categories, type],
  );

  const changeType = (t: TxType) => {
    setType(t);
    if (categoryId && !data.categories.some((c) => c.id === categoryId && c.type === t)) setCategoryId('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const amount = cents / 100;
    if (amount <= 0) return setError('Informe um valor maior que zero.');
    if (!description.trim()) return setError('Informe uma descrição.');
    if (useCard && !card) return setError('Selecione o cartão de crédito.');
    if (!useCard && !accountId) return setError('Cadastre uma conta antes de lançar.');
    if (type === 'transfer' && !payment && (!toAccountId || toAccountId === accountId)) return setError('Escolha contas de origem e destino diferentes.');

    const base: Transaction = {
      id: tx?.id ?? uid(),
      type,
      description: description.trim(),
      amount,
      date,
      categoryId: type === 'transfer' ? undefined : categoryId || undefined,
      accountId: useCard ? '' : accountId,
      toAccountId: type === 'transfer' && !payment ? toAccountId : undefined,
      paid: useCard ? true : paid,
      notes: notes.trim() || undefined,
      groupId: tx?.groupId,
      cardId: useCard ? cardId : payment?.cardId,
      invoice: useCard ? chosenInvoice : payment?.invoice,
    };

    if (editing || repeat === 'none') {
      save('transactions', base);
    } else {
      const groupId = uid();
      const n = Math.max(2, Math.min(120, times));
      const each = repeat === 'installments' ? Math.floor((cents / n)) / 100 : amount;
      // A última parcela absorve a diferença de arredondamento
      const remainder = repeat === 'installments' ? Math.round((amount - each * n) * 100) / 100 : 0;
      const items: Transaction[] = Array.from({ length: n }, (_, i) => ({
        ...base,
        id: uid(),
        groupId,
        date: addMonths(date, i),
        amount: i === n - 1 ? Math.round((each + remainder) * 100) / 100 : each,
        // No cartão, cada parcela cai na fatura seguinte
        invoice: useCard ? shiftMonth(chosenInvoice, i) : undefined,
        paid: useCard ? true : i === 0 ? paid : false,
        description: repeat === 'installments' ? `${base.description} (${i + 1}/${n})` : base.description,
      }));
      save('transactions', ...items);
    }
    onClose();
  };

  const del = () => {
    if (!tx) return;
    const siblings = tx.groupId ? data.transactions.filter((t) => t.groupId === tx.groupId && t.date >= tx.date) : [];
    if (siblings.length > 1 && confirm(`Excluir também os ${siblings.length - 1} lançamentos futuros desta série?`)) {
      remove('transactions', ...siblings.map((t) => t.id));
    } else if (confirm('Excluir este lançamento?')) {
      remove('transactions', tx.id);
    } else return;
    onClose();
  };

  const accent = type === 'income' ? 'var(--income)' : type === 'expense' ? 'var(--expense)' : 'var(--transfer)';

  return (
    <Modal
      title={payment ? 'Pagamento de fatura' : editing ? 'Editar lançamento' : 'Novo lançamento'}
      onClose={onClose}
      footer={
        <>
          {editing && (
            <button type="button" className="btn btn-danger left" onClick={del}>
              <Trash2 size={16} /> Excluir
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" form="tx-form" className="btn btn-primary">{editing ? 'Salvar alterações' : 'Adicionar'}</button>
        </>
      }
    >
      <form id="tx-form" onSubmit={submit} className="stack" style={{ gap: 18 }}>
        {!payment && (
        <div className="type-tabs" role="tablist" aria-label="Tipo de lançamento">
          <button type="button" className={`expense ${type === 'expense' ? 'active' : ''}`} onClick={() => changeType('expense')}>
            <ArrowUpRight size={16} /> Despesa
          </button>
          <button type="button" className={`income ${type === 'income' ? 'active' : ''}`} onClick={() => changeType('income')}>
            <ArrowDownLeft size={16} /> Receita
          </button>
          <button type="button" className={`transfer ${type === 'transfer' ? 'active' : ''}`} onClick={() => changeType('transfer')}>
            <ArrowLeftRight size={16} /> Transferência
          </button>
        </div>
        )}

        {type === 'expense' && data.cards.length > 0 && (
          <div className="field">
            <label>Pagar com</label>
            <Segmented
              value={payWith}
              options={[{ value: 'account', label: 'Conta' }, { value: 'card', label: 'Cartão de crédito' }]}
              onChange={setPayWith}
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="tx-amount">Valor</label>
          <input
            id="tx-amount"
            className="input input-amount num"
            inputMode="numeric"
            autoFocus={!editing}
            style={{ color: accent }}
            value={formatCurrency(cents / 100)}
            onChange={(e) => setCents(Math.min(99999999999, Number(e.target.value.replace(/\D/g, '')) || 0))}
          />
        </div>

        <div className="form-grid">
          <div className="field full">
            <label htmlFor="tx-desc">Descrição</label>
            <input id="tx-desc" className="input" placeholder="Ex.: Supermercado, salário, aluguel…" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="tx-date">Data</label>
            <input id="tx-date" type="date" className="input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} required />
          </div>
          {type !== 'transfer' ? (
            <div className="field">
              <label htmlFor="tx-cat">Categoria</label>
              <select id="tx-cat" className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Sem categoria</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ) : <div className="hide-mobile" />}
          {useCard ? (
            <>
              <div className="field">
                <label htmlFor="tx-card">Cartão</label>
                <select id="tx-card" className="select" value={cardId} onChange={(e) => { setCardId(e.target.value); setInvoice(''); }}>
                  {data.cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="tx-invoice">Fatura</label>
                <select id="tx-invoice" className="select" value={chosenInvoice} onChange={(e) => setInvoice(e.target.value === autoInvoice ? '' : e.target.value)}>
                  {[...new Set([...[-1, 0, 1, 2].map((i) => shiftMonth(autoInvoice, i)), chosenInvoice])].sort().map((key) => (
                    <option key={key} value={key}>
                      {monthLabel(key)}{key === autoInvoice ? ' (automática)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {card && (
                <p className="full muted row" style={{ margin: 0, fontSize: 13, gap: 6 }}>
                  <CardIcon size={14} /> Fecha em {formatDate(invoiceDates(card, chosenInvoice).closing)} · vence em {formatDate(invoiceDates(card, chosenInvoice).due)}
                </p>
              )}
            </>
          ) : (
            <div className="field">
              <label htmlFor="tx-acc">{type === 'transfer' ? 'Conta de origem' : 'Conta'}</label>
              <select id="tx-acc" className="select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          {payment && (
            <div className="field">
              <label>Destino</label>
              <div className="input row" style={{ background: 'var(--surface-2)' }}>
                <CardIcon size={16} /> Fatura {getCard(payment.cardId)?.name ?? ''} · {payment.invoice ? monthLabel(payment.invoice) : ''}
              </div>
            </div>
          )}
          {type === 'transfer' && !payment && (
            <div className="field">
              <label htmlFor="tx-to">Conta de destino</label>
              <select id="tx-to" className="select" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
                <option value="">Selecione</option>
                {data.accounts.filter((a) => a.id !== accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          {!useCard && (
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              <label className="switch" style={{ height: 44 }}>
                <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
                {type === 'income' ? 'Recebido' : type === 'expense' ? 'Pago' : 'Efetivada'}
              </label>
            </div>
          )}
        </div>

        {!editing && (
          <div className="form-grid">
            <div className="field">
              <label htmlFor="tx-repeat">Repetir</label>
              <select id="tx-repeat" className="select" value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat)}>
                <option value="none">Não repetir</option>
                <option value="installments">Parcelado</option>
                <option value="monthly">Fixo mensal</option>
              </select>
            </div>
            {repeat !== 'none' && (
              <div className="field">
                <label htmlFor="tx-times">{repeat === 'installments' ? 'Número de parcelas' : 'Quantidade de meses'}</label>
                <input id="tx-times" type="number" min={2} max={120} className="input" value={times} onChange={(e) => setTimes(Number(e.target.value))} />
              </div>
            )}
            {repeat === 'installments' && cents > 0 && times >= 2 && (
              <p className="full muted" style={{ margin: 0, fontSize: 13 }}>
                {times}x de {formatCurrency(Math.floor(cents / times) / 100)} — total de {formatCurrency(cents / 100)}
                {useCard && chosenInvoice && ` · faturas de ${monthLabel(chosenInvoice)} a ${monthLabel(shiftMonth(chosenInvoice, times - 1))}`}
              </p>
            )}
          </div>
        )}

        <div className="field">
          <label htmlFor="tx-notes">Observações</label>
          <textarea id="tx-notes" className="textarea" placeholder="Opcional" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} />
        </div>

        {error && <p role="alert" style={{ margin: 0, color: 'var(--danger)', fontWeight: 600, fontSize: 14 }}>{error}</p>}
      </form>
    </Modal>
  );
}
