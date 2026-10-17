import { useRef, useState } from 'react';
import { Database, Download, FileJson, Pencil, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { CATEGORY_ICONS, CategoryIcon } from '../components/Icons';
import { ColorPicker, Segmented } from '../components/ui';
import { isValidData, useFinance } from '../store/FinanceContext';
import { demoData, emptyData } from '../store/seed';
import type { Category, Settings as SettingsT } from '../types';
import { exportBackup, exportTransactionsCSV } from '../utils/export';
import { uid } from '../utils/format';

function CategoryForm({ category, defaultType, onClose }: { category?: Category; defaultType: Category['type']; onClose: () => void }) {
  const { data, save, remove } = useFinance();
  const [name, setName] = useState(category?.name ?? '');
  const [type, setType] = useState<Category['type']>(category?.type ?? defaultType);
  const [icon, setIcon] = useState(category?.icon ?? 'tag');
  const [color, setColor] = useState(category?.color ?? '#2a78d6');

  const submit = () => {
    if (!name.trim()) return;
    save('categories', { id: category?.id ?? uid(), name: name.trim(), type, icon, color });
    onClose();
  };

  const del = () => {
    if (!category) return;
    const used = data.transactions.filter((t) => t.categoryId === category.id).length;
    if (confirm(`Excluir a categoria "${category.name}"?${used ? ` ${used} lançamentos ficarão sem categoria.` : ''}`)) {
      remove('categories', category.id);
      onClose();
    }
  };

  return (
    <Modal
      title={category ? 'Editar categoria' : 'Nova categoria'}
      onClose={onClose}
      footer={
        <>
          {category && <button className="btn btn-danger left" onClick={del}>Excluir</button>}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={!name.trim()}>Salvar</button>
        </>
      }
    >
      <div className="row">
        <CategoryIcon icon={icon} color={color} size={48} />
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="cat-name">Nome</label>
          <input id="cat-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
      </div>
      {!category && (
        <div className="field">
          <label>Tipo</label>
          <Segmented value={type} options={[{ value: 'expense', label: 'Despesa' }, { value: 'income', label: 'Receita' }]} onChange={setType} />
        </div>
      )}
      <div className="field">
        <label>Ícone</label>
        <div className="row wrap" style={{ gap: 6 }}>
          {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              className="btn btn-icon btn-sm"
              aria-label={key}
              aria-pressed={icon === key}
              onClick={() => setIcon(key)}
              style={icon === key ? { borderColor: color, color, background: `${color}1f` } : undefined}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>
      <div className="field"><label>Cor</label><ColorPicker value={color} onChange={setColor} /></div>
    </Modal>
  );
}

export default function Settings() {
  const { data, updateSettings, replaceAll } = useFinance();
  const [catType, setCatType] = useState<Category['type']>('expense');
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const importFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!isValidData(parsed)) throw new Error('invalid');
      if (!confirm('Importar este backup substituirá todos os dados atuais. Continuar?')) return;
      replaceAll(parsed);
      setMessage('Backup importado com sucesso.');
    } catch {
      setMessage('Arquivo inválido. Selecione um backup .json gerado por este aplicativo.');
    }
  };

  const categories = data.categories.filter((c) => c.type === catType);

  return (
    <Layout title="Configurações">
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <div className="card stack" style={{ gap: 16 }}>
            <div className="card-title">Perfil e aparência</div>
            <div className="field">
              <label htmlFor="s-name">Seu nome</label>
              <input id="s-name" className="input" value={data.settings.userName} onChange={(e) => updateSettings({ userName: e.target.value })} placeholder="Como devemos te chamar?" />
            </div>
            <div className="field">
              <label>Tema</label>
              <Segmented<SettingsT['theme']>
                value={data.settings.theme}
                options={[{ value: 'system', label: 'Automático' }, { value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }]}
                onChange={(theme) => updateSettings({ theme })}
              />
            </div>
            <label className="switch">
              <input type="checkbox" checked={data.settings.hideValues} onChange={(e) => updateSettings({ hideValues: e.target.checked })} />
              Ocultar valores na tela (modo privacidade)
            </label>
          </div>

          <div className="card stack" style={{ gap: 14 }}>
            <div className="row"><Database size={18} /><div className="card-title">Seus dados</div></div>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              Os dados ficam armazenados localmente neste navegador/dispositivo. Faça backups periódicos para não perdê-los
              e para transferi-los entre o celular e o computador.
            </p>
            <div className="grid grid-2" style={{ gap: 10 }}>
              <button className="btn" onClick={() => exportBackup(data)}><FileJson size={16} /> Exportar backup</button>
              <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={16} /> Importar backup</button>
              <button className="btn" onClick={() => exportTransactionsCSV(data.transactions, data, 'todos-lancamentos.csv')} disabled={!data.transactions.length}><Download size={16} /> Exportar CSV</button>
              <button className="btn" onClick={() => confirm('Carregar dados de demonstração? Os dados atuais serão substituídos.') && replaceAll(demoData())}><RotateCcw size={16} /> Dados de exemplo</button>
            </div>
            <button
              className="btn btn-danger"
              onClick={() => confirm('Apagar todos os lançamentos, contas, orçamentos e metas? Esta ação não pode ser desfeita.') && replaceAll({ ...emptyData(), settings: data.settings })}
            >
              <Trash2 size={16} /> Começar do zero
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }} />
            {message && <p role="status" style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{message}</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header wrap">
            <div className="card-title">Categorias</div>
            <div className="row">
              <Segmented value={catType} options={[{ value: 'expense', label: 'Despesas' }, { value: 'income', label: 'Receitas' }]} onChange={setCatType} />
              <button className="btn btn-sm btn-primary" onClick={() => setEditing('new')}><Plus size={15} /> Nova</button>
            </div>
          </div>
          <div className="tx-list">
            {categories.map((c) => (
              <button key={c.id} className="tx-item" onClick={() => setEditing(c)}>
                <CategoryIcon icon={c.icon} color={c.color} size={36} />
                <span className="tx-main" style={{ fontWeight: 600 }}>{c.name}</span>
                <span className="muted" style={{ fontSize: 13 }}>{data.transactions.filter((t) => t.categoryId === c.id).length} lanç.</span>
                <Pencil size={15} className="muted" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {editing && <CategoryForm category={editing === 'new' ? undefined : editing} defaultType={catType} onClose={() => setEditing(null)} />}
    </Layout>
  );
}
