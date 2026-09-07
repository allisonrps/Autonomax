import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Trash2, Edit3, Save, X, Search, 
  ArrowDownWideNarrow, Plus, Package, 
  Wrench, ChevronDown, ChevronUp,
  Boxes, Sparkles, Flame, CheckSquare, Square, 
  RefreshCw, CheckCircle2, ArrowRight, BarChart3,
  Eye, EyeOff, Tag, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { LoadingProgress } from '../components/LoadingProgress';

export interface ProdutoServico {
  id: number;
  nome: string;
  descricao?: string;
  categoria?: string;
  preco: number;
  ehServico: boolean;
  negocioId: number;
}

export interface ItemHistoricoSugestao {
  nome: string;
  ocorrencias: number;
  precoSugerido: number;
  categoria?: string;
  ehServico: boolean;
  jaCadastrado: boolean;
}

export interface ItemImportacao {
  nome: string;
  preco: string;
  categoria: string;
  ehServico: boolean;
  selecionado: boolean;
  ocorrencias: number;
}

export function Catalogo() {
  const [itens, setItens] = useState<ProdutoServico[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [mostrarKpis, setMostrarKpis] = useState(false);
  const [carregando, setCarregando] = useState(false);
  
  const [novoItem, setNovoItem] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    preco: '',
    ehServico: false
  });

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [itemEdicao, setItemEdicao] = useState<ProdutoServico | null>(null);

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'produtos' | 'servicos'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [ordenacao, setOrdenacao] = useState('nome-asc');

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;

  // Estados de Importação do Histórico de Vendas
  const [sugestoesHistorico, setSugestoesHistorico] = useState<ItemHistoricoSugestao[]>([]);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [itensImportacao, setItensImportacao] = useState<ItemImportacao[]>([]);
  const [filtroSugestoes, setFiltroSugestoes] = useState('');
  const [importandoLote, setImportandoLote] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);

  const currentNegocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  useEffect(() => {
    carregarItens();
    carregarSugestoes();
  }, [currentNegocioId]);

  // Resetar página para 1 quando houver alteração nos filtros
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroTexto, filtroTipo, filtroCategoria, ordenacao]);

  async function getNegocioIdAtivo(): Promise<string | null> {
    let id = currentNegocioId || localStorage.getItem('@Autonomax:selectedNegocioId');
    if (!id) {
      try {
        const resNeg = await api.get('/Negocios');
        if (resNeg.data && resNeg.data.length > 0) {
          id = String(resNeg.data[0].id);
          localStorage.setItem('@Autonomax:selectedNegocioId', id);
        }
      } catch (e) {
        console.error("Erro ao obter negócios:", e);
      }
    }
    return id;
  }

  async function carregarItens(negId?: string | number) {
    const idUsar = negId ? String(negId) : await getNegocioIdAtivo();
    if (!idUsar) return;
    setCarregando(true);
    try {
      const response = await api.get(`/ProdutosServicos/por-negocio/${idUsar}`);
      setItens(response.data || []);
    } catch (err) {
      console.error("Erro ao carregar itens do catálogo:", err);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarSugestoes(negId?: string | number) {
    const idUsar = negId ? String(negId) : await getNegocioIdAtivo();
    if (!idUsar) return;
    try {
      const res = await api.get(`/ProdutosServicos/sugestoes-historico/${idUsar}`);
      setSugestoesHistorico(res.data || []);
    } catch (err) {
      console.error("Erro ao carregar sugestões do histórico:", err);
    }
  }

  // Lista de tags/categorias únicas existentes
  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set<string>();
    itens.forEach(i => {
      if (i.categoria && i.categoria.trim()) {
        cats.add(i.categoria.trim());
      }
    });
    return Array.from(cats).sort();
  }, [itens]);

  // Abre modal preparando os itens não cadastrados
  function handleAbrirModalHistorico() {
    const naoCadastrados = sugestoesHistorico.filter(s => !s.jaCadastrado);
    const listaBase = naoCadastrados.length > 0 ? naoCadastrados : sugestoesHistorico;
    const listaInicial: ItemImportacao[] = listaBase.map(s => ({
      nome: s.nome,
      preco: '',
      categoria: s.categoria || (s.ehServico ? 'Serviço' : 'Geral'),
      ehServico: s.ehServico,
      selecionado: !s.jaCadastrado,
      ocorrencias: s.ocorrencias
    }));
    setItensImportacao(listaInicial);
    setModalHistoricoAberto(true);
  }

  function handleToggleSelecionarItem(indexOriginal: number) {
    setItensImportacao(prev => prev.map((item, idx) => 
      idx === indexOriginal ? { ...item, selecionado: !item.selecionado } : item
    ));
  }

  function handleAlterarPrecoImportacao(indexOriginal: number, valor: string) {
    setItensImportacao(prev => prev.map((item, idx) => 
      idx === indexOriginal ? { ...item, preco: valor } : item
    ));
  }

  function handleAlterarCategoriaImportacao(indexOriginal: number, categoria: string) {
    setItensImportacao(prev => prev.map((item, idx) => 
      idx === indexOriginal ? { ...item, categoria } : item
    ));
  }

  function handleAlterarTipoImportacao(indexOriginal: number, ehServico: boolean) {
    setItensImportacao(prev => prev.map((item, idx) => 
      idx === indexOriginal ? { ...item, ehServico } : item
    ));
  }

  function handleAlterarNomeImportacao(indexOriginal: number, nome: string) {
    setItensImportacao(prev => prev.map((item, idx) => 
      idx === indexOriginal ? { ...item, nome } : item
    ));
  }

  function handleToggleSelecionarTodos() {
    const todosSelecionados = itensImportacao.every(i => i.selecionado);
    setItensImportacao(prev => prev.map(i => ({ ...i, selecionado: !todosSelecionados })));
  }

  async function handleImportarEmLote() {
    const idUsar = await getNegocioIdAtivo();
    if (!idUsar) return;
    const selecionados = itensImportacao.filter(i => i.selecionado && i.nome.trim());
    if (selecionados.length === 0) {
      alert("Selecione pelo menos um item para importar.");
      return;
    }

    setImportandoLote(true);
    try {
      const payload = {
        negocioId: Number(idUsar),
        itens: selecionados.map(i => ({
          nome: i.nome.trim(),
          categoria: i.categoria?.trim() || null,
          preco: Number(i.preco) || 0,
          ehServico: i.ehServico,
          descricao: `Importado do histórico de vendas (${i.ocorrencias} vendas anteriores)`
        }))
      };

      const res = await api.post('/ProdutosServicos/importar-em-lote', payload);
      const qtdImportados = res.data?.length || selecionados.length;
      
      setFeedbackMsg({
        tipo: 'sucesso',
        texto: `${qtdImportados} item(ns) adicionado(s) com sucesso ao catálogo!`
      });
      setTimeout(() => setFeedbackMsg(null), 6000);

      setModalHistoricoAberto(false);
      carregarItens(idUsar);
      carregarSugestoes(idUsar);
    } catch (err) {
      console.error("Erro ao importar em lote:", err);
      alert("Erro ao importar itens selecionados.");
    } finally {
      setImportandoLote(false);
    }
  }

  async function handleAddItem() {
    if (!novoItem.nome.trim()) {
      alert("Por favor, informe o nome do item.");
      return;
    }
    const idUsar = await getNegocioIdAtivo();
    if (!idUsar) return;

    try {
      await api.post('/ProdutosServicos', {
        nome: novoItem.nome.trim(),
        descricao: novoItem.descricao.trim(),
        categoria: novoItem.categoria.trim() || null,
        preco: Number(novoItem.preco) || 0,
        ehServico: novoItem.ehServico,
        negocioId: Number(idUsar)
      });
      setNovoItem({ nome: '', descricao: '', categoria: '', preco: '', ehServico: false });
      setFormAberto(false);
      carregarItens(idUsar);
      carregarSugestoes(idUsar);
    } catch (err) {
      alert("Erro ao cadastrar item no catálogo.");
    }
  }

  async function handleUpdateItem(id: number) {
    if (!itemEdicao) return;
    if (!itemEdicao.nome.trim()) {
      alert("O nome é obrigatório.");
      return;
    }

    try {
      await api.put(`/ProdutosServicos/${id}`, {
        nome: itemEdicao.nome.trim(),
        descricao: itemEdicao.descricao,
        categoria: itemEdicao.categoria?.trim() || null,
        preco: Number(itemEdicao.preco) || 0,
        ehServico: itemEdicao.ehServico
      });
      setEditandoId(null);
      carregarItens();
      carregarSugestoes();
    } catch (err) {
      alert("Erro ao atualizar item.");
    }
  }

  async function handleDeleteItem(id: number) {
    if (!confirm("Tem certeza que deseja remover este item do catálogo?")) return;
    try {
      await api.delete(`/ProdutosServicos/${id}`);
      carregarItens();
      carregarSugestoes();
    } catch (err) {
      alert("Erro ao excluir item.");
    }
  }

  // Quantidade de itens do histórico não cadastrados
  const itensNaoCadastradosNoHistorico = useMemo(() => {
    return sugestoesHistorico.filter(s => !s.jaCadastrado);
  }, [sugestoesHistorico]);

  // Estatísticas do Catálogo (3 KPIs: Total, Produtos, Serviços)
  const metricas = useMemo(() => {
    const totalItens = itens.length;
    const totalProdutos = itens.filter(i => !i.ehServico).length;
    const totalServicos = itens.filter(i => i.ehServico).length;

    return { totalItens, totalProdutos, totalServicos };
  }, [itens]);

  // Filtragem e Ordenação da lista principal
  const itensFiltrados = useMemo(() => {
    const termo = filtroTexto.trim().toLowerCase();
    return itens
      .filter(item => {
        if (filtroTipo === 'produtos' && item.ehServico) return false;
        if (filtroTipo === 'servicos' && !item.ehServico) return false;
        if (filtroCategoria !== 'todas' && (item.categoria || '').toLowerCase() !== filtroCategoria.toLowerCase()) return false;

        if (!termo) return true;
        const nomeMatch = item.nome?.toLowerCase().includes(termo);
        const descMatch = item.descricao?.toLowerCase().includes(termo);
        const catMatch = item.categoria?.toLowerCase().includes(termo);
        return nomeMatch || descMatch || catMatch;
      })
      .sort((a, b) => {
        const [campo, ordem] = ordenacao.split('-');
        let valorA: string | number = '';
        let valorB: string | number = '';

        if (campo === 'preco') {
          valorA = Number(a.preco) || 0;
          valorB = Number(b.preco) || 0;
        } else {
          valorA = (a.nome || '').toLowerCase();
          valorB = (b.nome || '').toLowerCase();
        }

        if (valorA < valorB) return ordem === 'asc' ? -1 : 1;
        if (valorA > valorB) return ordem === 'asc' ? 1 : -1;
        return 0;
      });
  }, [itens, filtroTexto, filtroTipo, filtroCategoria, ordenacao]);

  // Itens da Página Atual
  const totalPaginas = Math.ceil(itensFiltrados.length / ITENS_POR_PAGINA) || 1;
  const itensPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return itensFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [itensFiltrados, paginaAtual]);

  // Filtragem no Modal de Importação
  const itensImportacaoFiltrados = useMemo(() => {
    const termo = filtroSugestoes.trim().toLowerCase();
    if (!termo) return itensImportacao.map((item, originalIdx) => ({ ...item, originalIdx }));
    return itensImportacao
      .map((item, originalIdx) => ({ ...item, originalIdx }))
      .filter(item => item.nome.toLowerCase().includes(termo) || item.categoria?.toLowerCase().includes(termo));
  }, [itensImportacao, filtroSugestoes]);

  const qtdSelecionadosImportacao = useMemo(() => {
    return itensImportacao.filter(i => i.selecionado).length;
  }, [itensImportacao]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* MENSAGEM DE FEEDBACK */}
          {feedbackMsg && (
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
              feedbackMsg.tipo === 'sucesso' 
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300' 
                : 'bg-red-950/70 border-red-800 text-red-300'
            }`}>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span>{feedbackMsg.texto}</span>
              </div>
              <button 
                onClick={() => setFeedbackMsg(null)}
                className="text-gray-400 hover:text-white bg-transparent border-none cursor-pointer p-1"
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          {/* KPIS DO CATÁLOGO (OCULTOS POR PADRÃO, REVELÁVEIS COM O OLHINHO) */}
          {mostrarKpis && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
              {/* Total de Itens */}
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
                <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50">
                  <Boxes size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total no Catálogo</p>
                  <p className="text-xl font-black text-white">{metricas.totalItens}</p>
                </div>
              </div>

              {/* Total Produtos */}
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
                <div className="p-3 bg-teal-950/50 text-teal-400 rounded-lg border border-teal-900/50">
                  <Package size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Produtos Físicos</p>
                  <p className="text-xl font-black text-teal-400">{metricas.totalProdutos}</p>
                </div>
              </div>

              {/* Total Serviços */}
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
                <div className="p-3 bg-blue-950/50 text-blue-400 rounded-lg border border-blue-900/50">
                  <Wrench size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Serviços</p>
                  <p className="text-xl font-black text-blue-400">{metricas.totalServicos}</p>
                </div>
              </div>
            </div>
          )}

          {/* BANNER INTELIGENTE: ITENS DETECTADOS NO HISTÓRICO DE VENDAS */}
          {itensNaoCadastradosNoHistorico.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-950/60 via-gray-900 to-gray-900 border border-emerald-800/60 rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg animate-in fade-in">
              <div className="flex items-start md:items-center gap-3.5">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 flex-shrink-0">
                  <Sparkles size={22} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      Reconhecimento Automático de Vendas
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-black uppercase">
                      {itensNaoCadastradosNoHistorico.length} {itensNaoCadastradosNoHistorico.length === 1 ? 'item novo' : 'itens novos'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 font-medium mt-1">
                    Encontramos itens digitados nos seus lançamentos anteriores que ainda não estão no catálogo (Ex: <strong className="text-white">{itensNaoCadastradosNoHistorico.slice(0, 3).map(i => i.nome).join(', ')}</strong>{itensNaoCadastradosNoHistorico.length > 3 ? '...' : ''}).
                  </p>
                </div>
              </div>

              <button
                onClick={handleAbrirModalHistorico}
                className="w-full md:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black text-xs uppercase tracking-wider border border-emerald-500 cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all flex-shrink-0"
              >
                <span>Importar</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* PAINEL DE CONTROLE (BUSCA, TIPO, TAG E ORDENAÇÃO) */}
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50 hidden md:flex">
                <Package size={22} />
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black tracking-tight uppercase text-gray-100 whitespace-nowrap">Catálogo</h2>
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

              {/* Botão de Importação */}
              {sugestoesHistorico.length > 0 && (
                <button
                  onClick={handleAbrirModalHistorico}
                  className="px-3 py-2 bg-gray-950 hover:bg-gray-800 text-emerald-400 rounded-lg border border-gray-800 hover:border-emerald-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ml-auto md:ml-2"
                  title="Abrir varredura de itens digitados no histórico de vendas"
                >
                  <Sparkles size={14} />
                  <span>Importar</span>
                  {itensNaoCadastradosNoHistorico.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  )}
                </button>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto flex-1 justify-end">
              {/* Filtro por Tipo (Pills) */}
              <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-md border border-gray-800 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setFiltroTipo('todos')}
                  className={`px-3 py-2 rounded text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex-1 md:flex-initial ${
                    filtroTipo === 'todos' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('produtos')}
                  className={`px-3 py-2 rounded text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center gap-1 flex-1 md:flex-initial ${
                    filtroTipo === 'produtos' ? 'bg-teal-600 text-white' : 'text-teal-500 hover:text-teal-400'
                  }`}
                >
                  <Package size={12} /> Produtos
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo('servicos')}
                  className={`px-3 py-2 rounded text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center gap-1 flex-1 md:flex-initial ${
                    filtroTipo === 'servicos' ? 'bg-blue-600 text-white' : 'text-blue-500 hover:text-blue-400'
                  }`}
                >
                  <Wrench size={12} /> Serviços
                </button>
              </div>

              {/* Filtro por Categoria / Tag (Se houver tags cadastradas) */}
              {categoriasDisponiveis.length > 0 && (
                <div className="relative w-full md:w-auto flex items-center bg-gray-950 border border-gray-800 rounded-md px-3 py-2.5 focus-within:border-emerald-600 transition-all">
                  <Tag size={14} className="text-purple-400 mr-2 flex-shrink-0" />
                  <select
                    className="bg-transparent border-none outline-none text-gray-300 text-xs font-bold uppercase tracking-wider cursor-pointer appearance-none pr-5"
                    value={filtroCategoria}
                    onChange={e => setFiltroCategoria(e.target.value)}
                  >
                    <option value="todas" className="bg-gray-900 text-gray-300">Todas as Tags</option>
                    {categoriasDisponiveis.map(cat => (
                      <option key={cat} value={cat} className="bg-gray-900 text-gray-300">{cat}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="text-gray-500 absolute right-2.5 pointer-events-none" />
                </div>
              )}

              {/* Campo de Busca */}
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text"
                  placeholder="Localizar item ou tag..."
                  className="w-full pl-11 pr-9 py-3 bg-gray-950 border border-gray-800 rounded-md text-sm outline-none focus:border-emerald-600 text-white placeholder-gray-600 transition-all font-medium"
                  value={filtroTexto}
                  onChange={e => setFiltroTexto(e.target.value)}
                />
                {filtroTexto && (
                  <button 
                    onClick={() => setFiltroTexto('')}
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
                  <optgroup label="Preço" className="bg-gray-900 text-gray-300">
                    <option value="preco-desc">Maior Preço</option>
                    <option value="preco-asc">Menor Preço</option>
                  </optgroup>
                </select>
                <ChevronDown size={14} className="text-gray-500 ml-2 flex-shrink-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* CARD NOVO PRODUTO OU SERVIÇO (RETRÁTIL) */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <button 
              onClick={() => setFormAberto(!formAberto)} 
              className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between hover:bg-gray-800/80 transition-colors border-none outline-none cursor-pointer border-b border-gray-800"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400" />
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-wider">Card Novo Produto ou Serviço</h3>
              </div>
              <div className="flex items-center text-gray-400">
                {formAberto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>
            
            {formAberto && (
              <div className="p-5 md:p-6 space-y-4 bg-gray-900 animate-in slide-in-from-top duration-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Nome */}
                  <div className="md:col-span-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Nome do Item *
                    </label>
                    <input 
                      className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm transition-all" 
                      value={novoItem.nome} 
                      onChange={e => setNovoItem({...novoItem, nome: e.target.value})} 
                      placeholder="Nome do produto ou serviço" 
                    />
                  </div>

                  {/* Preço Unitário */}
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Preço (R$)
                    </label>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-emerald-600 text-emerald-400 font-black text-sm transition-all placeholder-gray-600" 
                      value={novoItem.preco} 
                      onChange={e => setNovoItem({...novoItem, preco: e.target.value})} 
                      placeholder="0,00" 
                    />
                  </div>

                  {/* Tag / Categoria */}
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Tag / Categoria
                    </label>
                    <input 
                      type="text"
                      className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-purple-600 text-purple-300 font-medium text-sm transition-all placeholder-gray-600" 
                      value={novoItem.categoria} 
                      onChange={e => setNovoItem({...novoItem, categoria: e.target.value})} 
                      placeholder="Tag de classificação" 
                    />
                  </div>

                  {/* Tipo (Produto / Serviço) */}
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Tipo do Item
                    </label>
                    <div className="flex bg-gray-950 p-1 rounded-md border border-gray-800 h-[48px] items-center">
                      <button
                        type="button"
                        onClick={() => setNovoItem({...novoItem, ehServico: false})}
                        className={`flex-1 py-2.5 rounded font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center gap-1 ${
                          !novoItem.ehServico ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        <Package size={12} /> Produto
                      </button>
                      <button
                        type="button"
                        onClick={() => setNovoItem({...novoItem, ehServico: true})}
                        className={`flex-1 py-2.5 rounded font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center gap-1 ${
                          novoItem.ehServico ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        <Wrench size={12} /> Serviço
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Descrição */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Descrição ou Detalhes
                  </label>
                  <textarea 
                    rows={2} 
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm resize-none transition-all" 
                    value={novoItem.descricao} 
                    onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} 
                    placeholder="Descrição ou observações" 
                  />
                </div>

                <button 
                  onClick={handleAddItem} 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-md font-black uppercase tracking-wider text-xs border border-emerald-700 cursor-pointer flex items-center justify-center gap-2 transition-all"
                >
                  <Plus size={16} /> Salvar no Catálogo
                </button>
              </div>
            )}
          </div>

          {/* LISTA DE ITENS DO CATÁLOGO COM PAGINAÇÃO */}
          <div className="flex flex-col gap-2.5">
            {carregando ? (
              <LoadingProgress message="Carregando catálogo..." compact />
            ) : itensFiltrados.length === 0 ? (
              <div className="bg-gray-900 p-12 rounded-xl border border-dashed border-gray-800 text-center">
                <Boxes size={36} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-1">Nenhum item encontrado</p>
                <p className="text-gray-600 text-xs font-medium max-w-md mx-auto">
                  {filtroTexto || filtroTipo !== 'todos' || filtroCategoria !== 'todas'
                    ? "Tente ajustar os filtros ou os termos da busca." 
                    : "Cadastre seus produtos ou use o botão de importação para preencher automaticamente!"}
                </p>
                {itensNaoCadastradosNoHistorico.length > 0 && (
                  <button
                    onClick={handleAbrirModalHistorico}
                    className="mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold text-xs uppercase tracking-wider border border-emerald-700 cursor-pointer inline-flex items-center gap-2"
                  >
                    <Sparkles size={16} /> Importar {itensNaoCadastradosNoHistorico.length} itens encontrados nas vendas
                  </button>
                )}
              </div>
            ) : (
              <>
                {itensPaginados.map(item => (
                  <div 
                    key={item.id} 
                    className="bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 hover:bg-gray-900/90 transition-all p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                  >
                    {/* IDENTIFICAÇÃO DO ITEM */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Link
                        to={`/catalogo/${item.id}`}
                        className={`w-11 h-11 rounded-lg flex items-center justify-center font-black text-lg border flex-shrink-0 transition-transform hover:scale-105 ${
                          item.ehServico 
                            ? 'bg-blue-950/50 text-blue-400 border-blue-900/60 hover:border-blue-700' 
                            : 'bg-teal-950/50 text-teal-400 border-teal-900/60 hover:border-teal-700'
                        }`}
                        title="Ver Análise & Vendas do Item"
                      >
                        {item.ehServico ? <Wrench size={20} /> : <Package size={20} />}
                      </Link>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link 
                            to={`/catalogo/${item.id}`}
                            className="font-black text-gray-200 hover:text-emerald-400 uppercase text-sm tracking-tight truncate transition-colors"
                            title="Ver Análise & Vendas do Item"
                          >
                            {item.nome}
                          </Link>
                          
                          {/* Tag / Categoria do Item */}
                          {item.categoria && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border bg-purple-950/40 text-purple-300 border-purple-900/50 flex items-center gap-1">
                              <Tag size={10} /> {item.categoria}
                            </span>
                          )}

                          {/* Tipo do Item */}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                            item.ehServico 
                              ? 'bg-blue-950/40 text-blue-400 border-blue-900/50' 
                              : 'bg-teal-950/40 text-teal-400 border-teal-900/50'
                          }`}>
                            {item.ehServico ? 'Serviço' : 'Produto'}
                          </span>
                        </div>
                        
                        {item.descricao && (
                          <p className="text-xs text-gray-400 font-normal mt-1 truncate" title={item.descricao}>
                            {item.descricao}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* PREÇO E AÇÕES */}
                    <div className="flex items-center justify-between md:justify-end gap-3">
                      {/* Preço Unitário (Sem o texto Preço Padrão) */}
                      <div className="bg-gray-950 px-4 py-2.5 rounded-lg border border-gray-800 text-right min-w-[100px] flex items-center justify-center">
                        <span className="text-base font-black text-emerald-400">
                          R$ {Number(item.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-1">
                        <Link 
                          to={`/catalogo/${item.id}`}
                          className="p-2 text-gray-500 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-md transition-all border border-transparent hover:border-emerald-900/50 flex items-center justify-center bg-transparent"
                          title="Ver Performance e Gráficos"
                        >
                          <BarChart3 size={16} />
                        </Link>
                        <button 
                          onClick={() => { setEditandoId(item.id); setItemEdicao(item); }} 
                          className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-950/40 rounded-md transition-all border border-transparent hover:border-blue-900/50 cursor-pointer bg-transparent"
                          title="Editar item"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id)} 
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-950/40 rounded-md transition-all border border-transparent hover:border-red-900/50 cursor-pointer bg-transparent"
                          title="Excluir item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}

                {/* CONTROLE DE PAGINAÇÃO */}
                {totalPaginas > 1 && (
                  <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
                    <span className="text-xs font-medium text-gray-400">
                      Mostrando <strong className="text-white">{(paginaAtual - 1) * ITENS_POR_PAGINA + 1}</strong> a <strong className="text-white">{Math.min(paginaAtual * ITENS_POR_PAGINA, itensFiltrados.length)}</strong> de <strong className="text-emerald-400">{itensFiltrados.length}</strong> itens
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={paginaAtual === 1}
                        onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                        className="px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-md text-xs font-bold text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-all"
                      >
                        <ChevronLeft size={14} /> Anterior
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setPaginaAtual(num)}
                            className={`w-8 h-8 rounded-md text-xs font-black border transition-all cursor-pointer ${
                              paginaAtual === num
                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                                : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={paginaAtual === totalPaginas}
                        onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                        className="px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-md text-xs font-bold text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-all"
                      >
                        Próxima <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE IMPORTAÇÃO DO HISTÓRICO DE VENDAS */}
      {modalHistoricoAberto && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-gray-900 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-800 animate-in zoom-in-95 duration-200">
            
            {/* Header do Modal */}
            <div className="bg-gray-950 px-6 py-5 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-100 uppercase tracking-wider">
                    Reconhecimento de Itens das Vendas
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">
                    Itens digitados em lançamentos anteriores prontos para inclusão no Catálogo
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalHistoricoAberto(false)} 
                className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer p-1.5 rounded-lg transition-colors"
              >
                <X size={20}/>
              </button>
            </div>

            {/* Barra de Filtro e Seleção Rápida */}
            <div className="bg-gray-950/50 px-6 py-3 border-b border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleToggleSelecionarTodos}
                  className="px-3 py-2 bg-gray-900 hover:bg-gray-800 text-gray-200 rounded-lg border border-gray-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                >
                  {itensImportacao.length > 0 && itensImportacao.every(i => i.selecionado) ? (
                    <>
                      <CheckSquare size={16} className="text-emerald-400" />
                      <span>Desmarcar Todos</span>
                    </>
                  ) : (
                    <>
                      <Square size={16} className="text-gray-400" />
                      <span>Marcar Todos</span>
                    </>
                  )}
                </button>
                <span className="text-xs font-bold text-gray-400">
                  <strong className="text-emerald-400">{qtdSelecionadosImportacao}</strong> de {itensImportacao.length} selecionados
                </span>
              </div>

              {/* Busca rápida nos itens encontrados */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="text"
                  placeholder="Filtrar itens detectados..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium"
                  value={filtroSugestoes}
                  onChange={e => setFiltroSugestoes(e.target.value)}
                />
              </div>
            </div>

            {/* Lista dos Itens Encontrados */}
            <div className="p-6 space-y-3 overflow-y-auto flex-1 divide-y divide-gray-800/40">
              {itensImportacaoFiltrados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm font-bold uppercase tracking-wider">Nenhum item corresponde ao filtro.</p>
                </div>
              ) : (
                itensImportacaoFiltrados.map((item) => (
                  <div 
                    key={item.originalIdx}
                    className={`pt-3 first:pt-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3 rounded-xl transition-all ${
                      item.selecionado ? 'bg-gray-950/60 border border-emerald-950/50' : 'bg-transparent opacity-60'
                    }`}
                  >
                    {/* Checkbox e Nome */}
                    <div className="flex items-center gap-3 flex-1 min-w-0 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleSelecionarItem(item.originalIdx)}
                        className="text-gray-400 hover:text-emerald-400 bg-transparent border-none cursor-pointer p-1"
                      >
                        {item.selecionado ? (
                          <CheckSquare size={20} className="text-emerald-400" />
                        ) : (
                          <Square size={20} className="text-gray-600" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <input 
                            type="text"
                            value={item.nome}
                            onChange={e => handleAlterarNomeImportacao(item.originalIdx, e.target.value)}
                            className="bg-transparent border-b border-transparent focus:border-emerald-600 outline-none text-white font-black text-sm uppercase tracking-tight w-full hover:border-gray-700 transition-all"
                            placeholder="Nome do produto ou serviço"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded">
                            <Flame size={10} /> Usado {item.ocorrencias}x em vendas
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preço, Tag e Tipo */}
                    <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
                      {/* Tag Editável */}
                      <div className="relative flex items-center">
                        <input 
                          type="text"
                          placeholder="Tag..."
                          value={item.categoria}
                          onChange={e => handleAlterarCategoriaImportacao(item.originalIdx, e.target.value)}
                          className="w-24 px-2 py-2 bg-gray-950 border border-gray-800 rounded-lg text-purple-300 font-bold text-xs outline-none focus:border-purple-600"
                          title="Tag ou categoria do item"
                        />
                      </div>

                      {/* Preço Unitário Editável */}
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-bold text-gray-500">R$</span>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={item.preco}
                          onChange={e => handleAlterarPrecoImportacao(item.originalIdx, e.target.value)}
                          className="w-24 pl-8 pr-2 py-2 bg-gray-950 border border-gray-800 rounded-lg text-emerald-400 font-black text-xs outline-none focus:border-emerald-600 text-right"
                          title="Preço padrão para vendas futuras"
                        />
                      </div>

                      {/* Tipo (Produto / Serviço) */}
                      <div className="flex bg-gray-950 p-0.5 rounded-lg border border-gray-800">
                        <button
                          type="button"
                          onClick={() => handleAlterarTipoImportacao(item.originalIdx, false)}
                          className={`px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-1 ${
                            !item.ehServico ? 'bg-teal-600 text-white' : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <Package size={11} /> Prod.
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAlterarTipoImportacao(item.originalIdx, true)}
                          className={`px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-1 ${
                            item.ehServico ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <Wrench size={11} /> Serv.
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé de Ações do Modal */}
            <div className="bg-gray-950 px-6 py-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
              <span className="text-xs text-gray-400 font-medium">
                Os preços e tags informados serão salvos como padrão no catálogo.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setModalHistoricoAberto(false)}
                  className="w-full sm:w-auto px-4 py-3 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg text-xs font-black uppercase tracking-wider border border-gray-800 cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={qtdSelecionadosImportacao === 0 || importandoLote}
                  onClick={handleImportarEmLote}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-black uppercase tracking-wider border border-emerald-700 cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  {importandoLote ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Importando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Importar {qtdSelecionadosImportacao} Itens</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO INDIVIDUAL COM TAG */}
      {editandoId && itemEdicao && (
        <div className="fixed inset-0 bg-gray-950/70 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-gray-900 w-full md:max-w-xl h-[95vh] md:h-auto md:max-h-[95vh] rounded-t-lg md:rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-800 animate-in slide-in-from-bottom md:zoom-in duration-200">
            <div className="bg-gray-950 px-6 py-5 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-400"/>
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-widest">Ajustar Item do Catálogo</h3>
              </div>
              <button 
                onClick={() => setEditandoId(null)} 
                className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer p-1 transition-colors"
              >
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nome do Item</label>
                <input 
                  className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" 
                  value={itemEdicao.nome} 
                  onChange={e => setItemEdicao({...itemEdicao, nome: e.target.value})} 
                  placeholder="Nome" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Preço (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-emerald-400 font-black outline-none focus:border-emerald-600 text-sm" 
                    value={itemEdicao.preco} 
                    onChange={e => setItemEdicao({...itemEdicao, preco: Number(e.target.value)})} 
                    placeholder="0,00" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Tag / Categoria</label>
                  <input 
                    type="text"
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-purple-300 font-bold outline-none focus:border-purple-600 text-sm" 
                    value={itemEdicao.categoria || ''} 
                    onChange={e => setItemEdicao({...itemEdicao, categoria: e.target.value})} 
                    placeholder="Tag" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Tipo</label>
                  <div className="flex bg-gray-950 p-1 rounded-md border border-gray-800 h-[48px] items-center">
                    <button
                      type="button"
                      onClick={() => setItemEdicao({...itemEdicao, ehServico: false})}
                      className={`flex-1 py-2 rounded font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${
                        !itemEdicao.ehServico ? 'bg-teal-600 text-white' : 'text-gray-500'
                      }`}
                    >
                      Produto
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemEdicao({...itemEdicao, ehServico: true})}
                      className={`flex-1 py-2 rounded font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${
                        itemEdicao.ehServico ? 'bg-blue-600 text-white' : 'text-gray-500'
                      }`}
                    >
                      Serviço
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Descrição</label>
                <textarea 
                  className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium resize-none outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" 
                  rows={3} 
                  value={itemEdicao.descricao || ''} 
                  onChange={e => setItemEdicao({...itemEdicao, descricao: e.target.value})} 
                  placeholder="Descrição..." 
                />
              </div>
              
              <button 
                onClick={() => handleUpdateItem(itemEdicao.id)} 
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
