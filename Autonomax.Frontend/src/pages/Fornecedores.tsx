import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom'; 
import { 
  Trash2, Truck, 
  ChevronDown, ChevronUp, Tag, Eye, Edit3
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

  async function handleUpdateFornecedor() {
    if (!fornecedorEdicao || !currentNegocioId) return;
    try {
      await api.put(`/Fornecedores/${fornecedorEdicao.id}`, { ...fornecedorEdicao, negocioId: Number(currentNegocioId) });
      setFornecedorEdicao(null);
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
        
        {/* MODAL DE EDIÇÃO */}
        {fornecedorEdicao && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 w-full max-w-md space-y-4">
              <h3 className="font-black uppercase text-sm text-gray-300">Editar Parceiro</h3>
              <input className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md text-sm" value={fornecedorEdicao.nome} onChange={e => setFornecedorEdicao({...fornecedorEdicao, nome: e.target.value})} />
              <input className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md text-sm" value={fornecedorEdicao.telefone} onChange={e => setFornecedorEdicao({...fornecedorEdicao, telefone: e.target.value})} />
              <input className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md text-sm" value={fornecedorEdicao.categoria} onChange={e => setFornecedorEdicao({...fornecedorEdicao, categoria: e.target.value})} />
              <div className="flex gap-2">
                <button onClick={() => setFornecedorEdicao(null)} className="flex-1 bg-gray-800 py-2 rounded text-xs font-black">CANCELAR</button>
                <button onClick={handleUpdateFornecedor} className="flex-1 bg-emerald-600 py-2 rounded text-xs font-black">SALVAR</button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-5">
          {/* HEADER E FILTROS */}
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50"><Truck size={22} /></div>
              <h2 className="text-lg font-black uppercase tracking-tight">Meus Parceiros</h2>
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <input type="text" placeholder="Localizar..." className="flex-1 p-3 bg-gray-950 border border-gray-800 rounded-md text-sm" value={filtro} onChange={e => setFiltro(e.target.value)} />
            </div>
          </div>

          {/* LISTA */}
          <div className="flex flex-col gap-2.5">
            {fornecedoresFiltrados.map(f => (
              <div key={f.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-gray-200 uppercase">{f.nome}</h4>
                  <span className="text-[10px] text-gray-500 uppercase">{f.categoria}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setFornecedorEdicao(f)} className="p-2 text-emerald-400 hover:bg-emerald-950/40 rounded-md"><Edit3 size={16}/></button>
                  <Link to={`/fornecedores/${f.id}`} className="p-2 text-gray-500 hover:text-emerald-400"><Eye size={16}/></Link>
                  <button onClick={() => handleDeleteFornecedor(f.id)} className="p-2 text-red-400"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}