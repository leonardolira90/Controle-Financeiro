import { useMemo, useState } from 'react';
import { Pencil, Plus, Wallet } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import MoneyInput from '../components/MoneyInput';
import { ACCOUNT_ICONS, ACCOUNT_LABELS, IconBadge } from '../components/Icons';
import { ColorPicker, EmptyState, Money } from '../components/ui';
import { useFinance } from '../store/FinanceContext';
import type { Account, AccountType } from '../types';
import { accountBalance, inMonth, txDelta } from '../utils/finance';
import { currentMonthKey, todayISO, uid } from '../utils/format';

function AccountForm({ account, onClose }: { account?: Account; onClose: () => void }) {
  const { data, save, remove } = useFinance();
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<AccountType>(account?.type ?? 'corrente');
  const [initialBalance, setInitialBalance] = useState(account?.initialBalance ?? 0);
  const [color, setColor] = useState(account?.color ?? '#2a78d6');

  const submit = () => {
    if (!name.trim()) return;
    save('accounts', { id: account?.id ?? uid(), name: name.trim(), type, initialBalance, color });
    onClose();
  };

  const del = () => {
    if (!account) return;
    if (data.accounts.length === 1) return alert('Mantenha ao menos uma conta cadastrada.');
    const count = data.transactions.filter((t) => t.accountId === account.id || t.toAccountId === account.id).length;
    if (confirm(`Excluir "${account.name}"${count ? ` e seus ${count} lançamentos` : ''}? Esta ação não pode ser desfeita.`)) {
      remove('accounts', account.id);
      onClose();
    }
  };

  return (
    <Modal
      title={account ? 'Editar conta' : 'Nova conta'}
      onClose={onClose}
      footer={
        <>
          {account && <button className="btn btn-danger left" onClick={del}>Excluir</button>}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={!name.trim()}>Salvar</button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="acc-name">Nome</label>
        <input id="acc-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Banco, Carteira, Investimentos" autoFocus />
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="acc-type">Tipo</label>
          <select id="acc-type" className="select" value={type} onChange={(e) => setType(e.target.value as AccountType)}>
            {Object.entries(ACCOUNT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="acc-initial">Saldo inicial</label>
          <MoneyInput id="acc-initial" value={initialBalance} onChange={setInitialBalance} allowNegative />
        </div>
      </div>
      <div className="field">
        <label>Cor</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
    </Modal>
  );
}

export default function Accounts() {
  const { data } = useFinance();
  const [editing, setEditing] = useState<Account | 'new' | null>(null);
  const today = todayISO();
  const month = currentMonthKey();

  const rows = useMemo(
    () =>
      data.accounts.map((a) => {
        const monthTx = data.transactions.filter((t) => inMonth(t, month));
        const flow = monthTx.reduce((s, t) => s + txDelta(t, a.id), 0);
        return { account: a, balance: accountBalance(a, data.transactions, today), projected: accountBalance(a, data.transactions.map((t) => ({ ...t, paid: true }))), flow };
      }),
    [data, today, month],
  );

  const total = rows.reduce((s, r) => s + r.balance, 0);
  const projected = rows.reduce((s, r) => s + r.projected, 0);

  return (
    <Layout title="Contas" actions={<button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={17} /> <span className="hide-mobile">Nova conta</span></button>}>
      <div className="stack">
        <div className="grid grid-2">
          <div className="card stat stat-hero">
            <span className="stat-label">Saldo total atual</span>
            <div className="stat-value"><Money value={total} /></div>
            <span className="stat-foot">Soma de todas as contas, considerando lançamentos efetivados</span>
          </div>
          <div className="card stat">
            <span className="stat-label">Saldo previsto</span>
            <div className="stat-value"><Money value={projected} /></div>
            <span className="stat-foot">Incluindo lançamentos pendentes e futuros</span>
          </div>
        </div>

        {rows.length ? (
          <div className="grid grid-3">
            {rows.map(({ account: a, balance, flow }) => (
              <div key={a.id} className="card account-card" style={{ ['--accent' as string]: a.color }}>
                <div className="row" style={{ marginBottom: 18 }}>
                  <IconBadge icon={ACCOUNT_ICONS[a.type]} color={a.color} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{a.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{ACCOUNT_LABELS[a.type]}</div>
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(a)} aria-label={`Editar ${a.name}`}><Pencil size={16} /></button>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>Saldo</div>
                <div className="stat-value" style={{ marginBottom: 12 }}><Money value={balance} /></div>
                <div className="row-between" style={{ fontSize: 13 }}>
                  <span className="muted">Movimentação no mês</span>
                  <Money value={flow} signed className={flow >= 0 ? 'income' : 'expense'} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card"><EmptyState icon={Wallet} title="Nenhuma conta" text="Cadastre suas contas bancárias, carteira e investimentos." /></div>
        )}
      </div>

      {editing && <AccountForm account={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </Layout>
  );
}
