import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom'; 
import { 
  Plus, Trash2, Edit3, Save, X, Users, 
  MapPin, Phone, Eye, Search,
  Contact2, ExternalLink, Building2
} from 'lucide-react';
import api from '../services/api';

interface Cliente {
  id: number;
  nome: string;
  celular: string;
  endereco: string;
  cidade: string;
  estado: string;
  observacoes: string;
  negocioId: number;
}

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [novoCliente, setNovoCliente] = useState({ 
    nome: '', 
    celular: '', 
    endereco: '', 
    cidade: '', 
    estado: '', 
    observacoes: '' 
  });
  
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [clienteEdicao, setClienteEdicao] = useState<Cliente | null>(null);
  const [filtro, setFiltro] = useState('');

  const currentNegocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  useEffect(() => {
    carregarClientes();
  }, [currentNegocioId]);

  async function carregarClientes() {
    if (!currentNegocioId) return;
    try {
      const response = await api.get(`/Clientes/por-negocio/${currentNegocioId}`);
      setClientes(response.data);
    } catch (err) {
      console.error("Erro ao buscar clientes.");
    }
  }

  async function handleAddCliente() {
    if (!novoCliente.nome.trim() || !currentNegocioId) return;
    try {
      await api.post('/Clientes', { 
        ...novoCliente, 
        negocioId: Number(currentNegocioId) 
      });
      setNovoCliente({ nome: '', celular: '', endereco: '', cidade: '', estado: '', observacoes: '' });
      carregarClientes();
    } catch (err) {
      alert("Erro ao cadastrar. Verifique se a Migration foi aplicada.");
    }
  }

  async function handleUpdateCliente(id: number) {
    if (!clienteEdicao || !currentNegocioId) return;
    try {
      await api.put(`/Clientes/${id}`, {
        ...clienteEdicao,
        id: id,
        negocioId: Number(currentNegocioId)
      });
      setEditandoId(null);
      carregarClientes();
    } catch (err) {
      alert("Erro ao atualizar.");
    }
  }

  async function handleDeleteCliente(id: number) {
    if (!confirm("Excluir este cliente?")) return;
    try {
      await api.delete(`Clientes/${id}`);
      carregarClientes();
    } catch (err) {
      alert("Erro ao excluir.");
    }
  }

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        
        {/* HEADER ESTILO ESTATÍSTICA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-100">
              <Users size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Gestão de Clientes</h2>
              <p className="text-sm text-gray-500 font-medium">Controle total da sua base de contatos</p>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Pesquisar cliente..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
          </div>
        </div>

        {/* FORMULÁRIO DE CADASTRO DETALHADO */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="bg-gray-50/80 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
            <Contact2 size={16} className="text-blue-600" />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ficha Cadastral</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nome Completo</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={novoCliente.nome}
                  onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})}
                  placeholder="Nome do cliente"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Celular / WhatsApp</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={novoCliente.celular}
                  onChange={e => setNovoCliente({...novoCliente, celular: e.target.value})}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Endereço</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={novoCliente.endereco}
                  onChange={e => setNovoCliente({...novoCliente, endereco: e.target.value})}
                  placeholder="Rua, Número"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Cidade</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={novoCliente.cidade}
                  onChange={e => setNovoCliente({...novoCliente, cidade: e.target.value})}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Estado (UF)</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium uppercase text-center"
                  maxLength={2}
                  value={novoCliente.estado}
                  onChange={e => setNovoCliente({...novoCliente, estado: e.target.value})}
                  placeholder="SP"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Observações do Cliente</label>
              <textarea
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none"
                value={novoCliente.observacoes}
                onChange={e => setNovoCliente({...novoCliente, observacoes: e.target.value})}
                placeholder="Preferências, avisos ou restrições..."
              />
            </div>

            <button 
              onClick={handleAddCliente}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
            >
              Cadastrar Cliente
            </button>
          </div>
        </div>

        {/* LISTAGEM DE CLIENTES */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50">
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  <th className="px-8 py-5">Perfil</th>
                  <th className="px-8 py-5">Localização e Contato</th>
                  <th className="px-8 py-5">Observações</th>
                  <th className="px-8 py-5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clientesFiltrados.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest italic">Nenhum cliente cadastrado</td></tr>
                ) : (
                  clientesFiltrados.map(cliente => (
                    <tr key={cliente.id} className="hover:bg-blue-50/20 transition-all group">
                      <td className="px-8 py-6">
                        {editandoId === cliente.id ? (
                          <input 
                            className="w-full p-2 border rounded-lg font-bold text-sm outline-blue-500"
                            value={clienteEdicao?.nome}
                            onChange={e => setClienteEdicao({...clienteEdicao!, nome: e.target.value})}
                          />
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">
                              {cliente.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-black text-gray-800 text-base">{cliente.nome}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {editandoId === cliente.id ? (
                          <div className="space-y-2">
                            <input className="w-full p-2 border rounded-lg text-xs" value={clienteEdicao?.celular} onChange={e => setClienteEdicao({...clienteEdicao!, celular: e.target.value})} />
                            <div className="flex gap-2">
                                <input className="flex-1 p-2 border rounded-lg text-xs" value={clienteEdicao?.cidade} onChange={e => setClienteEdicao({...clienteEdicao!, cidade: e.target.value})} />
                                <input className="w-16 p-2 border rounded-lg text-xs uppercase" maxLength={2} value={clienteEdicao?.estado} onChange={e => setClienteEdicao({...clienteEdicao!, estado: e.target.value})} />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                              <Phone size={14} className="text-gray-300" /> {cliente.celular}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                              <MapPin size={12} className="text-gray-300" /> 
                              {cliente.endereco} {cliente.cidade && `- ${cliente.cidade}/${cliente.estado}`}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 max-w-[200px]">
                        {editandoId === cliente.id ? (
                          <textarea className="w-full p-2 border rounded-lg text-xs" value={clienteEdicao?.observacoes} onChange={e => setClienteEdicao({...clienteEdicao!, observacoes: e.target.value})} />
                        ) : (
                          <p className="text-xs text-gray-500 italic truncate" title={cliente.observacoes}>
                            {cliente.observacoes || '---'}
                          </p>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center gap-2">
                          {editandoId === cliente.id ? (
                            <>
                              <button onClick={() => handleUpdateCliente(cliente.id)} className="p-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-all"><Save size={18}/></button>
                              <button onClick={() => setEditandoId(null)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-all"><X size={18}/></button>
                            </>
                          ) : (
                            <>
                              <Link to={`/clientes/${cliente.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Ver Histórico"><Eye size={20} /></Link>
                              <button onClick={() => { setEditandoId(cliente.id); setClienteEdicao(cliente); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Editar"><Edit3 size={18}/></button>
                              <button onClick={() => handleDeleteCliente(cliente.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Excluir"><Trash2 size={18}/></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}