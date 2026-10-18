import { useMemo, useState } from 'react';
import { CalendarCheck, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, CreditCard, Pencil, Plus, Receipt, Wallet } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import MoneyInput from '../components/MoneyInput';
import { CategoryDonut } from '../components/Charts';
import TransactionList from '../components/TransactionList';
import { ColorPicker, EmptyState, Money, Progress } from '../components/ui';
import { useFinance } from '../store/FinanceContext';
import { useUI } from '../store/UIContext';
import type { CreditCard as Card } from '../types';
import { byCategory } from '../utils/finance';
import { cardUsage, currentInvoice, INVOICE_STATUS_LABEL, invoiceSummary, type InvoiceStatus } from '../utils/cards';
import { formatDate, formatPercent, monthLabel, shiftMonth, todayISO, uid } from '../utils/format';

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  futura: 'badge-neutral',
  aberta: 'badge-neutral',
  fechada: 'badge-pending',
  vencida: 'badge-danger',
  paga: 'badge-ok',
};

const clampDay = (v: number) => Math.min(31, Math.max(1, Math.round(v) || 1));

function CardForm({ card, onClose, onSaved }: { card?: Card; onClose: () => void; onSaved: (id: string) => void }) {
  const { data, save, remove } = useFinance();
  const [name, setName] = useState(card?.name ?? '');
  const [limit, setLimit] = useState(card?.limit ?? 0);
  const [closingDay, setClosingDay] = useState(card?.closingDay ?? 25);
  const [dueDay, setDueDay] = useState(card?.dueDay ?? 5);
  const [paymentAccountId, setPaymentAccountId] = useState(card?.paymentAccountId ?? data.accounts[0]?.id ?? '');
  const [color, setColor] = useState(card?.color ?? '#6250d6');
  const valid = name.trim() && limit > 0;

  const submit = () => {
    if (!valid) return;
    const id = card?.id ?? uid();
    save('cards', { id, name: name.trim(), limit, closingDay: clampDay(closingDay), dueDay: clampDay(dueDay), paymentAccountId: paymentAccountId || undefined, color });
    onSaved(id);
    onClose();
  };

  const del = () => {
    if (!card) return;
    const count = data.transactions.filter((t) => t.cardId === card.id).length;
    if (confirm(`Excluir o cartão "${card.name}"${count ? ` e seus ${count} lançamentos (compras e pagamentos de fatura)` : ''}? Esta ação não pode ser desfeita.`)) {
      remove('cards', card.id);
      onClose();
    }
  };

  return (
    <Modal
      title={card ? 'Editar cartão' : 'Novo cartão de crédito'}
      onClose={onClose}
      footer={
        <>
          {card && <button className="btn btn-danger left" onClick={del}>Excluir</button>}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={!valid}>Salvar</button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="cc-name">Nome do cartão</label>
        <input id="cc-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Nubank, Itaú Visa, Inter" autoFocus />
      </div>
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="cc-limit">Limite total</label>
          <MoneyInput id="cc-limit" value={limit} onChange={setLimit} />
        </div>
        <div className="field">
          <label htmlFor="cc-closing">Dia de fechamento</label>
          <input id="cc-closing" type="number" min={1} max={31} className="input" value={closingDay} onChange={(e) => setClosingDay(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="cc-due">Dia de vencimento</label>
          <input id="cc-due" type="number" min={1} max={31} className="input" value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))} />
        </div>
        <div className="field full">
          <label htmlFor="cc-account">Conta para pagamento da fatura</label>
          <select id="cc-account" className="select" value={paymentAccountId} onChange={(e) => setPaymentAccountId(e.target.value)}>
            {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        Compras feitas a partir do dia de fechamento entram na fatura do mês seguinte.
      </p>
      <div className="field"><label>Cor</label><ColorPicker value={color} onChange={setColor} /></div>
    </Modal>
  );
}

function PayInvoiceForm({ card, invoice, remaining, onClose }: { card: Card; invoice: string; remaining: number; onClose: () => void }) {
  const { data, save } = useFinance();
  const [amount, setAmount] = useState(remaining);
  const [accountId, setAccountId] = useState(card.paymentAccountId ?? data.accounts[0]?.id ?? '');
  const [date, setDate] = useState(todayISO());

  const submit = () => {
    if (amount <= 0 || !accountId) return;
    save('transactions', {
      id: uid(),
      type: 'transfer',
      description: `Pagamento fatura ${card.name} · ${monthLabel(invoice)}`,
      amount,
      date,
      accountId,
      cardId: card.id,
      invoice,
      paid: true,
    });
    onClose();
  };

  return (
    <Modal
      title={`Pagar fatura de ${monthLabel(invoice).toLowerCase()}`}
      onClose={onClose}
      width={460}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={submit} disabled={amount <= 0 || !accountId}>Confirmar pagamento</button></>}
    >
      <div className="field"><label htmlFor="pay-amount">Valor</label><MoneyInput id="pay-amount" value={amount} onChange={setAmount} /></div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="pay-acc">Pagar com a conta</label>
          <select id="pay-acc" className="select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pay-date">Data do pagamento</label>
          <input id="pay-date" type="date" className="input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
      </div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        O valor sai da conta escolhida e libera o limite do cartão. As compras já foram contadas como despesas nas suas categorias.
      </p>
    </Modal>
  );
}

