import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Plus, Trash2, Edit3, Building2, 
  Briefcase, ArrowRight, Save, X,
  LayoutGrid, Rocket
} from 'lucide-react';
import api from '../services/api';

interface Negocio {
  id: number;
  nome: string;
}

export function Perfil() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
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
    window.location.href = '/dashboard'; // Redireciona para o fluxo de caixa
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

        {/* FORMULÁRIO DE CRIAÇÃO (PADRÃO FICHA) */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="bg-gray-50/80 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
            <Plus size={16} className="text-emerald-600" />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cadastrar Novo Perfil</h3>
          </div>
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nome do Negócio / Empresa</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-all"
                  value={novoNegocio}
                  onChange={e => setNovoNegocio(e.target.value)}
                  placeholder="Ex: Minha Gráfica, Consultoria Allison..."
                />
              </div>
              <button 
                onClick={handleAddNegocio}
                className="md:self-end bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                Criar Perfil <Rocket size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* GRID DE NEGÓCIOS EM CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {negocios.map(negocio => (
            <div key={negocio.id} className="group bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    {negocio.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => { setEditandoId(negocio.id); setNomeEdicao(negocio.nome); }}
                      className="p-2 text-gray-300 hover:text-emerald-600 transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteNegocio(negocio.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {editandoId === negocio.id ? (
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 px-3 py-2 border rounded-lg text-sm font-bold outline-emerald-500"
                      value={nomeEdicao}
                      onChange={e => setNomeEdicao(e.target.value)}
                    />
                    <button onClick={() => handleUpdateNegocio(negocio.id)} className="p-2 bg-emerald-600 text-white rounded-lg"><Save size={16}/></button>
                    <button onClick={() => setEditandoId(null)} className="p-2 bg-gray-100 text-gray-400 rounded-lg"><X size={16}/></button>
                  </div>
                ) : (
                  <>
                    <h4 className="text-xl font-black text-gray-800 mb-1">{negocio.nome}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <LayoutGrid size={10} /> ID do Perfil: {negocio.id}
                    </p>
                  </>
                )}
              </div>

              <button 
                onClick={() => selecionarNegocio(negocio.id)}
                className="w-full bg-gray-50 border-t border-gray-100 py-4 px-6 text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center justify-between group-hover:bg-emerald-600 group-hover:text-white transition-all"
              >
                Acessar Painel <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}