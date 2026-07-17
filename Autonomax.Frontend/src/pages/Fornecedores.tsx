import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom'; 
import { 
  Trash2, Edit3, Save, X, Truck, Phone, 
  Search, Eye, ArrowDownWideNarrow, Contact2, 
  ChevronDown, ChevronUp, Tag
} from 'lucide-react';
import api from '../services/api';

interface Fornecedor {
  id: number;
  nome: string;
  telefone: string;
  categoria: string;
  observacoes: string;
  negocioId: number;
  totalGasto?: number;         
  qtdLancamentos?: number;     
  ultimaMovimentacao?: string; 
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
      await api.delete(`Fornecedores/${id}`);
      carregarFornecedores();
    } catch (err) { alert("Erro ao excluir."); }
  }

  const fornecedoresFiltrados = fornecedores
    .filter(f => f.nome.toLowerCase().includes(filtro.toLowerCase()) || f.categoria.toLowerCase().includes(filtro.toLowerCase()))
    .sort((a, b) => {
      const [campo, ordem] = ordenacao.split('-');
      let valorA: string | number = '';
      let valorB: string | number = '';

      if (campo === 'faturamento') {
        valorA = a.totalGasto || 0;
        valorB = b.totalGasto || 0;
      } else if (campo === 'pedidos') {
        valorA = a.qtdLancamentos || 0;
        valorB = b.qtdLancamentos || 0;
      } else if (campo === 'atividade') {
        valorA = a.ultimaMovimentacao && !a.ultimaMovimentacao.startsWith('0001') ? new Date(a.ultimaMovimentacao).getTime() : 0;
        valorB = b.ultimaMovimentacao && !b.ultimaMovimentacao.startsWith('0001') ? new Date(b.ultimaMovimentacao).getTime() : 0;
      } else {
        valorA = a.nome.toLowerCase();
        valorB = b.nome.toLowerCase();
      }

      if (valorA < valorB) return ordem === 'asc' ? -1 : 1;
      if (valorA > valorB) return ordem === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <Layout>
      {/* Removido o "-mt-8" e ajustado o padding top para criar respiro abaixo do header */}
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-5">
          
          {/* PAINEL DE CONTROLE (BUSCA E ORDENAÇÃO) INTRODUTÓRIO */}
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50 hidden md:flex">
                <Truck size={22} />
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black tracking-tight uppercase text-gray-100 whitespace-nowrap">Meus Parceiros</h2>
                <div className="px-2.5 py-1 bg-emerald-950/30 border border-emerald-900/50 rounded-md flex items-center justify-center">
                  <span className="text-[10px] font-black text-emerald-400 tracking-wider">
                    {fornecedoresFiltrados.length} {fornecedoresFiltrados.length === 1 ? 'REGISTRO' : 'REGISTROS'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto flex-1 justify-end">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text"
                  placeholder="Localizar parceiro ou categoria..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-md text-sm outline-none focus:border-emerald-600 text-white placeholder-gray-600 transition-all font-medium"
                  value={filtro}
                  onChange={e => setFiltro(e.target.value)}
                />
              </div>

              <div className="relative w-full md:w-auto flex items-center bg-gray-950 border border-gray-800 rounded-md px-3 py-3 focus-within:border-emerald-600 transition-all">
                <ArrowDownWideNarrow size={16} className="text-gray-500 mr-2 flex-shrink-0" />
                <select 
                  className="bg-transparent border-none outline-none text-gray-300 text-sm font-medium w-full cursor-pointer appearance-none"
                  value={ordenacao}
                  onChange={e => setOrdenacao(e.target.value)}
                >
                  <optgroup label=" Ordem Alfabética" className="bg-gray-900 text-gray-300">
                    <option value="nome-asc">Nome (A - Z)</option>
                    <option value="nome-desc">Nome (Z - A)</option>
                  </optgroup>
                  <optgroup label=" Gasto Acumulado" className="bg-gray-900 text-gray-300">
                    <option value="faturamento-desc">Maior Gasto</option>
                    <option value="faturamento-asc">Menor Gasto</option>
                  </optgroup>
                  <optgroup label=" Volume de Compras" className="bg-gray-900 text-gray-300">
                    <option value="pedidos-desc">Mais Lançamentos</option>
                    <option value="pedidos-asc">Menos Lançamentos</option>
                  </optgroup>
                  <optgroup label=" Atividade" className="bg-gray-900 text-gray-300">
                    <option value="atividade-desc">Atividade Mais Recente</option>
                    <option value="atividade-asc">Atividade Mais Antiga</option>
                  </optgroup>
                </select>
                <ChevronDown size={14} className="text-gray-500 ml-2 flex-shrink-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* CADASTRO RETRÁTIL */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <button onClick={() => setFormAberto(!formAberto)} className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-none outline-none cursor-pointer border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Contact2 size={18} className="text-emerald-400" />
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-wider">Novo Cadastro</h3>
              </div>
              {formAberto ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            
            {formAberto && (
              <div className="p-5 md:p-6 space-y-3 bg-gray-900 animate-in slide-in-from-top duration-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm transition-all" value={novoFornecedor.nome} onChange={e => setNovoFornecedor({...novoFornecedor, nome: e.target.value})} placeholder="Nome do Fornecedor / Empresa" />
                  <input className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm transition-all" value={novoFornecedor.telefone} onChange={e => setNovoFornecedor({...novoFornecedor, telefone: e.target.value})} placeholder="WhatsApp / Telefone" />
                  <input className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm transition-all" value={novoFornecedor.categoria} onChange={e => setNovoFornecedor({...novoFornecedor, categoria: e.target.value})} placeholder="Categoria (Ex: Equipamentos)" />
                </div>
                
                <textarea rows={2} className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm resize-none transition-all" value={novoFornecedor.observacoes} onChange={e => setNovoFornecedor({...novoFornecedor, observacoes: e.target.value})} placeholder="Observações e detalhes importantes..." />

                <button onClick={handleAddFornecedor} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-md font-black uppercase tracking-wider text-xs border border-emerald-700 cursor-pointer flex items-center justify-center transition-all mt-2">
                  Confirmar Cadastro
                </button>
              </div>
            )}
          </div>

          {/* LEGENDA DE IDENTIFICAÇÃO RÁPIDA */}
          <div className="flex flex-wrap items-center gap-6 px-5 py-3 bg-gray-900/40 rounded-lg border border-dashed border-gray-800">
             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500/80 border border-blue-500"></div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Última Atividade</span></div>
             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-orange-500/80 border border-orange-500"></div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qtd. Lançamentos</span></div>
             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-red-500/80 border border-red-500"></div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gasto Total</span></div>
          </div>

          {/* LISTA DE FORNECEDORES */}
          <div className="flex flex-col gap-2.5">
            {fornecedoresFiltrados.length === 0 ? (
              <div className="bg-gray-900 p-12 rounded-xl border border-dashed border-gray-800 text-center">
                <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Nenhum parceiro atende aos critérios atuais.</p>
              </div>
            ) : (
              fornecedoresFiltrados.map(f => (
                <div key={f.id} className="bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-all p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* IDENTIFICAÇÃO */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 text-gray-400 flex items-center justify-center font-black text-lg border border-gray-700">
                      {f.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="font-black text-gray-200 uppercase text-sm tracking-tight truncate">
                        {f.nome}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase mt-0.5">
                        <span className="flex items-center gap-1"><Phone size={10} className="text-emerald-500/70"/> {f.telefone || 'Sem Contato'}</span>
                        <span className="text-gray-700">•</span>
                        <span className="flex items-center gap-1"><Tag size={10} className="text-blue-500/70"/> {f.categoria || 'Geral'}</span>
                      </div>
                    </div>
                  </div>

                  {/* METADADOS ANALÍTICOS (PILLS) */}
                  <div className="flex items-center justify-between md:justify-end gap-3 md:gap-6">
                    <div className="flex items-center gap-2 bg-blue-950/30 px-3 py-1.5 rounded-md border border-blue-900/50" title="Dias desde o último lançamento">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span className="text-[11px] font-black text-blue-400 uppercase">{calcularDias(f.ultimaMovimentacao)}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-orange-950/30 px-3 py-1.5 rounded-md border border-orange-900/50" title="Quantidade total de lançamentos">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <span className="text-[11px] font-black text-orange-400">{f.qtdLancamentos || 0}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-red-950/30 px-3 py-1.5 rounded-md border border-red-900/50" title="Gasto total">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                      <span className="text-[11px] font-black text-red-400">
                        { (f.totalGasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 }) }
                      </span>
                    </div>

                    {/* AÇÕES */}
                    <div className="flex items-center gap-1 ml-2">
                      <Link to={`/fornecedores/${f.id}`} className="p-2 text-gray-500 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-md transition-all border border-transparent hover:border-emerald-900/50">
                        <Eye size={16} />
                      </Link>
                      <button onClick={() => { setEditandoId(f.id); setFornecedorEdicao(f); }} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-950/40 rounded-md transition-all border border-transparent hover:border-blue-900/50 cursor-pointer bg-transparent">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDeleteFornecedor(f.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-950/40 rounded-md transition-all border border-transparent hover:border-red-900/50 cursor-pointer bg-transparent">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO ESCURO */}
      {editandoId && fornecedorEdicao && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-gray-900 w-full md:max-w-2xl h-[95vh] md:h-auto md:max-h-[95vh] rounded-t-lg md:rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-800 animate-in slide-in-from-bottom md:zoom-in duration-200">
            <div className="bg-gray-950 px-6 py-5 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-400"/>
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-widest">Ajustar Parceiro</h3>
              </div>
              <button onClick={() => setEditandoId(null)} className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer p-1 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-6 md:p-8 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" value={fornecedorEdicao.nome} onChange={e => setFornecedorEdicao({...fornecedorEdicao, nome: e.target.value})} placeholder="Nome" />
                <input className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" value={fornecedorEdicao.telefone} onChange={e => setFornecedorEdicao({...fornecedorEdicao, telefone: e.target.value})} placeholder="Celular / Telefone" />
              </div>
              <input className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" value={fornecedorEdicao.categoria} onChange={e => setFornecedorEdicao({...fornecedorEdicao, categoria: e.target.value})} placeholder="Categoria (Ex: Equipamentos)" />
              <textarea className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium resize-none outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" rows={3} value={fornecedorEdicao.observacoes} onChange={e => setFornecedorEdicao({...fornecedorEdicao, observacoes: e.target.value})} placeholder="Observações..." />
              
              <button onClick={() => handleUpdateFornecedor(fornecedorEdicao.id)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 mt-2 rounded-md font-black uppercase text-xs tracking-wider border border-emerald-700 cursor-pointer flex items-center justify-center gap-2 transition-all">
                Salvar Alterações <Save size={16}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}