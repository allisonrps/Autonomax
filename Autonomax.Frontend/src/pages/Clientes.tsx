import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom'; 
import { Trash2, Edit3, Save, X, Users, 
  Phone, Search, Contact2, Eye, 
  CheckCircle2, ChevronDown, ChevronUp 
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
  const [formAberto, setFormAberto] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ 
    nome: '', celular: '', endereco: '', cidade: '', estado: '', observacoes: '' 
  });
  
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [clienteEdicao, setClienteEdicao] = useState<Cliente | null>(null);
  const [filtro, setFiltro] = useState('');

  const currentNegocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  useEffect(() => { carregarClientes(); }, [currentNegocioId]);

  async function carregarClientes() {
    if (!currentNegocioId) return;
    try {
      const response = await api.get(`/Clientes/por-negocio/${currentNegocioId}`);
      setClientes(response.data);
    } catch (err) { console.error(err); }
  }

  async function handleAddCliente() {
    if (!novoCliente.nome.trim() || !currentNegocioId) return;
    try {
      await api.post('/Clientes', { ...novoCliente, negocioId: Number(currentNegocioId) });
      setNovoCliente({ nome: '', celular: '', endereco: '', cidade: '', estado: '', observacoes: '' });
      setFormAberto(false);
      carregarClientes();
    } catch (err) { alert("Erro ao cadastrar."); }
  }

  async function handleUpdateCliente(id: number) {
    if (!clienteEdicao || !currentNegocioId) return;
    try {
      await api.put(`/Clientes/${id}`, { ...clienteEdicao, id, negocioId: Number(currentNegocioId) });
      setEditandoId(null);
      carregarClientes();
    } catch (err) { alert("Erro ao atualizar."); }
  }

  async function handleDeleteCliente(id: number) {
    if (!confirm("Excluir este cliente?")) return;
    try {
      await api.delete(`Clientes/${id}`);
      carregarClientes();
    } catch (err) { alert("Erro ao excluir."); }
  }

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16 pt-8 px-4 font-sans">
        
{/* HEADER COM CONTADOR */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
  <div className="flex items-center gap-4">
    <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-100">
      <Users size={28} />
    </div>
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Meus Clientes</h2>
        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[25px] font-black uppercase tracking-widest shadow-sm">
          {clientesFiltrados.length}
        </span>
      </div>
      <p className="text-sm text-gray-500 font-medium mt-0.5">Sua rede de contatos organizada</p>
    </div>
  </div>

  <div className="relative w-full md:w-80">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
    <input 
      type="text"
      placeholder="Localizar cliente..."
      className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 shadow-xl shadow-emerald-50/20 font-bold transition-all"
      value={filtro}
      onChange={e => setFiltro(e.target.value)}
    />
  </div>
</div>

        {/* FORMULÁRIO DE CADASTRO RETRÁTIL */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <button onClick={() => setFormAberto(!formAberto)} className="w-full bg-emerald-50/50 px-8 py-5 border-b border-gray-100 flex items-center justify-between hover:bg-emerald-50 transition-colors border-none outline-none cursor-pointer">
            <div className="flex items-center gap-3"><Contact2 size={20} className="text-emerald-600" /><h3 className="text-xs font-black text-emerald-900 uppercase tracking-[0.2em]">Novo Cadastro</h3></div>
            {formAberto ? <ChevronUp size={20} className="text-emerald-600" /> : <ChevronDown size={20} className="text-emerald-600" />}
          </button>
          
          {formAberto && (
            <div className="p-8 space-y-6 animate-in slide-in-from-top duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} placeholder="Nome do Cliente" />
                <input className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm" value={novoCliente.celular} onChange={e => setNovoCliente({...novoCliente, celular: e.target.value})} placeholder="WhatsApp / Celular" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <input className="md:col-span-2 w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm" value={novoCliente.endereco} onChange={e => setNovoCliente({...novoCliente, endereco: e.target.value})} placeholder="Endereço" />
                <input className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm" value={novoCliente.cidade} onChange={e => setNovoCliente({...novoCliente, cidade: e.target.value})} placeholder="Cidade" />
                <input className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-black uppercase text-center text-sm" maxLength={2} value={novoCliente.estado} onChange={e => setNovoCliente({...novoCliente, estado: e.target.value})} placeholder="UF" />
              </div>
              <textarea rows={2} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm resize-none" value={novoCliente.observacoes} onChange={e => setNovoCliente({...novoCliente, observacoes: e.target.value})} placeholder="Observações..." />
              <button onClick={handleAddCliente} className="w-full bg-emerald-950 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 border-none cursor-pointer">Confirmar Cadastro <CheckCircle2 size={18} /></button>
            </div>
          )}
        </div>

        {/* GRID DE CARDS COMPACTOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {clientesFiltrados.map(cliente => (
            <div key={cliente.id} className="group bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all flex flex-col overflow-hidden relative">
              <div className="p-5 flex-1">
                {editandoId === cliente.id ? (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Edição</span>
                      <button onClick={() => setEditandoId(null)} className="text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer"><X size={16}/></button>
                    </div>
                    <input className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-emerald-500" value={clienteEdicao?.nome} onChange={e => setClienteEdicao({...clienteEdicao!, nome: e.target.value})} placeholder="Nome" />
                    <input className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-emerald-500" value={clienteEdicao?.celular} onChange={e => setClienteEdicao({...clienteEdicao!, celular: e.target.value})} placeholder="Celular" />
                    <input className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-emerald-500" value={clienteEdicao?.endereco} onChange={e => setClienteEdicao({...clienteEdicao!, endereco: e.target.value})} placeholder="Endereço" />
                    <div className="flex gap-2">
                      <input className="flex-1 p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-emerald-500" value={clienteEdicao?.cidade} onChange={e => setClienteEdicao({...clienteEdicao!, cidade: e.target.value})} placeholder="Cidade" />
                      <input className="w-12 p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black text-center uppercase outline-emerald-500" maxLength={2} value={clienteEdicao?.estado} onChange={e => setClienteEdicao({...clienteEdicao!, estado: e.target.value})} placeholder="UF" />
                    </div>
                    <textarea className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-emerald-500 resize-none" rows={2} value={clienteEdicao?.observacoes} onChange={e => setClienteEdicao({...clienteEdicao!, observacoes: e.target.value})} placeholder="Observações" />
                    <button onClick={() => handleUpdateCliente(cliente.id)} className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 border-none cursor-pointer">
                      <Save size={14}/> Salvar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm flex-shrink-0">
                        {cliente.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-gray-800 leading-tight truncate uppercase">{cliente.nome}</h4>
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] mt-0.5">
                          <Phone size={10} /> {cliente.celular}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {!editandoId && (
                <div className="flex bg-gray-50 border-t border-gray-100 p-2 gap-2">
                  <Link 
                    to={`/clientes/${cliente.id}`} 
                    className="flex-1 bg-white border border-gray-200 py-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center justify-center gap-2 no-underline"
                    title="Ver Histórico"
                  >
                    <Eye size={14} />
                  </Link>
                  <button 
                    onClick={() => { setEditandoId(cliente.id); setClienteEdicao(cliente); }}
                    className="flex-1 bg-white border border-gray-200 py-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                    title="Editar"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteCliente(cliente.id)}
                    className="flex-1 bg-white border border-gray-200 py-2 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}