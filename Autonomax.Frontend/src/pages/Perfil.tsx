import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Trash2, Edit3, X, Building2, 
  AlertTriangle, Rocket, ChevronDown, ChevronUp, Lock, 
  ShieldCheck,
} from 'lucide-react';
import api from '../services/api';

interface Negocio { id: number; nome: string; }
interface DetalhesFinanceiros { receitas: number; despesas: number; pendentes: number; liquido: number; carregando: boolean; }

export function Perfil() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [novoNegocio, setNovoNegocio] = useState('');
  
  const [negocioExpandido, setNegocioExpandido] = useState<number | null>(null);
  const [detalhesFinanceiros, setDetalhesFinanceiros] = useState<Record<number, DetalhesFinanceiros>>({});

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [confirmarExclusao, setConfirmarExclusao] = useState<number | null>(null);
  
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [senhaAntiga, setSenhaAntiga] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  useEffect(() => { carregarNegocios(); }, []);

  async function carregarNegocios() {
    try { const response = await api.get('/Negocios'); setNegocios(response.data); } 
    catch (err) { console.error("Erro ao buscar negócios."); }
  }

  async function handleRedefinirSenha() {
    if (novaSenha !== confirmarSenha) return alert("As novas senhas não coincidem!");
    try {
      await api.post('/Auth/redefinir-senha', { senhaAntiga, novaSenha });
      alert("Senha alterada com sucesso!");
      setSenhaAntiga(''); setNovaSenha(''); setConfirmarSenha(''); setModalSenhaAberto(false);
    } catch (err) { alert("Erro ao alterar senha. Verifique a senha atual."); }
  }

  async function handleAddNegocio() {
    if (!novoNegocio.trim()) return;
    try { await api.post('/Negocios', { nome: novoNegocio }); setNovoNegocio(''); setFormAberto(false); carregarNegocios(); } 
    catch (err) { alert("Erro ao cadastrar."); }
  }

  async function handleUpdateNegocio(id: number) {
    if (!nomeEdicao.trim()) return;
    try { await api.put(`/Negocios/${id}`, { id, nome: nomeEdicao }); setEditandoId(null); carregarNegocios(); } 
    catch (err) { alert("Erro ao atualizar."); }
  }

  async function handleDeleteNegocio(id: number) {
    try { await api.delete(`/Negocios/${id}`); setConfirmarExclusao(null); carregarNegocios(); } 
    catch (err) { alert("Erro ao excluir."); }
  }

  async function toggleExpandir(id: number) {
    if (negocioExpandido === id) { setNegocioExpandido(null); return; }
    setNegocioExpandido(id);
    if (!detalhesFinanceiros[id]) {
      setDetalhesFinanceiros(prev => ({ ...prev, [id]: { receitas: 0, despesas: 0, pendentes: 0, liquido: 0, carregando: true } }));
      try {
        const res = await api.get(`/Transacoes/por-negocio/${id}`);
        const transacoes = res.data;
        const receitas = transacoes.filter((t: any) => t.tipo === 'Entrada' && t.status === 'Pago').reduce((acc: number, t: any) => acc + t.valor, 0);
        const pendentes = transacoes.filter((t: any) => t.tipo === 'Entrada' && t.status === 'Pendente').reduce((acc: number, t: any) => acc + t.valor, 0);
        const despesas = transacoes.filter((t: any) => t.tipo === 'Saida' && t.status === 'Pago').reduce((acc: number, t: any) => acc + t.valor, 0);
        setDetalhesFinanceiros(prev => ({ ...prev, [id]: { receitas, despesas, pendentes, liquido: receitas - despesas, carregando: false } }));
      } catch (err) { setDetalhesFinanceiros(prev => ({ ...prev, [id]: { receitas: 0, despesas: 0, pendentes: 0, liquido: 0, carregando: false } })); }
    }
  }

  const selecionarNegocio = (id: number) => {
    localStorage.setItem('@Autonomax:selectedNegocioId', String(id));
    window.location.href = '/dashboard'; 
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50 hidden md:flex"><Building2 size={24} /></div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Gerenciamento de Conta</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Unidades e Segurança</p>
              </div>
            </div>
            <button onClick={() => setModalSenhaAberto(true)} className="flex items-center gap-2 bg-gray-950 px-5 py-3 rounded-md border border-gray-800 text-[10px] font-black uppercase text-gray-400 hover:border-emerald-600 hover:text-emerald-400 transition-all"><ShieldCheck size={16} /> Redefinir Senha</button>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <button onClick={() => setFormAberto(!formAberto)} className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between border-b border-gray-800 outline-none hover:bg-gray-800 transition-colors">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2"><Rocket size={18}/> Novo Perfil de Negócio</span>
              {formAberto ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
            </button>
            {formAberto && (
              <div className="p-6 flex flex-col md:flex-row gap-3 bg-gray-900">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase ml-1">Nome do Negócio</label>
                  <input className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-sm text-white focus:border-emerald-600 outline-none" value={novoNegocio} onChange={e => setNovoNegocio(e.target.value)} placeholder="Ex: Minha Loja" />
                </div>
                <button onClick={handleAddNegocio} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 rounded-md font-black text-xs uppercase text-white mt-auto">Criar</button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {negocios.map(negocio => {
              const dados = detalhesFinanceiros[negocio.id];
              return (
                <div key={negocio.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 md:px-6 md:py-4 flex flex-col transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center font-black text-lg border border-gray-700">{negocio.nome.charAt(0).toUpperCase()}</div>
                      <h4 className="font-black text-sm uppercase">{negocio.nome}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => selecionarNegocio(negocio.id)} className="bg-emerald-950/40 text-emerald-400 px-4 py-2 rounded-md text-[10px] font-black uppercase">Acessar</button>
                      <button onClick={() => toggleExpandir(negocio.id)} className="p-2 text-gray-500 hover:text-white">{negocioExpandido === negocio.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>
                      <button onClick={() => { setEditandoId(negocio.id); setNomeEdicao(negocio.nome); }} className="p-2 text-gray-500 hover:text-blue-400"><Edit3 size={16}/></button>
                      <button onClick={() => setConfirmarExclusao(negocio.id)} className="p-2 text-gray-500 hover:text-red-400"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  {negocioExpandido === negocio.id && (
                    <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-gray-800">
                      {[ {l: 'Receitas', v: dados?.receitas || 0, c: 'text-emerald-400'}, {l: 'Pendentes', v: dados?.pendentes || 0, c: 'text-amber-400'}, {l: 'Despesas', v: dados?.despesas || 0, c: 'text-red-400'}, {l: 'Líquido', v: dados?.liquido || 0, c: (dados?.liquido || 0) >= 0 ? 'text-blue-400' : 'text-red-400'} ].map((f, i) => (
                         <div key={i} className="bg-gray-950 p-3 rounded border border-gray-800">
                           <p className="text-[9px] font-bold text-gray-500 uppercase">{f.l}</p>
                           <p className={`text-xs font-black ${f.c}`}>R$ {f.v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                         </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

{modalSenhaAberto && (
  <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div className="bg-gray-900 w-full max-w-sm rounded-xl border border-gray-800 p-6 space-y-4 animate-in zoom-in duration-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2"><Lock size={16}/> Segurança</h3>
        <button onClick={() => setModalSenhaAberto(false)} className="text-gray-500 hover:text-white"><X size={18}/></button>
      </div>

      {/* Campo Senha Atual */}
      <div className="space-y-1 relative">
        <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Senha Atual</label>
        <input type="password" placeholder="••••••••" className="w-full p-3 bg-gray-950 border border-gray-800 rounded text-sm text-white" value={senhaAntiga} onChange={e => setSenhaAntiga(e.target.value)} />
      </div>

      {/* Campo Nova Senha */}
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Nova Senha</label>
        <input type="password" placeholder="••••••••" className="w-full p-3 bg-gray-950 border border-gray-800 rounded text-sm text-white" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
      </div>

      {/* Campo Confirmação + Validação Dinâmica */}
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Confirmar Nova Senha</label>
        <input type="password" placeholder="••••••••" className="w-full p-3 bg-gray-950 border border-gray-800 rounded text-sm text-white" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} />
        
        {confirmarSenha && (
          <p className={`text-[9px] font-bold uppercase mt-1 ${novaSenha === confirmarSenha ? 'text-emerald-500' : 'text-red-500'}`}>
            {novaSenha === confirmarSenha ? '✓ As senhas conferem' : '✕ As senhas não estão iguais'}
          </p>
        )}
      </div>

      <button 
        onClick={handleRedefinirSenha} 
        disabled={!senhaAntiga || !novaSenha || novaSenha !== confirmarSenha}
        className="w-full py-3 bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded font-black text-xs uppercase mt-2 transition-all"
      >
        Atualizar Senha
      </button>
    </div>
  </div>
)}

      {/* MODAL EDIÇÃO */}
      {editandoId && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-sm rounded-xl border border-gray-800 p-6 space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-2"><h3 className="text-xs font-black uppercase text-blue-400">Editar Negócio</h3><button onClick={() => setEditandoId(null)} className="text-gray-500 hover:text-white"><X size={18}/></button></div>
            <div className="space-y-1"><label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Novo Nome</label><input className="w-full p-3 bg-gray-950 border border-gray-800 rounded text-sm text-white" value={nomeEdicao} onChange={e => setNomeEdicao(e.target.value)} /></div>
            <button onClick={() => handleUpdateNegocio(editandoId)} className="w-full py-3 bg-blue-600 rounded font-black text-xs uppercase mt-2">Salvar Alterações</button>
          </div>
        </div>
      )}

      {/* MODAL EXCLUSÃO */}
      {confirmarExclusao && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 text-center space-y-4 animate-in zoom-in duration-200">
            <AlertTriangle className="text-red-500 mx-auto" size={32} />
            <p className="text-sm font-black text-white">Excluir unidade permanentemente?</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setConfirmarExclusao(null)} className="flex-1 py-2 bg-gray-800 rounded text-xs font-black uppercase">Não</button>
              <button onClick={() => handleDeleteNegocio(confirmarExclusao)} className="flex-1 py-2 bg-red-600 rounded text-xs font-black uppercase">Sim</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}