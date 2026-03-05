import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom'; // Importado para permitir a navegação
import { 
  Trash2, Edit3, Save, X, Truck, 
  Phone, Search, CheckCircle2, ChevronDown, ChevronUp, Tag, Eye 
} from 'lucide-react';
import api from '../services/api';

interface Fornecedor {
  id: number;
  nome: string;
  telefone: string;
  categoria: string;
  observacoes: string;
  negocioId: number;
}

export function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [novoFornecedor, setNovoFornecedor] = useState({ 
    nome: '', telefone: '', categoria: '', observacoes: '' 
  });
  
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [fornecedorEdicao, setFornecedorEdicao] = useState<Fornecedor | null>(null);
  const [filtro, setFiltro] = useState('');

  const currentNegocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  useEffect(() => { carregarFornecedores(); }, [currentNegocioId]);

  async function carregarFornecedores() {
    if (!currentNegocioId) return;
    try {
      const response = await api.get(`/Fornecedores/por-negocio/${currentNegocioId}`);
      setFornecedores(response.data);
    } catch (err) { console.error("Erro ao buscar fornecedores:", err); }
  }

  async function handleAddFornecedor() {
    if (!novoFornecedor.nome.trim() || !currentNegocioId) return;
    try {
      await api.post('/Fornecedores', { ...novoFornecedor, negocioId: Number(currentNegocioId) });
      setNovoFornecedor({ nome: '', telefone: '', categoria: '', observacoes: '' });
      setFormAberto(false);
      carregarFornecedores();
    } catch (err) { alert("Erro ao cadastrar."); }
  }

  async function handleUpdateFornecedor(id: number) {
    if (!fornecedorEdicao || !currentNegocioId) return;
    try {
      await api.put(`/Fornecedores/${id}`, { ...fornecedorEdicao, id, negocioId: Number(currentNegocioId) });
      setEditandoId(null);
      carregarFornecedores();
    } catch (err) { alert("Erro ao atualizar."); }
  }

  async function handleDeleteFornecedor(id: number) {
    if (!confirm("Excluir este parceiro?")) return;
    try {
      await api.delete(`/Fornecedores/${id}`);
      carregarFornecedores();
    } catch (err) { alert("Erro ao excluir."); }
  }

  const fornecedoresFiltrados = fornecedores.filter(f => 
    f.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    f.categoria.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16 pt-8 px-4 font-sans">
        
        {/* HEADER COM CONTADOR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-100">
              <Truck size={28} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Parceiros</h2>
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[25px] font-black uppercase tracking-widest shadow-sm">
                  {fornecedoresFiltrados.length}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium mt-0.5">Gestão de fornecedores e prestadores</p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
            <input 
              type="text"
              placeholder="Localizar parceiro..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 shadow-xl shadow-emerald-50/20 font-bold transition-all"
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
          </div>
        </div>

        {/* FORMULÁRIO DE CADASTRO RETRÁTIL */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <button onClick={() => setFormAberto(!formAberto)} className="w-full bg-emerald-50/50 px-8 py-5 border-b border-gray-100 flex items-center justify-between hover:bg-emerald-50 transition-colors border-none outline-none cursor-pointer">
            <div className="flex items-center gap-3"><Tag size={20} className="text-emerald-600" /><h3 className="text-xs font-black text-emerald-900 uppercase tracking-[0.2em]">Novo Fornecedor</h3></div>
            {formAberto ? <ChevronUp size={20} className="text-emerald-600" /> : <ChevronDown size={20} className="text-emerald-600" />}
          </button>
          
          {formAberto && (
            <div className="p-8 space-y-6 animate-in slide-in-from-top duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input className="md:col-span-1 w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm" value={novoFornecedor.nome} onChange={e => setNovoFornecedor({...novoFornecedor, nome: e.target.value})} placeholder="Nome / Empresa" />
                <input className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm" value={novoFornecedor.telefone} onChange={e => setNovoFornecedor({...novoFornecedor, telefone: e.target.value})} placeholder="Telefone de Contato" />
                <input className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm" value={novoFornecedor.categoria} onChange={e => setNovoFornecedor({...novoFornecedor, categoria: e.target.value})} placeholder="Categoria (ex: Mercadoria)" />
              </div>
              <textarea rows={2} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm resize-none" value={novoFornecedor.observacoes} onChange={e => setNovoFornecedor({...novoFornecedor, observacoes: e.target.value})} placeholder="Observações..." />
              <button onClick={handleAddFornecedor} className="w-full bg-emerald-950 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 border-none cursor-pointer">Salvar Parceiro <CheckCircle2 size={18} /></button>
            </div>
          )}
        </div>

        {/* GRID DE CARDS COMPACTOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fornecedoresFiltrados.map(fornecedor => (
            <div key={fornecedor.id} className="group bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all flex flex-col overflow-hidden relative">
              <div className="p-5 flex-1">
                {editandoId === fornecedor.id ? (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Edição</span>
                      <button onClick={() => setEditandoId(null)} className="text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer"><X size={16}/></button>
                    </div>
                    <input className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-emerald-500" value={fornecedorEdicao?.nome} onChange={e => setFornecedorEdicao({...fornecedorEdicao!, nome: e.target.value})} placeholder="Nome" />
                    <input className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-emerald-500" value={fornecedorEdicao?.telefone} onChange={e => setFornecedorEdicao({...fornecedorEdicao!, telefone: e.target.value})} placeholder="Telefone" />
                    <input className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-emerald-500" value={fornecedorEdicao?.categoria} onChange={e => setFornecedorEdicao({...fornecedorEdicao!, categoria: e.target.value})} placeholder="Categoria" />
                    <textarea className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-emerald-500 resize-none" rows={2} value={fornecedorEdicao?.observacoes} onChange={e => setFornecedorEdicao({...fornecedorEdicao!, observacoes: e.target.value})} placeholder="Observações" />
                    <button onClick={() => handleUpdateFornecedor(fornecedor.id)} className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 border-none cursor-pointer">
                      <Save size={14}/> Salvar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm flex-shrink-0">
                        {fornecedor.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-gray-800 leading-tight truncate uppercase">{fornecedor.nome}</h4>
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] mt-0.5">
                          <Tag size={10} /> {fornecedor.categoria || 'Geral'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-50">
                       <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5">
                         <Phone size={10} /> {fornecedor.telefone || 'Sem telefone'}
                       </p>
                    </div>
                  </>
                )}
              </div>

              {!editandoId && (
                <div className="flex bg-gray-50 border-t border-gray-100 p-2 gap-2">
                  {/* ADICIONADO: Link para detalhes do fornecedor */}
                  <Link 
                    to={`/fornecedores/${fornecedor.id}`} 
                    className="flex-1 bg-white border border-gray-200 py-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center justify-center gap-2 no-underline"
                    title="Ver Histórico"
                  >
                    <Eye size={14} />
                  </Link>
                  <button 
                    onClick={() => { setEditandoId(fornecedor.id); setFornecedorEdicao(fornecedor); }}
                    className="flex-1 bg-white border border-gray-200 py-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                    title="Editar"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteFornecedor(fornecedor.id)}
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