function CardTile({ card, selected, onSelect }: { card: Card; selected: boolean; onSelect: () => void }) {
  const { data } = useFinance();
  const { used, available } = cardUsage(card, data.transactions);
  return (
    <button
      className="card"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        textAlign: 'left', minWidth: 250, flex: '1 1 250px', cursor: 'pointer', color: '#fff', border: 'none',
        background: `linear-gradient(135deg, ${card.color}, color-mix(in srgb, ${card.color} 55%, #000))`,
        boxShadow: selected ? `0 0 0 3px var(--bg), 0 0 0 5px ${card.color}` : 'var(--shadow-sm)',
      }}
    >
      <div className="row-between" style={{ marginBottom: 22 }}>
        <strong style={{ fontSize: 16 }}>{card.name}</strong>
        <CreditCard size={22} />
      </div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>Limite disponível</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}><Money value={available} /></div>
      <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, (used / card.limit) * 100)}%`, background: '#fff' }} />
      </div>
      <div className="row-between" style={{ fontSize: 12, opacity: 0.85, marginTop: 8 }}>
        <span>Fecha dia {card.closingDay}</span>
        <span>Vence dia {card.dueDay}</span>
      </div>
    </button>
  );
}

export default function Cards() {
  const { data } = useFinance();
  const { openTransaction } = useUI();
  const [selectedId, setSelectedId] = useState(data.cards[0]?.id ?? '');
  const [editing, setEditing] = useState<Card | 'new' | null>(null);
  const [paying, setPaying] = useState(false);
  const card = data.cards.find((c) => c.id === selectedId) ?? data.cards[0];
  /** Fatura escolhida ('' = fatura atual do cartão selecionado) */
  const [chosenInvoice, setInvoice] = useState('');
  const invoice = chosenInvoice || (card ? currentInvoice(card) : '');

  const select = (c: Card) => {
    setSelectedId(c.id);
    setInvoice('');
  };

  const summary = useMemo(() => (card && invoice ? invoiceSummary(card, data.transactions, invoice) : null), [card, invoice, data.transactions]);
  const usage = card ? cardUsage(card, data.transactions) : null;
  const cats = useMemo(() => (summary ? byCategory(summary.purchases, data.categories, 'expense') : []), [summary, data.categories]);
  const donut = useMemo(() => (summary ? byCategory(summary.purchases, data.categories, 'expense', 6) : []), [summary, data.categories]);

  return (
    <Layout title="Cartões de crédito" actions={<button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={17} /> <span className="hide-mobile">Novo cartão</span></button>}>
      {!card || !summary || !usage ? (
        <div className="card">
          <EmptyState
            icon={CreditCard}
            title="Nenhum cartão cadastrado"
            text="Cadastre seus cartões com limite, dia de fechamento e vencimento para acompanhar as faturas e lançar cada compra com sua categoria."
            action={<button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={16} /> Cadastrar cartão</button>}
          />
        </div>
      ) : (
        <div className="stack">
          <div className="row wrap" style={{ gap: 16 }}>
            {data.cards.map((c) => <CardTile key={c.id} card={c} selected={c.id === card.id} onSelect={() => select(c)} />)}
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{card.name}</div>
                <div className="card-subtitle">Fechamento todo dia {card.closingDay} · vencimento todo dia {card.dueDay}</div>
              </div>
              <button className="btn btn-sm" onClick={() => setEditing(card)}><Pencil size={14} /> Editar cartão</button>
            </div>
            <div className="grid grid-3" style={{ marginBottom: 14 }}>
              <div><div className="muted" style={{ fontSize: 13 }}>Limite total</div><div className="stat-value" style={{ fontSize: 22 }}><Money value={card.limit} /></div></div>
              <div><div className="muted" style={{ fontSize: 13 }}>Limite utilizado</div><div className="stat-value expense" style={{ fontSize: 22 }}><Money value={usage.used} /></div></div>
              <div><div className="muted" style={{ fontSize: 13 }}>Limite disponível</div><div className={`stat-value ${usage.available < 0 ? 'expense' : 'income'}`} style={{ fontSize: 22 }}><Money value={usage.available} /></div></div>
            </div>
            <Progress value={usage.used / card.limit} color={usage.used > card.limit ? 'var(--danger)' : usage.used / card.limit > 0.8 ? 'var(--warning)' : card.color} />
            <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
              {formatPercent(Math.min(usage.used / card.limit, 9.99))} do limite comprometido, incluindo parcelas futuras
            </div>
          </div>

          <div className="card">
            <div className="row-between wrap" style={{ marginBottom: 16 }}>
              <div className="month-picker" role="group" aria-label="Selecionar fatura">
                <button onClick={() => setInvoice(shiftMonth(invoice, -1))} aria-label="Fatura anterior"><ChevronLeft size={18} /></button>
                <span>Fatura de {monthLabel(invoice).split(' ')[0].toLowerCase()}{invoice.slice(0, 4) !== todayISO().slice(0, 4) ? ` ${invoice.slice(0, 4)}` : ''}</span>
                <button onClick={() => setInvoice(shiftMonth(invoice, 1))} aria-label="Próxima fatura"><ChevronRight size={18} /></button>
              </div>
              <div className="row wrap">
                <button className="btn btn-sm" onClick={() => openTransaction(undefined, 'expense', card.id)}><Plus size={15} /> Nova compra</button>
                <button className="btn btn-sm btn-primary" onClick={() => setPaying(true)} disabled={summary.remaining <= 0}><Wallet size={15} /> Pagar fatura</button>
              </div>
            </div>

            <div className="grid grid-4" style={{ gap: 14 }}>
              <div className="stack" style={{ gap: 4 }}>
                <span className="muted" style={{ fontSize: 13 }}>Total da fatura</span>
                <strong style={{ fontSize: 24 }}><Money value={summary.total} /></strong>
                <span className={`badge ${STATUS_BADGE[summary.status]}`} style={{ alignSelf: 'flex-start' }}>
                  {summary.status === 'paga' && <CheckCircle2 size={12} />}{INVOICE_STATUS_LABEL[summary.status]}
                </span>
              </div>
              <div className="stack" style={{ gap: 4 }}>
                <span className="muted row" style={{ fontSize: 13, gap: 6 }}><CalendarCheck size={14} /> Fechamento</span>
                <strong>{formatDate(summary.closing)}</strong>
              </div>
              <div className="stack" style={{ gap: 4 }}>
                <span className="muted row" style={{ fontSize: 13, gap: 6 }}><CalendarClock size={14} /> Vencimento</span>
                <strong>{formatDate(summary.due)}</strong>
              </div>
              <div className="stack" style={{ gap: 4 }}>
                <span className="muted" style={{ fontSize: 13 }}>Pago / a pagar</span>
                <strong><Money value={summary.paid} className="income" /> / <Money value={summary.remaining} className={summary.remaining > 0 ? 'expense' : ''} /></strong>
              </div>
            </div>
          </div>

          <div className="grid grid-main">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Compras da fatura</div>
                  <div className="card-subtitle">{summary.purchases.length} {summary.purchases.length === 1 ? 'compra' : 'compras'}</div>
                </div>
              </div>
              {summary.purchases.length ? (
                <TransactionList items={summary.purchases} />
              ) : (
                <EmptyState icon={Receipt} title="Nenhuma compra nesta fatura" action={<button className="btn btn-primary" onClick={() => openTransaction(undefined, 'expense', card.id)}><Plus size={16} /> Lançar compra</button>} />
              )}
              {summary.payments.length > 0 && (
                <>
                  <div className="card-title" style={{ margin: '20px 0 8px' }}>Pagamentos</div>
                  <TransactionList items={summary.payments} />
                </>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Categorias da fatura</div>
                  <div className="card-subtitle">Onde você gastou no cartão</div>
                </div>
              </div>
              {cats.length ? (
                <div className="stack" style={{ gap: 18 }}>
                  <CategoryDonut data={donut} total={summary.total} label="Fatura" />
                  <div className="cat-rows">
                    {cats.map((s) => (
                      <div className="cat-row" key={s.id}>
                        <span className="row" style={{ gap: 8 }}><span className="dot" style={{ background: s.color }} />{s.name}</span>
                        <span className="num text-2">{formatPercent(s.share)} · <Money value={s.value} /></span>
                        <Progress value={s.share} color={s.color} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState title="Sem dados" text="As categorias aparecem quando houver compras na fatura." />
              )}
            </div>
          </div>
        </div>
      )}

      {editing && <CardForm card={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={(id) => { if (editing === 'new') { setSelectedId(id); setInvoice(''); } }} />}
      {paying && card && summary && <PayInvoiceForm card={card} invoice={invoice} remaining={summary.remaining} onClose={() => setPaying(false)} />}
    </Layout>
  );
}
