import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom'; 
import { 
  Trash2, Truck, 
  ChevronDown, ChevronUp, Tag, Eye
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
  const [ordenacao, setOrdenacao] = useState('nome-asc');

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

  const fornecedoresFiltrados = fornecedores
    .filter(f => f.nome.toLowerCase().includes(filtro.toLowerCase()) || f.categoria.toLowerCase().includes(filtro.toLowerCase()))
    .sort((a, b) => {
      const [campo, ordem] = ordenacao.split('-');
      let valorA = campo === 'nome' ? a.nome.toLowerCase() : a.categoria.toLowerCase();
      let valorB = campo === 'nome' ? b.nome.toLowerCase() : b.categoria.toLowerCase();
      return ordem === 'asc' ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA);
    });

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 -mt-8 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-5">
          
          {/* HEADER E FILTROS */}
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50"><Truck size={22} /></div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black uppercase tracking-tight text-gray-100">Meus Parceiros</h2>
                <div className="px-2.5 py-1 bg-emerald-950/30 border border-emerald-900/50 rounded-md"><span className="text-[10px] font-black text-emerald-400">{fornecedoresFiltrados.length} REGISTROS</span></div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <input type="text" placeholder="Localizar..." className="flex-1 lg:w-64 p-3 bg-gray-950 border border-gray-800 rounded-md text-sm text-white placeholder-gray-600 focus:border-emerald-600 outline-none" value={filtro} onChange={e => setFiltro(e.target.value)} />
              <select className="p-3 bg-gray-950 border border-gray-800 rounded-md text-sm text-gray-400 outline-none cursor-pointer" value={ordenacao} onChange={e => setOrdenacao(e.target.value)}>
                <option value="nome-asc">Nome A-Z</option>
                <option value="nome-desc">Nome Z-A</option>
                <option value="categoria-asc">Cat. A-Z</option>
              </select>
            </div>
          </div>

          {/* CADASTRO RETRÁTIL */}
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <button onClick={() => setFormAberto(!formAberto)} className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2"><Tag size={16} className="text-emerald-400" /><span className="text-xs font-black uppercase tracking-wider">Novo Parceiro</span></div>
              {formAberto ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
            {formAberto && (
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input className="p-3 bg-gray-950 border border-gray-800 rounded-md text-sm text-white" value={novoFornecedor.nome} onChange={e => setNovoFornecedor({...novoFornecedor, nome: e.target.value})} placeholder="Nome / Empresa" />
                  <input className="p-3 bg-gray-950 border border-gray-800 rounded-md text-sm text-white" value={novoFornecedor.telefone} onChange={e => setNovoFornecedor({...novoFornecedor, telefone: e.target.value})} placeholder="Telefone" />
                  <input className="p-3 bg-gray-950 border border-gray-800 rounded-md text-sm text-white" value={novoFornecedor.categoria} onChange={e => setNovoFornecedor({...novoFornecedor, categoria: e.target.value})} placeholder="Categoria" />
                </div>
                <button onClick={handleAddFornecedor} className="w-full bg-emerald-600 py-3 rounded-md font-black text-xs uppercase text-white">Salvar Parceiro</button>
              </div>
            )}
          </div>

          {/* LISTA DE FORNECEDORES (PADRÃO CLIENTES) */}
          <div className="flex flex-col gap-2.5">
            {fornecedoresFiltrados.map(f => (
              <div key={f.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center justify-between hover:border-gray-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center font-black border border-emerald-900/50">{f.nome.charAt(0).toUpperCase()}</div>
                  <div>
                    <h4 className="text-sm font-black text-gray-200 uppercase tracking-tight">{f.nome}</h4>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase mt-1"><Tag size={10} className="text-emerald-500/70"/> {f.categoria}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/fornecedores/${f.id}`} className="p-2 text-gray-500 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-md border border-transparent hover:border-emerald-900/50"><Eye size={16}/></Link>
                  <button onClick={() => handleDeleteFornecedor(f.id)} className="p-2 text-red-400 bg-red-950/40 border border-red-900 rounded-md"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}