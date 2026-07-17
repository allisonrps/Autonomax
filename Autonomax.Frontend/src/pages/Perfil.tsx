import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Trash2, Edit3, X, Building2, 
  AlertTriangle,  Rocket, 
  ChevronDown, ChevronUp, Lock,  ShieldCheck
} from 'lucide-react';
import api from '../services/api';

interface Negocio {
  id: number;
  nome: string;
}

export function Perfil() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [novoNegocio, setNovoNegocio] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [confirmarExclusao, setConfirmarExclusao] = useState<number | null>(null);
  
  // Estado para Modal de Senha
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [senhaAntiga, setSenhaAntiga] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  useEffect(() => { carregarNegocios(); }, []);

  async function carregarNegocios() {
    try {
      const response = await api.get('/Negocios');
      setNegocios(response.data);
    } catch (err) { console.error("Erro ao buscar negócios."); }
  }

  async function handleRedefinirSenha() {
    if (!senhaAntiga || !novaSenha) return alert("Preencha todos os campos.");
    try {
      await api.post('/Auth/redefinir-senha', { senhaAntiga, novaSenha });
      alert("Senha alterada com sucesso!");
      setSenhaAntiga(''); setNovaSenha(''); setModalSenhaAberto(false);
    } catch (err) { alert("Erro ao alterar senha. Verifique a senha atual."); }
  }

  async function handleAddNegocio() {
    if (!novoNegocio.trim()) return;
    try {
      await api.post('/Negocios', { nome: novoNegocio });
      setNovoNegocio(''); setFormAberto(false); carregarNegocios();
    } catch (err) { alert("Erro ao cadastrar."); }
  }

  async function handleUpdateNegocio(id: number) {
    if (!nomeEdicao.trim()) return;
    try {
      await api.put(`/Negocios/${id}`, { id, nome: nomeEdicao });
      setEditandoId(null); carregarNegocios();
    } catch (err) { alert("Erro ao atualizar."); }
  }

  async function handleDeleteNegocio() {
    if (!confirmarExclusao) return;
    try {
      await api.delete(`/Negocios/${confirmarExclusao}`);
      setConfirmarExclusao(null); carregarNegocios();
    } catch (err) { alert("Erro ao excluir."); }
  }

  const selecionarNegocio = (id: number) => {
    localStorage.setItem('@Autonomax:selectedNegocioId', String(id));
    window.location.href = '/dashboard'; 
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* HEADER */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50"><Building2 size={24} /></div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Gerenciamento de Conta</h2>
                <p className="text-xs text-gray-500 font-medium">Unidades de negócio e configurações de segurança</p>
              </div>
            </div>
            <button onClick={() => setModalSenhaAberto(true)} className="flex items-center gap-2 bg-gray-950 px-4 py-2 rounded-md border border-gray-800 text-[10px] font-black uppercase text-gray-400 hover:text-emerald-400 transition-colors">
              <ShieldCheck size={14} /> Redefinir Senha
            </button>
          </div>

          {/* NEGÓCIOS */}
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <button onClick={() => setFormAberto(!formAberto)} className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between border-b border-gray-800 outline-none">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2"><Rocket size={16}/> Novo Perfil</span>
                  {formAberto ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
                {formAberto && (
                  <div className="p-6 flex gap-3 bg-gray-900">
                    <input className="flex-1 p-3.5 bg-gray-950 border border-gray-800 rounded-md text-sm text-white focus:border-emerald-600 outline-none" value={novoNegocio} onChange={e => setNovoNegocio(e.target.value)} placeholder="Nome do Negócio..." />
                    <button onClick={handleAddNegocio} className="bg-emerald-600 px-6 rounded-md font-black text-xs uppercase text-white">Criar</button>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {negocios.map(negocio => (
                <div key={negocio.id} className="bg-gray-900 p-5 rounded-xl border border-gray-800">
                  <div className="flex justify-between mb-4">
                    <div className="w-10 h-10 rounded-md bg-emerald-950/40 text-emerald-400 flex items-center justify-center font-black border border-emerald-900/50">{negocio.nome.charAt(0)}</div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditandoId(negocio.id); setNomeEdicao(negocio.nome); }} className="p-2 text-gray-500 hover:text-emerald-400"><Edit3 size={16}/></button>
                      <button onClick={() => setConfirmarExclusao(negocio.id)} className="p-2 text-gray-500 hover:text-red-400"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  {editandoId === negocio.id ? (
                    <div className="space-y-2">
                      <input className="w-full p-2 bg-gray-950 border border-gray-800 rounded text-xs text-white" value={nomeEdicao} onChange={e => setNomeEdicao(e.target.value)} />
                      <button onClick={() => handleUpdateNegocio(negocio.id)} className="w-full py-2 bg-emerald-600 rounded text-[10px] font-black uppercase">Salvar</button>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-black text-sm uppercase tracking-tight text-gray-100">{negocio.nome}</h4>
                      <button onClick={() => selecionarNegocio(negocio.id)} className="mt-4 w-full py-2 bg-gray-950 border border-gray-800 rounded-md text-[10px] font-black uppercase hover:border-emerald-600 transition-all">Acessar</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL REDEFINIR SENHA */}
      {modalSenhaAberto && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-sm rounded-xl border border-gray-800 p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2"><Lock size={16}/> Segurança</h3>
               <button onClick={() => setModalSenhaAberto(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>
            <input type="password" placeholder="Senha Atual" className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-sm text-white focus:border-emerald-600 outline-none" value={senhaAntiga} onChange={e => setSenhaAntiga(e.target.value)} />
            <input type="password" placeholder="Nova Senha" className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-sm text-white focus:border-emerald-600 outline-none" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
            <button onClick={handleRedefinirSenha} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-700">Atualizar Senha</button>
          </div>
        </div>
      )}

      {/* MODAL EXCLUSÃO */}
      {confirmarExclusao && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-sm rounded-xl border border-gray-800 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-900/50"><AlertTriangle size={32} /></div>
            <h3 className="text-sm font-black text-gray-100 uppercase">Excluir este perfil?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setConfirmarExclusao(null)} className="py-3 bg-gray-800 text-gray-300 rounded-md font-black text-[10px] uppercase">Não</button>
              <button onClick={handleDeleteNegocio} className="py-3 bg-red-600 text-white rounded-md font-black text-[10px] uppercase">Sim</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}