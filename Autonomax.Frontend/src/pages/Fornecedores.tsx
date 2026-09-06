import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom'; 
import { 
  Trash2, Edit3, Save, X, Truck, Phone, 
  Search, Eye, EyeOff, ArrowDownWideNarrow, Contact2, 
  ChevronDown, ChevronUp, Tag, Receipt, 
  DollarSign, Activity, Plus
} from 'lucide-react';
import api from '../services/api';

interface Fornecedor {
  id: number;
  nome: string;
  telefone: string;
  categoria: string;
  observacoes: string;
  negocioId: number;
  dataCriacao?: string;
  totalGasto?: number;         
  qtdLancamentos?: number;     
  ultimaMovimentacao?: string; 
}

export function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [mostrarKpis, setMostrarKpis] = useState(false);
  const [novoFornecedor, setNovoFornecedor] = useState({ 
    nome: '', telefone: '', categoria: '', observacoes: '' 
  });
  
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [fornecedorEdicao, setFornecedorEdicao] = useState<Fornecedor | null>(null);
  
  const [filtro, setFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState('nome-asc');
  const [carregando, setCarregando] = useState(false);

  const currentNegocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  useEffect(() => { carregarFornecedores(); }, [currentNegocioId]);

  async function carregarFornecedores() {
    if (!currentNegocioId) return;
    setCarregando(true);
    try {
      const response = await api.get(`/Fornecedores/por-negocio/${currentNegocioId}`);
      setFornecedores(response.data || []);
    } catch (err) { 
      console.error("Erro ao carregar parceiros:", err); 
    } finally {
      setCarregando(false);
    }
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
    if (diffDays === 1) return 'Ontem';
    return `${diffDays}d atrás`;
  };

  async function handleAddFornecedor() {
    if (!novoFornecedor.nome.trim() || !currentNegocioId) {
      alert("Por favor, preencha o nome do parceiro.");
      return;
    }
    try {
      await api.post('/Fornecedores', { ...novoFornecedor, negocioId: Number(currentNegocioId) });
      setNovoFornecedor({ nome: '', telefone: '', categoria: '', observacoes: '' });
      setFormAberto(false);
      carregarFornecedores();
    } catch (err) { 
      alert("Erro ao cadastrar parceiro."); 
    }
  }

  async function handleUpdateFornecedor(id: number) {
    if (!fornecedorEdicao || !currentNegocioId) return;
    try {
      await api.put(`/Fornecedores/${id}`, { ...fornecedorEdicao, id, negocioId: Number(currentNegocioId) });
      setEditandoId(null);
      carregarFornecedores();
    } catch (err) { 
      alert("Erro ao atualizar parceiro."); 
    }
  }

  async function handleDeleteFornecedor(id: number) {
    if (!confirm("Tem certeza que deseja excluir este parceiro?")) return;
    try {
      await api.delete(`Fornecedores/${id}`);
      carregarFornecedores();
    } catch (err) { 
      alert("Erro ao excluir parceiro."); 
    }
  }

  // Estatísticas calculadas dinamicamente
  const metricas = useMemo(() => {
    const totalParceiros = fornecedores.length;
    const gastoAcumulado = fornecedores.reduce((acc, f) => acc + (f.totalGasto || 0), 0);
    const lancamentosTotais = fornecedores.reduce((acc, f) => acc + (f.qtdLancamentos || 0), 0);
    const ativos = fornecedores.filter(f => (f.qtdLancamentos || 0) > 0).length;

    return {
      totalParceiros,
      gastoAcumulado,
      lancamentosTotais,
      ativos
    };
  }, [fornecedores]);

  // Filtro e Ordenação
  const fornecedoresFiltrados = useMemo(() => {
    const termo = filtro.trim().toLowerCase();
    return fornecedores
      .filter(f => {
        if (!termo) return true;
        const nomeMatch = f.nome?.toLowerCase().includes(termo);
        const catMatch = f.categoria?.toLowerCase().includes(termo);
        const telMatch = f.telefone?.toLowerCase().includes(termo);
        const obsMatch = f.observacoes?.toLowerCase().includes(termo);
        return nomeMatch || catMatch || telMatch || obsMatch;
      })
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
          valorA = a.ultimaMovimentacao && !a.ultimaMovimentacao.startsWith('0001') 
            ? new Date(a.ultimaMovimentacao).getTime() 
            : 0;
          valorB = b.ultimaMovimentacao && !b.ultimaMovimentacao.startsWith('0001') 
            ? new Date(b.ultimaMovimentacao).getTime() 
            : 0;
        } else {
          valorA = (a.nome || '').toLowerCase();
          valorB = (b.nome || '').toLowerCase();
        }

        if (valorA < valorB) return ordem === 'asc' ? -1 : 1;
        if (valorA > valorB) return ordem === 'asc' ? 1 : -1;
        return 0;
      });
  }, [fornecedores, filtro, ordenacao]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-5">
          
          {/* PAINEL DE CONTROLE (BUSCA E ORDENAÇÃO) */}
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black tracking-tight uppercase text-gray-100 whitespace-nowrap">Meus Parceiros</h2>
                <div className="px-2.5 py-1 bg-emerald-950/30 border border-emerald-900/50 rounded-md flex items-center justify-center">
                  <span className="text-[10px] font-black text-emerald-400 tracking-wider">
                    {fornecedoresFiltrados.length} {fornecedoresFiltrados.length === 1 ? 'REGISTRO' : 'REGISTROS'}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => setMostrarKpis(!mostrarKpis)} 
                  className={`p-2 rounded-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                    mostrarKpis 
                      ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400 hover:bg-emerald-900/50' 
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                  }`}
                  title={mostrarKpis ? "Ocultar Indicadores (KPIs)" : "Revelar Indicadores (KPIs)"}
                >
                  {mostrarKpis ? <EyeOff size={15} /> : <Eye size={15} />}
                  <span className="text-[10px] font-black uppercase hidden sm:inline">
                    {mostrarKpis ? "Ocultar KPIs" : "Ver KPIs"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto flex-1 justify-end">
              {/* Campo de Busca */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text"
                  placeholder="Localizar por nome, categoria ou contato..."
                  className="w-full pl-11 pr-9 py-3 bg-gray-950 border border-gray-800 rounded-md text-sm outline-none focus:border-emerald-600 text-white placeholder-gray-600 transition-all font-medium"
                  value={filtro}
                  onChange={e => setFiltro(e.target.value)}
                />
                {filtro && (
                  <button 
                    onClick={() => setFiltro('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 bg-transparent border-none cursor-pointer p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Seletor de Ordenação */}
              <div className="relative w-full md:w-auto flex items-center bg-gray-950 border border-gray-800 rounded-md px-3 py-3 focus-within:border-emerald-600 transition-all">
                <ArrowDownWideNarrow size={16} className="text-gray-500 mr-2 flex-shrink-0" />
                <select 
                  className="bg-transparent border-none outline-none text-gray-300 text-sm font-medium w-full cursor-pointer appearance-none"
                  value={ordenacao}
                  onChange={e => setOrdenacao(e.target.value)}
                >
                  <optgroup label="Ordem Alfabética" className="bg-gray-900 text-gray-300">
                    <option value="nome-asc">Nome (A - Z)</option>
                    <option value="nome-desc">Nome (Z - A)</option>
                  </optgroup>
                  <optgroup label="Gasto Acumulado" className="bg-gray-900 text-gray-300">
                    <option value="faturamento-desc">Maior Gasto</option>
                    <option value="faturamento-asc">Menor Gasto</option>
                  </optgroup>
                  <optgroup label="Volume de Lançamentos" className="bg-gray-900 text-gray-300">
                    <option value="pedidos-desc">Mais Lançamentos</option>
                    <option value="pedidos-asc">Menos Lançamentos</option>
                  </optgroup>
                  <optgroup label="Atividade" className="bg-gray-900 text-gray-300">
                    <option value="atividade-desc">Atividade Mais Recente</option>
                    <option value="atividade-asc">Atividade Mais Antiga</option>
                  </optgroup>
                </select>
                <ChevronDown size={14} className="text-gray-500 ml-2 flex-shrink-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* RESUMO DE INDICADORES (KPIS) - REVELADO PELO OLHINHO */}
          {mostrarKpis && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
              {/* Total Parceiros */}
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
                <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50">
                  <Truck size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Parceiros Cadastrados</p>
                  <p className="text-xl font-black text-white">{metricas.totalParceiros}</p>
                </div>
              </div>

              {/* Gasto Total com Parceiros */}
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
                <div className="p-3 bg-red-950/50 text-red-400 rounded-lg border border-red-900/50">
                  <DollarSign size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gasto Total Acumulado</p>
                  <p className="text-xl font-black text-red-400">
                    R$ {metricas.gastoAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Total Lançamentos */}
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
                <div className="p-3 bg-orange-950/50 text-orange-400 rounded-lg border border-orange-900/50">
                  <Receipt size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lançamentos / Compras</p>
                  <p className="text-xl font-black text-orange-400">{metricas.lancamentosTotais}</p>
                </div>
              </div>

              {/* Parceiros com Movimentação */}
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
                <div className="p-3 bg-blue-950/50 text-blue-400 rounded-lg border border-blue-900/50">
                  <Activity size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Parceiros Ativos</p>
                  <p className="text-xl font-black text-blue-400">{metricas.ativos}</p>
                </div>
              </div>
            </div>
          )}

          {/* CADASTRO RETRÁTIL */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <button 
              onClick={() => setFormAberto(!formAberto)} 
              className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between hover:bg-gray-800/80 transition-colors border-none outline-none cursor-pointer border-b border-gray-800"
            >
              <div className="flex items-center gap-2">
                <Contact2 size={18} className="text-emerald-400" />
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-wider">Novo Cadastro de Parceiro</h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span>{formAberto ? 'Fechar' : 'Cadastrar'}</span>
                {formAberto ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </button>
            
            {formAberto && (
              <div className="p-5 md:p-6 space-y-3 bg-gray-900 animate-in slide-in-from-top duration-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input 
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm transition-all" 
                    value={novoFornecedor.nome} 
                    onChange={e => setNovoFornecedor({...novoFornecedor, nome: e.target.value})} 
                    placeholder="Nome do Fornecedor / Empresa *" 
                  />
                  <input 
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm transition-all" 
                    value={novoFornecedor.telefone} 
                    onChange={e => setNovoFornecedor({...novoFornecedor, telefone: e.target.value})} 
                    placeholder="WhatsApp / Telefone" 
                  />
                  <input 
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm transition-all" 
                    value={novoFornecedor.categoria} 
                    onChange={e => setNovoFornecedor({...novoFornecedor, categoria: e.target.value})} 
                    placeholder="Categoria (Ex: Equipamentos, Insumos, Serviços)" 
                  />
                </div>
                
                <textarea 
                  rows={2} 
                  className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm resize-none transition-all" 
                  value={novoFornecedor.observacoes} 
                  onChange={e => setNovoFornecedor({...novoFornecedor, observacoes: e.target.value})} 
                  placeholder="Observações, chave pix, prazos de entrega ou detalhes importantes..." 
                />

                <button 
                  onClick={handleAddFornecedor} 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-md font-black uppercase tracking-wider text-xs border border-emerald-700 cursor-pointer flex items-center justify-center gap-2 transition-all mt-2"
                >
                  <Plus size={16} /> Confirmar Cadastro
                </button>
              </div>
            )}
          </div>

          {/* LEGENDA DE IDENTIFICAÇÃO RÁPIDA */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 bg-gray-900/40 rounded-lg border border-dashed border-gray-800">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2" title="Tempo decorrido desde a última despesa lançada">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/80 border border-blue-500"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Última Atividade</span>
              </div>
              <div className="flex items-center gap-2" title="Número total de notas/lançamentos vinculados">
                <div className="w-2.5 h-2.5 rounded-sm bg-orange-500/80 border border-orange-500"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qtd. Lançamentos</span>
              </div>
              <div className="flex items-center gap-2" title="Valor financeiro total já pago/gasto com este parceiro">
                <div className="w-2.5 h-2.5 rounded-sm bg-red-500/80 border border-red-500"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gasto Total Acumulado</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider hidden md:inline">
              Dados atualizados em tempo real
            </span>
          </div>

          {/* LISTA DE FORNECEDORES */}
          <div className="flex flex-col gap-2.5">
            {carregando ? (
              <div className="bg-gray-900 p-12 rounded-xl border border-gray-800 text-center">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Carregando parceiros...</p>
              </div>
            ) : fornecedoresFiltrados.length === 0 ? (
              <div className="bg-gray-900 p-12 rounded-xl border border-dashed border-gray-800 text-center">
                <Truck size={36} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-1">Nenhum parceiro encontrado</p>
                <p className="text-gray-600 text-xs font-medium">
                  {filtro ? "Tente ajustar os termos da sua pesquisa." : "Cadastre o seu primeiro fornecedor ou parceiro acima."}
                </p>
              </div>
            ) : (
              fornecedoresFiltrados.map(f => (
                <div 
                  key={f.id} 
                  className="bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 hover:bg-gray-900/90 transition-all p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  {/* IDENTIFICAÇÃO DO PARCEIRO */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-gray-800 text-emerald-400 flex items-center justify-center font-black text-lg border border-gray-700 flex-shrink-0">
                      {f.nome ? f.nome.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/fornecedores/${f.id}`} 
                          className="font-black text-gray-200 uppercase text-sm tracking-tight truncate hover:text-emerald-400 transition-colors"
                        >
                          {f.nome}
                        </Link>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-gray-400 uppercase mt-1">
                        <span className="flex items-center gap-1">
                          <Phone size={11} className="text-emerald-500/80" /> 
                          {f.telefone ? f.telefone : <span className="text-gray-600">Sem Contato</span>}
                        </span>
                        <span className="text-gray-700">•</span>
                        <span className="flex items-center gap-1">
                          <Tag size={11} className="text-blue-500/80" /> 
                          {f.categoria ? f.categoria : <span className="text-gray-600">Geral</span>}
                        </span>
                        {f.observacoes && (
                          <>
                            <span className="text-gray-700 hidden sm:inline">•</span>
                            <span className="text-gray-500 normal-case font-normal truncate max-w-[200px] hidden sm:inline" title={f.observacoes}>
                              {f.observacoes}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* METADADOS ANALÍTICOS (PILLS COM DADOS REAIS) */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-4">
                    {/* Última Atividade */}
                    <div 
                      className="flex items-center gap-2 bg-blue-950/30 px-3 py-1.5 rounded-md border border-blue-900/50" 
                      title={`Última atividade: ${f.ultimaMovimentacao ? new Date(f.ultimaMovimentacao).toLocaleDateString('pt-BR') : 'Sem registros'}`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span className="text-[11px] font-black text-blue-400 uppercase">
                        {calcularDias(f.ultimaMovimentacao)}
                      </span>
                    </div>

                    {/* Quantidade de Lançamentos */}
                    <div 
                      className="flex items-center gap-2 bg-orange-950/30 px-3 py-1.5 rounded-md border border-orange-900/50" 
                      title={`${f.qtdLancamentos || 0} lançamentos realizados com este parceiro`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <span className="text-[11px] font-black text-orange-400">
                        {f.qtdLancamentos || 0} {f.qtdLancamentos === 1 ? 'lanç.' : 'lanç.'}
                      </span>
                    </div>

                    {/* Gasto Total Acumulado */}
                    <div 
                      className="flex items-center gap-2 bg-red-950/30 px-3 py-1.5 rounded-md border border-red-900/50 min-w-[100px] justify-end" 
                      title="Valor total gasto com este parceiro"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                      <span className="text-[11px] font-black text-red-400">
                        R$ {(f.totalGasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* AÇÕES */}
                    <div className="flex items-center gap-1 ml-1 sm:ml-2">
                      <Link 
                        to={`/fornecedores/${f.id}`} 
                        className="p-2 text-gray-500 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-md transition-all border border-transparent hover:border-emerald-900/50"
                        title="Ver detalhes do parceiro"
                      >
                        <Eye size={16} />
                      </Link>
                      <button 
                        onClick={() => { setEditandoId(f.id); setFornecedorEdicao(f); }} 
                        className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-950/40 rounded-md transition-all border border-transparent hover:border-blue-900/50 cursor-pointer bg-transparent"
                        title="Editar parceiro"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteFornecedor(f.id)} 
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-950/40 rounded-md transition-all border border-transparent hover:border-red-900/50 cursor-pointer bg-transparent"
                        title="Excluir parceiro"
                      >
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
        <div className="fixed inset-0 bg-gray-950/70 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-gray-900 w-full md:max-w-2xl h-[95vh] md:h-auto md:max-h-[95vh] rounded-t-lg md:rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-800 animate-in slide-in-from-bottom md:zoom-in duration-200">
            <div className="bg-gray-950 px-6 py-5 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-400"/>
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-widest">Ajustar Parceiro</h3>
              </div>
              <button 
                onClick={() => setEditandoId(null)} 
                className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer p-1 transition-colors"
              >
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nome / Empresa</label>
                  <input 
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" 
                    value={fornecedorEdicao.nome} 
                    onChange={e => setFornecedorEdicao({...fornecedorEdicao, nome: e.target.value})} 
                    placeholder="Nome" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Telefone / WhatsApp</label>
                  <input 
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" 
                    value={fornecedorEdicao.telefone || ''} 
                    onChange={e => setFornecedorEdicao({...fornecedorEdicao, telefone: e.target.value})} 
                    placeholder="Celular / Telefone" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Categoria</label>
                <input 
                  className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" 
                  value={fornecedorEdicao.categoria || ''} 
                  onChange={e => setFornecedorEdicao({...fornecedorEdicao, categoria: e.target.value})} 
                  placeholder="Categoria (Ex: Equipamentos, Insumos)" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Observações</label>
                <textarea 
                  className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium resize-none outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" 
                  rows={3} 
                  value={fornecedorEdicao.observacoes || ''} 
                  onChange={e => setFornecedorEdicao({...fornecedorEdicao, observacoes: e.target.value})} 
                  placeholder="Observações..." 
                />
              </div>
              
              <button 
                onClick={() => handleUpdateFornecedor(fornecedorEdicao.id)} 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 mt-2 rounded-md font-black uppercase text-xs tracking-wider border border-emerald-700 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                Salvar Alterações <Save size={16}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}