import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Plus, Trash2, Edit3, Building2, 
  ArrowRight, Save, X,
  LayoutGrid, Rocket, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../services/api';

interface Negocio {
  id: number;
  nome: string;
}

export function Perfil() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [formAberto, setFormAberto] = useState(false); // Controle do menu retrátil
  const [novoNegocio, setNovoNegocio] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState('');

  useEffect(() => {
    carregarNegocios();
  }, []);

  async function carregarNegocios() {
    try {
      const response = await api.get('/Negocios');
      setNegocios(response.data);
    } catch (err) {
      console.error("Erro ao buscar negócios.");
    }
  }

  async function handleAddNegocio() {
    if (!novoNegocio.trim()) return;
    try {
      await api.post('/Negocios', { nome: novoNegocio });
      setNovoNegocio('');
      setFormAberto(false); // Fecha o menu após cadastrar
      carregarNegocios();
    } catch (err) {
      alert("Erro ao cadastrar negócio.");
    }
  }

  async function handleUpdateNegocio(id: number) {
    if (!nomeEdicao.trim()) return;
    try {
      await api.put(`/Negocios/${id}`, { id, nome: nomeEdicao });
      setEditandoId(null);
      carregarNegocios();
    } catch (err) {
      alert("Erro ao atualizar.");
    }
  }

  async function handleDeleteNegocio(id: number) {
    if (!confirm("Excluir este negócio e todos os seus dados?")) return;
    try {
      await api.delete(`/Negocios/${id}`);
      carregarNegocios();
    } catch (err) {
      alert("Erro ao excluir.");
    }
  }

  const selecionarNegocio = (id: number) => {
    localStorage.setItem('@Autonomax:selectedNegocioId', String(id));
    window.location.href = '/dashboard'; 
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-10 pb-16 pt-8 px-4">
        
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-100">
              <Building2 size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Meus Negócios</h2>
              <p className="text-sm text-gray-500 font-medium">Gerencie seus perfis e unidades de trabalho</p>
            </div>
          </div>
        </div>

        {/* FORMULÁRIO DE CRIAÇÃO RETRÁTIL */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden transition-all duration-300">
          <button 
            onClick={() => setFormAberto(!formAberto)}
            className="w-full bg-emerald-50/50 px-8 py-5 border-b border-gray-100 flex items-center justify-between hover:bg-emerald-50 transition-colors border-none outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Rocket size={20} className="text-emerald-600" />
              <h3 className="text-xs font-black text-emerald-900 uppercase tracking-[0.2em]">Cadastrar Novo Perfil</h3>
            </div>
            {formAberto ? <ChevronUp size={20} className="text-emerald-600" /> : <ChevronDown size={20} className="text-emerald-600" />}
          </button>
          
          {formAberto && (
            <div className="p-8 animate-in slide-in-from-top duration-300">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Nome do Negócio / Empresa</label>
                  <input
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm transition-all"
                    value={novoNegocio}
                    onChange={e => setNovoNegocio(e.target.value)}
                    placeholder="Ex: Minha Gráfica, Consultoria Allison..."
                  />
                </div>
                <button 
                  onClick={handleAddNegocio}
                  className="md:self-end bg-emerald-950 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  Criar Perfil <Plus size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* GRID DE NEGÓCIOS EM CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {negocios.map(negocio => (
            <div key={negocio.id} className="group bg-white rounded-[32px] border border-gray-200 shadow-sm hover:shadow-2xl hover:border-emerald-200 transition-all overflow-hidden flex flex-col relative">
              <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                    {negocio.nome.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* BOTÕES DE AÇÃO FLUTUANTES */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-8 right-8 bg-white shadow-lg p-1.5 rounded-2xl border border-gray-50">
                    <button 
                      onClick={() => { setEditandoId(negocio.id); setNomeEdicao(negocio.nome); }}
                      className="p-2 text-gray-400 hover:text-emerald-600 transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteNegocio(negocio.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {editandoId === negocio.id ? (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Renomear Perfil</span>
                      <button onClick={() => setEditandoId(null)} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"><X size={20}/></button>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-emerald-500"
                        value={nomeEdicao}
                        onChange={e => setNomeEdicao(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => handleUpdateNegocio(negocio.id)} className="p-3 bg-emerald-600 text-white rounded-xl border-none cursor-pointer hover:bg-emerald-700 transition-all"><Save size={18}/></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="text-2xl font-black text-gray-800 mb-2 leading-tight group-hover:text-emerald-900 transition-colors">{negocio.nome}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 bg-gray-50 w-fit px-3 py-1 rounded-lg">
                      <LayoutGrid size={12} className="text-emerald-600" /> ID #{negocio.id}
                    </p>
                  </>
                )}
              </div>

              {!editandoId && (
                <button 
                  onClick={() => selecionarNegocio(negocio.id)}
                  className="w-full bg-gray-50 border-t border-gray-100 py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center justify-between group-hover:bg-emerald-950 group-hover:text-emerald-50 transition-all border-none cursor-pointer"
                >
                  Acessar Unidade <ArrowRight size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}