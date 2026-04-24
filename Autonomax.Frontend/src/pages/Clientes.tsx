import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom'; 
import { 
  Trash2, Edit3, Save, X, Users, 
  Phone, Search, Contact2, Eye, 
  ChevronDown, ChevronUp,
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
  totalComprado?: number;
  qtdMovimentacoes?: number;
  ultimaMovimentacao?: string;
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

  const calcularDias = (dataISO: string | undefined) => {
    if (!dataISO || dataISO.startsWith('0001')) return '---';
    const data = new Date(dataISO);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataRef = new Date(data);
    dataRef.setHours(0, 0, 0, 0);
    const diffTime = hoje.getTime() - dataRef.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoje';
    return `${diffDays}d`;
  };

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
      <div className="max-w-6xl mx-auto space-y-6 pb-16 pt-8 px-4 font-sans text-gray-800">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-100">
              <Users size={28} />
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Meus Clientes</h2>
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

        {/* CADASTRO ULTRA CLEAN */}
        <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl overflow-hidden">
          <button onClick={() => setFormAberto(!formAberto)} className="w-full bg-emerald-50/50 px-8 py-5 flex items-center justify-between hover:bg-emerald-50 transition-colors border-none outline-none cursor-pointer">
            <div className="flex items-center gap-3">
              <Contact2 size={20} className="text-emerald-600" />
              <h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Novo Cadastro</h3>
            </div>
            {formAberto ? <ChevronUp size={20} className="text-emerald-600" /> : <ChevronDown size={20} className="text-emerald-600" />}
          </button>
          
          {formAberto && (
            <div className="p-8 space-y-4 animate-in slide-in-from-top duration-300 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} placeholder="Nome Completo" />
                <input className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm" value={novoCliente.celular} onChange={e => setNovoCliente({...novoCliente, celular: e.target.value})} placeholder="WhatsApp / Celular" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input className="md:col-span-2 w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm" value={novoCliente.endereco} onChange={e => setNovoCliente({...novoCliente, endereco: e.target.value})} placeholder="Endereço (Rua, nº, Bairro)" />
                <input className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm" value={novoCliente.cidade} onChange={e => setNovoCliente({...novoCliente, cidade: e.target.value})} placeholder="Cidade" />
                <input className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-black uppercase text-center text-sm" maxLength={2} value={novoCliente.estado} onChange={e => setNovoCliente({...novoCliente, estado: e.target.value})} placeholder="UF" />
              </div>

              <textarea rows={2} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm resize-none" value={novoCliente.observacoes} onChange={e => setNovoCliente({...novoCliente, observacoes: e.target.value})} placeholder="Observações e detalhes importantes..." />

              <button onClick={handleAddCliente} className="w-full bg-emerald-950 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-black shadow-2xl transition-all active:scale-95 border-none cursor-pointer">
                Confirmar Cadastro
              </button>
            </div>
          )}
        </div>

        {/* LEGENDA */}
        <div className="flex flex-wrap items-center gap-6 px-6 py-3 bg-white/50 rounded-2xl border border-dashed border-gray-200">
           <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Última Atividade</span></div>
           <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Total de Pedidos</span></div>
           <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Faturamento Acumulado</span></div>
        </div>

        {/* LISTA DE CLIENTES */}
        <div className="flex flex-col gap-3">
          {clientesFiltrados.map(cliente => (
            <div key={cliente.id} className="bg-white rounded-[28px] border border-gray-100 shadow-sm hover:border-emerald-200 transition-all p-4 md:px-8 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
              
              <div className="flex items-center gap-5 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center font-black text-lg group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                  {cliente.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <h4 className="font-black text-gray-800 uppercase text-sm tracking-tight truncate">
                    {cliente.nome}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase">
                    <Phone size={10} className="text-emerald-500"/> {cliente.celular}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 md:gap-8">
                <div className="flex items-center gap-2 bg-blue-50/50 px-4 py-2 rounded-full border border-blue-100/50" title="Dias desde a última compra">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-black text-blue-700">{calcularDias(cliente.ultimaMovimentacao)}</span>
                </div>

                <div className="flex items-center gap-2 bg-orange-50/50 px-4 py-2 rounded-full border border-orange-100/50" title="Quantidade total de pedidos">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-xs font-black text-orange-700">{cliente.qtdMovimentacoes || 0}</span>
                </div>

                <div className="flex items-center gap-2 bg-emerald-50/50 px-4 py-2 rounded-full border border-emerald-100/50" title="Faturamento total">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-black text-emerald-700">
                    { (cliente.totalComprado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 }) }
                  </span>
                </div>

                <div className="flex items-center gap-1 ml-4">
                  <Link to={`/clientes/${cliente.id}`} className="p-2 text-gray-300 hover:text-emerald-600 transition-colors"><Eye size={20} /></Link>
                  <button onClick={() => { setEditandoId(cliente.id); setClienteEdicao(cliente); }} className="p-2 text-gray-300 hover:text-blue-600 border-none bg-transparent cursor-pointer"><Edit3 size={18} /></button>
                  <button onClick={() => handleDeleteCliente(cliente.id)} className="p-2 text-gray-300 hover:text-red-500 border-none bg-transparent cursor-pointer"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE EDIÇÃO ULTRA CLEAN */}
      {editandoId && clienteEdicao && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z- flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-gray-50 px-8 py-6 flex justify-between items-center border-b border-gray-100">
              <div className="flex items-center gap-2"><Edit3 size={20} className="text-emerald-600"/><h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Ajustar Cadastro</h3></div>
              <button onClick={() => setEditandoId(null)} className="text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer"><X size={24}/></button>
            </div>
            
            <div className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={clienteEdicao.nome} onChange={e => setClienteEdicao({...clienteEdicao, nome: e.target.value})} placeholder="Nome" />
                <input className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={clienteEdicao.celular} onChange={e => setClienteEdicao({...clienteEdicao, celular: e.target.value})} placeholder="Celular" />
              </div>
              <input className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={clienteEdicao.endereco} onChange={e => setClienteEdicao({...clienteEdicao, endereco: e.target.value})} placeholder="Endereço Completo" />
              <div className="grid grid-cols-4 gap-4">
                <input className="col-span-3 w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={clienteEdicao.cidade} onChange={e => setClienteEdicao({...clienteEdicao, cidade: e.target.value})} placeholder="Cidade" />
                <input className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-center uppercase outline-none focus:ring-2 focus:ring-emerald-500" maxLength={2} value={clienteEdicao.estado} onChange={e => setClienteEdicao({...clienteEdicao, estado: e.target.value})} placeholder="UF" />
              </div>
              <textarea className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold resize-none outline-none focus:ring-2 focus:ring-emerald-500" rows={2} value={clienteEdicao.observacoes} onChange={e => setClienteEdicao({...clienteEdicao, observacoes: e.target.value})} placeholder="Observações" />
              
              <button onClick={() => handleUpdateCliente(clienteEdicao.id)} className="w-full bg-emerald-950 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-2 border-none cursor-pointer">
                Salvar Alterações <Save size={18}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}