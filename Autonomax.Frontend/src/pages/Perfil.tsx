import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Plus, Trash2, Edit3, Save, X, Briefcase } from 'lucide-react';
import api from '../services/api';

interface Negocio {
  id: number;
  nome: string;
}

export function Perfil() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [novoNomeNegocio, setNovoNomeNegocio] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState('');

  // 1. Carregar negócios ao abrir a página
  useEffect(() => {
    carregarNegocios();
  }, []);

  async function carregarNegocios() {
    try {
      const response = await api.get('/Negocios'); // Ajuste o endpoint se necessário
      setNegocios(response.data);
    } catch (err) {
      console.error("Erro ao carregar negócios");
    }
  }

  // 2. Adicionar Negócio
  async function handleAddNegocio() {
    if (!novoNomeNegocio.trim()) return;
    try {
      await api.post('/Negocios', { nome: novoNomeNegocio });
      setNovoNomeNegocio('');
      carregarNegocios();
    } catch (err) {
      alert("Erro ao adicionar negócio");
    }
  }

  // 3. Editar Negócio
  async function handleUpdateNegocio(id: number) {
    try {
      await api.put(`/Negocios/${id}`, { nome: nomeEdicao });
      setEditandoId(null);
      carregarNegocios();
    } catch (err) {
      alert("Erro ao atualizar");
    }
  }

  // 4. Excluir Negócio
  async function handleDeleteNegocio(id: number) {
    if (!confirm("Tem certeza? Isso excluirá todos os dados vinculados a este negócio.")) return;
    try {
      await api.delete(`/Negocios/${id}`);
      carregarNegocios();
    } catch (err) {
      alert("Erro ao excluir");
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Meu Perfil</h2>
          <p className="text-gray-500">Gerencie suas informações e seus negócios.</p>
        </div>

        {/* SEÇÃO: MEUS NEGÓCIOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="text-blue-600" size={20} />
              <h3 className="font-bold text-gray-700">Gestão de Negócios</h3>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Input para Novo Negócio */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do novo negócio (ex: Freelance TI)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={novoNomeNegocio}
                onChange={e => setNovoNomeNegocio(e.target.value)}
              />
              <button
                onClick={handleAddNegocio}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={18} /> Adicionar
              </button>
            </div>

            {/* Lista de Negócios */}
            <div className="mt-6 divide-y divide-gray-100">
              {negocios.map(negocio => (
                <div key={negocio.id} className="py-4 flex items-center justify-between">
                  {editandoId === negocio.id ? (
                    <input
                      className="flex-1 px-2 py-1 border border-blue-400 rounded outline-none"
                      value={nomeEdicao}
                      onChange={e => setNomeEdicao(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="text-gray-700 font-medium">{negocio.nome}</span>
                  )}

                  <div className="flex items-center gap-2 ml-4">
                    {editandoId === negocio.id ? (
                      <>
                        <button onClick={() => handleUpdateNegocio(negocio.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-full">
                          <Save size={18} />
                        </button>
                        <button onClick={() => setEditandoId(null)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full">
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setEditandoId(negocio.id); setNomeEdicao(negocio.nome); }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteNegocio(negocio.id)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}