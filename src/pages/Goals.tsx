import { useState } from 'react';
import { CalendarClock, Minus, Pencil, Plus, Target, Trophy } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import MoneyInput from '../components/MoneyInput';
import { ColorPicker, EmptyState, Money, Progress } from '../components/ui';
import { useFinance } from '../store/FinanceContext';
import type { Goal } from '../types';
import { formatCurrency, formatDate, formatPercent, parseDate, uid } from '../utils/format';

function GoalForm({ goal, onClose }: { goal?: Goal; onClose: () => void }) {
  const { save, remove } = useFinance();
  const [name, setName] = useState(goal?.name ?? '');
  const [target, setTarget] = useState(goal?.target ?? 0);
  const [saved, setSaved] = useState(goal?.saved ?? 0);
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');
  const [color, setColor] = useState(goal?.color ?? '#1baf7a');
  const valid = name.trim() && target > 0;

  const submit = () => {
    if (!valid) return;
    save('goals', { id: goal?.id ?? uid(), name: name.trim(), target, saved, deadline: deadline || undefined, color });
    onClose();
  };

  return (
    <Modal
      title={goal ? 'Editar meta' : 'Nova meta'}
      onClose={onClose}
      footer={
        <>
          {goal && <button className="btn btn-danger left" onClick={() => { if (confirm('Excluir esta meta?')) { remove('goals', goal.id); onClose(); } }}>Excluir</button>}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={!valid}>Salvar</button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="g-name">Objetivo</label>
        <input id="g-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Reserva de emergência, viagem, carro" autoFocus />
      </div>
      <div className="form-grid">
        <div className="field"><label htmlFor="g-target">Valor da meta</label><MoneyInput id="g-target" value={target} onChange={setTarget} /></div>
        <div className="field"><label htmlFor="g-saved">Já guardado</label><MoneyInput id="g-saved" value={saved} onChange={setSaved} /></div>
        <div className="field full"><label htmlFor="g-deadline">Prazo (opcional)</label><input id="g-deadline" type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
      </div>
      <div className="field"><label>Cor</label><ColorPicker value={color} onChange={setColor} /></div>
    </Modal>
  );
}

function MoveForm({ goal, mode, onClose }: { goal: Goal; mode: 'add' | 'remove'; onClose: () => void }) {
  const { save } = useFinance();
  const [value, setValue] = useState(0);
  const submit = () => {
    if (value <= 0) return;
    save('goals', { ...goal, saved: Math.max(0, goal.saved + (mode === 'add' ? value : -value)) });
    onClose();
  };
  return (
    <Modal
      title={mode === 'add' ? `Guardar em "${goal.name}"` : `Retirar de "${goal.name}"`}
      onClose={onClose}
      width={420}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={submit} disabled={value <= 0}>Confirmar</button></>}
    >
      <div className="field"><label htmlFor="g-move">Valor</label><MoneyInput id="g-move" value={value} onChange={setValue} /></div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>Guardado atualmente: {formatCurrency(goal.saved)}</p>
    </Modal>
  );
}

const monthsUntil = (iso: string) => {
  const d = parseDate(iso);
  const now = new Date();
  return Math.max(0, (d.getFullYear() - now.getFullYear()) * 12 + d.getMonth() - now.getMonth());
};

export default function Goals() {
  const { data } = useFinance();
  const [editing, setEditing] = useState<Goal | 'new' | null>(null);
  const [moving, setMoving] = useState<{ goal: Goal; mode: 'add' | 'remove' } | null>(null);

  const totalTarget = data.goals.reduce((s, g) => s + g.target, 0);
  const totalSaved = data.goals.reduce((s, g) => s + Math.min(g.saved, g.target), 0);

  return (
    <Layout title="Metas" actions={<button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={17} /> <span className="hide-mobile">Nova meta</span></button>}>
      <div className="stack">
        {data.goals.length > 0 && (
          <div className="card">
            <div className="row-between wrap" style={{ marginBottom: 12 }}>
              <div>
                <div className="muted" style={{ fontSize: 13 }}>Progresso geral</div>
                <div className="stat-value"><Money value={totalSaved} /> <span className="muted" style={{ fontSize: 16, fontWeight: 500 }}>de <Money value={totalTarget} /></span></div>
              </div>
              <strong style={{ fontSize: 22 }} className="num">{formatPercent(totalTarget ? totalSaved / totalTarget : 0)}</strong>
            </div>
            <Progress value={totalTarget ? totalSaved / totalTarget : 0} color="var(--brand)" />
          </div>
        )}

        {data.goals.length ? (
          <div className="grid grid-3">
            {data.goals.map((g) => {
              const pct = g.saved / g.target;
              const done = pct >= 1;
              const months = g.deadline ? monthsUntil(g.deadline) : 0;
              const perMonth = g.deadline && !done ? (g.target - g.saved) / Math.max(1, months) : 0;
              return (
                <div key={g.id} className="card stack" style={{ gap: 14 }}>
                  <div className="row">
                    <span className="cat-icon" style={{ background: `${g.color}1f`, color: g.color }}>{done ? <Trophy size={20} /> : <Target size={20} />}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{g.name}</div>
                      <div className="muted" style={{ fontSize: 13 }}>{g.deadline ? `Até ${formatDate(g.deadline)}` : 'Sem prazo definido'}</div>
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(g)} aria-label="Editar meta"><Pencil size={16} /></button>
                  </div>
                  <div>
                    <div className="row-between" style={{ marginBottom: 8 }}>
                      <strong><Money value={g.saved} /></strong>
                      <span className="muted num" style={{ fontSize: 13 }}>{formatPercent(Math.min(pct, 1))} de <Money value={g.target} /></span>
                    </div>
                    <Progress value={pct} color={g.color} />
                  </div>
                  {done ? (
                    <span className="badge badge-ok" style={{ alignSelf: 'flex-start' }}><Trophy size={12} /> Meta alcançada!</span>
                  ) : perMonth > 0 ? (
                    <div className="row muted" style={{ fontSize: 13, gap: 6 }}>
                      <CalendarClock size={15} /> Guarde <Money value={perMonth} className="text-2" /> por mês para chegar lá
                    </div>
                  ) : (
                    <div className="muted" style={{ fontSize: 13 }}>Faltam <Money value={g.target - g.saved} /></div>
                  )}
                  <div className="row">
                    <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => setMoving({ goal: g, mode: 'add' })}><Plus size={15} /> Guardar</button>
                    <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => setMoving({ goal: g, mode: 'remove' })} disabled={g.saved <= 0}><Minus size={15} /> Retirar</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card">
            <EmptyState
              icon={Target}
              title="Nenhuma meta criada"
              text="Defina objetivos como reserva de emergência, viagem ou um bem, e acompanhe seu progresso."
              action={<button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={16} /> Criar meta</button>}
            />
          </div>
        )}
      </div>

      {editing && <GoalForm goal={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {moving && <MoveForm goal={moving.goal} mode={moving.mode} onClose={() => setMoving(null)} />}
    </Layout>
  );
}
