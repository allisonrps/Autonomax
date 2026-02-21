import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom'; 
import { 
  Plus, Trash2, Edit3, Save, X, Users, 
  MapPin, Phone, Eye, Search,
  Contact2, ArrowRight, CheckCircle2
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
    nome: '', celular: '', endereco: '', cidade: '', estado: '', observacoes: '' 
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
      alert("Erro ao cadastrar.");
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
      <div className="max-w-6xl mx-auto space-y-8 pb-16 pt-8 px-4">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-100">
              <Users size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Meus Clientes</h2>
              <p className="text-sm text-gray-500 font-medium">Controle total da sua base de contatos</p>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Pesquisar cliente..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm font-medium"
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
          </div>
        </div>

        {/* FORMULÁRIO DE CADASTRO */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="bg-gray-50/80 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
            <Contact2 size={16} className="text-emerald-600" />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Nova Ficha Cadastral</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} placeholder="Nome Completo" />
              <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium" value={novoCliente.celular} onChange={e => setNovoCliente({...novoCliente, celular: e.target.value})} placeholder="Celular / WhatsApp" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <input className="md:col-span-2 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium" value={novoCliente.endereco} onChange={e => setNovoCliente({...novoCliente, endereco: e.target.value})} placeholder="Endereço (Rua, nº)" />
              <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium" value={novoCliente.cidade} onChange={e => setNovoCliente({...novoCliente, cidade: e.target.value})} placeholder="Cidade" />
              <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium uppercase text-center" maxLength={2} value={novoCliente.estado} onChange={e => setNovoCliente({...novoCliente, estado: e.target.value})} placeholder="UF" />
            </div>
            <textarea rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none" value={novoCliente.observacoes} onChange={e => setNovoCliente({...novoCliente, observacoes: e.target.value})} placeholder="Observações..." />
            <button onClick={handleAddCliente} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2">
              Salvar Cliente <CheckCircle2 size={16} />
            </button>
          </div>
        </div>

        {/* GRID DE CARDS COM EDIÇÃO COMPLETA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map(cliente => (
            <div key={cliente.id} className="group bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all flex flex-col overflow-hidden">
              <div className="p-6 flex-1">
                {editandoId === cliente.id ? (
                  // FORMULÁRIO DE EDIÇÃO DENTRO DO CARD
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Editando Perfil</span>
                      <button onClick={() => setEditandoId(null)} className="text-gray-400 hover:text-red-500"><X size={18}/></button>
                    </div>
                    <input className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm font-bold outline-emerald-500" value={clienteEdicao?.nome} onChange={e => setClienteEdicao({...clienteEdicao!, nome: e.target.value})} placeholder="Nome" />
                    <input className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm font-bold outline-emerald-500" value={clienteEdicao?.celular} onChange={e => setClienteEdicao({...clienteEdicao!, celular: e.target.value})} placeholder="Celular" />
                    <input className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm font-medium outline-emerald-500" value={clienteEdicao?.endereco} onChange={e => setClienteEdicao({...clienteEdicao!, endereco: e.target.value})} placeholder="Endereço" />
                    <div className="flex gap-2">
                      <input className="flex-1 p-2.5 bg-gray-50 border rounded-xl text-sm font-medium outline-emerald-500" value={clienteEdicao?.cidade} onChange={e => setClienteEdicao({...clienteEdicao!, cidade: e.target.value})} placeholder="Cidade" />
                      <input className="w-14 p-2.5 bg-gray-50 border rounded-xl text-sm font-black text-center uppercase outline-emerald-500" maxLength={2} value={clienteEdicao?.estado} onChange={e => setClienteEdicao({...clienteEdicao!, estado: e.target.value})} placeholder="UF" />
                    </div>
                    <textarea className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs font-medium outline-emerald-500 resize-none" rows={2} value={clienteEdicao?.observacoes} onChange={e => setClienteEdicao({...clienteEdicao!, observacoes: e.target.value})} placeholder="Observações" />
                    <button onClick={() => handleUpdateCliente(cliente.id)} className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-50 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                      <Save size={14}/> Atualizar Cadastro
                    </button>
                  </div>
                ) : (
                  // VISUALIZAÇÃO DO CARD
                  <>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                        {cliente.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditandoId(cliente.id); setClienteEdicao(cliente); }} className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"><Edit3 size={18} /></button>
                        <button onClick={() => handleDeleteCliente(cliente.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xl font-black text-gray-800 leading-tight">{cliente.nome}</h4>
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs mt-2 bg-emerald-50/50 w-fit px-2 py-1 rounded-lg">
                          <Phone size={12} /> {cliente.celular}
                        </div>
                      </div>
                      <div className="space-y-3 pt-4 border-t border-gray-50">
                        <div className="flex items-start gap-2 text-[11px] font-bold text-gray-400 leading-relaxed">
                          <MapPin size={12} className="mt-0.5 text-emerald-300" />
                          <span>{cliente.endereco}<br/>{cliente.cidade} - {cliente.estado}</span>
                        </div>
                        {cliente.observacoes && (
                          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 italic leading-relaxed line-clamp-3">"{cliente.observacoes}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {!editandoId && (
                <Link to={`/clientes/${cliente.id}`} className="w-full bg-gray-50 border-t border-gray-100 py-4 px-6 text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center justify-between group-hover:bg-emerald-950 group-hover:text-white transition-all">
                  Análise de Histórico <ArrowRight size={16} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}