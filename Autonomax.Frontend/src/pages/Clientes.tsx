import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom'; 
import { 
  Trash2, Edit3, Save, X, Users, 
  Phone, Search, Contact2, Eye, 
  ChevronDown, ArrowDownWideNarrow,
  Plus, Tag, MapPin, RotateCcw
} from 'lucide-react';
import api from '../services/api';
import { LoadingProgress } from '../components/LoadingProgress';

interface Cliente {
  id: number;
  nome: string;
  celular: string;
  endereco: string;
  cidade: string;
  estado: string;
  observacoes: string;
  tags?: string;
  negocioId: number;
  totalComprado?: number;
  qtdMovimentacoes?: number;
  ultimaMovimentacao?: string;
}

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ 
    nome: '', celular: '', endereco: '', cidade: '', estado: '', observacoes: '', tags: '' 
  });
  
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [clienteEdicao, setClienteEdicao] = useState<Cliente | null>(null);
  
  const [filtro, setFiltro] = useState('');
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);
  const [cidadesSelecionadas, setCidadesSelecionadas] = useState<string[]>([]);
  const [ordenacao, setOrdenacao] = useState('nome-asc');
  const [mostrarTags, setMostrarTags] = useState(false);
  const [mostrarCidades, setMostrarCidades] = useState(false);

  const currentNegocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  useEffect(() => { carregarClientes(); }, [currentNegocioId]);

  async function carregarClientes() {
    if (!currentNegocioId) return;
    setCarregando(true);
    try {
      const response = await api.get(`/Clientes/por-negocio/${currentNegocioId}`);
      setClientes(response.data || []);
    } catch (err) { 
      console.error("Erro ao carregar clientes:", err); 
    } finally { 
      setCarregando(false); 
    }
  }

  const calcularDias = (dataISO: string | undefined) => {
    if (!dataISO || dataISO.startsWith('0001')) return '-';
    const data = new Date(dataISO);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataRef = new Date(data);
    dataRef.setHours(0, 0, 0, 0);
    const diffTime = hoje.getTime() - dataRef.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return '0';
    return `${diffDays}`;
  };

  async function handleAddCliente() {
    if (!novoCliente.nome.trim() || !currentNegocioId) {
      alert("Por favor, preencha o nome do cliente.");
      return;
    }
    try {
      await api.post('/Clientes', { ...novoCliente, negocioId: Number(currentNegocioId) });
      setNovoCliente({ nome: '', celular: '', endereco: '', cidade: '', estado: '', observacoes: '', tags: '' });
      setModalNovoAberto(false);
      carregarClientes();
    } catch (err) { alert("Erro ao cadastrar cliente."); }
  }

  async function handleUpdateCliente(id: number) {
    if (!clienteEdicao || !currentNegocioId) return;
    try {
      await api.put(`/Clientes/${id}`, { ...clienteEdicao, id, negocioId: Number(currentNegocioId) });
      setEditandoId(null);
      carregarClientes();
    } catch (err) { alert("Erro ao atualizar cliente."); }
  }

  async function handleDeleteCliente(id: number) {
    if (!confirm("Excluir este cliente?")) return;
    try {
      await api.delete(`Clientes/${id}`);
      carregarClientes();
    } catch (err) { alert("Erro ao excluir cliente."); }
  }

  // Extração de tags únicas de clientes com contagem
  const { tagsDisponiveis, contagemTags } = useMemo(() => {
    const map: Record<string, number> = {};
    clientes.forEach(c => {
      if (c.tags) {
        c.tags.split(/[,;]+/).forEach(rawTag => {
          const t = rawTag.trim();
          if (t) {
            map[t] = (map[t] || 0) + 1;
          }
        });
      }
    });
    return {
      tagsDisponiveis: Object.keys(map).sort(),
      contagemTags: map
    };
  }, [clientes]);

  // Extração de cidades únicas com contagem
  const { cidadesDisponiveis, contagemCidades } = useMemo(() => {
    const map: Record<string, number> = {};
    clientes.forEach(c => {
      const cid = c.cidade?.trim();
      if (cid) {
        map[cid] = (map[cid] || 0) + 1;
      }
    });
    return {
      cidadesDisponiveis: Object.keys(map).sort(),
      contagemCidades: map
    };
  }, [clientes]);

  const toggleTag = (tag: string) => {
    setTagsSelecionadas(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleCidade = (cidade: string) => {
    setCidadesSelecionadas(prev =>
      prev.includes(cidade) ? prev.filter(c => c !== cidade) : [...prev, cidade]
    );
  };

  const limparFiltros = () => {
    setTagsSelecionadas([]);
    setCidadesSelecionadas([]);
    setFiltro('');
  };

  // LÓGICA DE FILTRAGEM E ORDENAÇÃO MULTI-TAG EM TEMPO REAL
  const clientesFiltrados = useMemo(() => {
    const termo = filtro.trim().toLowerCase();

    return clientes
      .filter(c => {
        // 1. Filtro por Tags do Cliente (se houver alguma tag selecionada)
        if (tagsSelecionadas.length > 0) {
          if (!c.tags) return false;
          const tagsDoCliente = c.tags.split(/[,;]+/).map(t => t.trim().toLowerCase());
          const matchTag = tagsSelecionadas.some(st => tagsDoCliente.includes(st.toLowerCase()));
          if (!matchTag) return false;
        }

        // 2. Filtro por Cidade (se houver alguma cidade selecionada)
        if (cidadesSelecionadas.length > 0) {
          const cidadeCliente = (c.cidade || '').trim().toLowerCase();
          const matchCidade = cidadesSelecionadas.some(sc => sc.toLowerCase() === cidadeCliente);
          if (!matchCidade) return false;
        }

        // 3. Filtro por Texto (Nome, celular, cidade, tags)
        if (!termo) return true;
        const nomeMatch = c.nome?.toLowerCase().includes(termo);
        const celMatch = c.celular?.toLowerCase().includes(termo);
        const cidMatch = c.cidade?.toLowerCase().includes(termo);
        const tagMatch = c.tags?.toLowerCase().includes(termo);
        return nomeMatch || celMatch || cidMatch || tagMatch;
      })
      .sort((a, b) => {
        const [campo, ordem] = ordenacao.split('-');
        let valorA: string | number = '';
        let valorB: string | number = '';

        if (campo === 'faturamento') {
          valorA = a.totalComprado || 0;
          valorB = b.totalComprado || 0;
        } else if (campo === 'pedidos') {
          valorA = a.qtdMovimentacoes || 0;
          valorB = b.qtdMovimentacoes || 0;
        } else if (campo === 'atividade') {
          valorA = a.ultimaMovimentacao && !a.ultimaMovimentacao.startsWith('0001') ? new Date(a.ultimaMovimentacao).getTime() : 0;
          valorB = b.ultimaMovimentacao && !b.ultimaMovimentacao.startsWith('0001') ? new Date(b.ultimaMovimentacao).getTime() : 0;
        } else {
          valorA = (a.nome || '').toLowerCase();
          valorB = (b.nome || '').toLowerCase();
        }

        if (valorA < valorB) return ordem === 'asc' ? -1 : 1;
        if (valorA > valorB) return ordem === 'asc' ? 1 : -1;
        return 0;
      });
  }, [clientes, tagsSelecionadas, cidadesSelecionadas, filtro, ordenacao]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-5">
          
          {/* 1. CABEÇALHO PRINCIPAL (TÍTULO, CONTADOR E BOTÃO NOVO CLIENTE) */}
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50 hidden md:flex">
                <Users size={22} />
              </div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-black tracking-tight uppercase text-gray-100 whitespace-nowrap">Meus Clientes</h2>
                {/* MARCADOR DE TOTAL DE CLIENTES: SOMENTE O NÚMERO */}
                <div className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-900/60 rounded-md flex items-center justify-center shadow-sm" title="Total de clientes cadastrados">
                  <span className="text-xs font-black text-emerald-400 font-mono">
                    {clientes.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Botão Novo Cliente (Abre Modal) */}
            <button
              type="button"
              onClick={() => setModalNovoAberto(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-wider border border-emerald-500 cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              title="Cadastrar novo cliente"
            >
              <Plus size={16} />
              <span>Novo Cliente</span>
            </button>
          </div>

          {/* 2. CARD DE FILTRO DEDICADO (FORM DE BUSCA, MÉTODO DE ORDENAÇÃO, ÍCONES DE TAGS E CIDADES) */}
          <div className="bg-gray-900 p-4 sm:p-5 rounded-xl border border-gray-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Form de Busca */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text"
                  placeholder="Localizar cliente, cidade, tag..."
                  className="w-full pl-11 pr-9 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-sm outline-none focus:border-emerald-600 text-white placeholder-gray-600 transition-all font-medium"
                  value={filtro}
                  onChange={e => setFiltro(e.target.value)}
                />
                {filtro && (
                  <button 
                    type="button"
                    onClick={() => setFiltro('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 bg-transparent border-none cursor-pointer p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap justify-end">
                {/* Método de Ordenação */}
                <div className="relative w-full sm:w-auto flex items-center bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 focus-within:border-emerald-600 transition-all">
                  <ArrowDownWideNarrow size={16} className="text-gray-500 mr-2 flex-shrink-0" />
                  <select 
                    className="bg-transparent border-none outline-none text-gray-300 text-xs font-bold w-full cursor-pointer appearance-none pr-5 uppercase tracking-wider"
                    value={ordenacao}
                    onChange={e => setOrdenacao(e.target.value)}
                  >
                    <optgroup label="Ordem Alfabética" className="bg-gray-900 text-gray-300">
                      <option value="nome-asc">Nome (A - Z)</option>
                      <option value="nome-desc">Nome (Z - A)</option>
                    </optgroup>
                    <optgroup label="Faturamento" className="bg-gray-900 text-gray-300">
                      <option value="faturamento-desc">Maior Faturamento</option>
                      <option value="faturamento-asc">Menor Faturamento</option>
                    </optgroup>
                    <optgroup label="Volume de Compras" className="bg-gray-900 text-gray-300">
                      <option value="pedidos-desc">Mais Pedidos</option>
                      <option value="pedidos-asc">Menos Pedidos</option>
                    </optgroup>
                    <optgroup label="Atividade" className="bg-gray-900 text-gray-300">
                      <option value="atividade-desc">Atividade Mais Recente</option>
                      <option value="atividade-asc">Atividade Mais Antiga</option>
                    </optgroup>
                  </select>
                  <ChevronDown size={14} className="text-gray-500 absolute right-2.5 pointer-events-none" />
                </div>

                {/* Botão Ícone para Tags */}
                <button
                  type="button"
                  onClick={() => setMostrarTags(prev => !prev)}
                  className={`px-3 py-2.5 rounded-lg border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all select-none active:scale-95 flex-1 sm:flex-initial ${
                    mostrarTags || tagsSelecionadas.length > 0
                      ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-sm'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                  }`}
                  title={mostrarTags ? "Ocultar filtros de tags" : "Exibir filtros de tags"}
                >
                  <Tag size={15} className={mostrarTags || tagsSelecionadas.length > 0 ? "text-purple-400" : "text-gray-400"} />
                  <span>Tags</span>
                  {tagsSelecionadas.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center font-mono">
                      {tagsSelecionadas.length}
                    </span>
                  )}
                </button>

                {/* Botão Ícone para Cidades */}
                <button
                  type="button"
                  onClick={() => setMostrarCidades(prev => !prev)}
                  className={`px-3 py-2.5 rounded-lg border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all select-none active:scale-95 flex-1 sm:flex-initial ${
                    mostrarCidades || cidadesSelecionadas.length > 0
                      ? 'bg-blue-950/80 border-blue-500 text-blue-200 shadow-sm'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                  }`}
                  title={mostrarCidades ? "Ocultar filtros de cidades" : "Exibir filtros de cidades"}
                >
                  <MapPin size={15} className={mostrarCidades || cidadesSelecionadas.length > 0 ? "text-blue-400" : "text-gray-400"} />
                  <span>Cidades</span>
                  {cidadesSelecionadas.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center font-mono">
                      {cidadesSelecionadas.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* SEÇÃO EXPANSÍVEL: TAGS */}
            {mostrarTags && (
              <div className="pt-3 border-t border-gray-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                  <span className="flex items-center gap-1.5 text-purple-300 uppercase tracking-wider text-[11px]">
                    <Tag size={13} className="text-purple-400" /> Filtrar por Tags de Clientes:
                  </span>
                  {tagsSelecionadas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTagsSelecionadas([])}
                      className="text-[10px] uppercase font-black text-purple-400 hover:text-purple-300 border-none bg-transparent cursor-pointer"
                    >
                      Limpar Tags
                    </button>
                  )}
                </div>
                {tagsDisponiveis.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {tagsDisponiveis.map(tag => {
                      const isSelected = tagsSelecionadas.includes(tag);
                      const qtd = contagemTags[tag] || 0;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all border cursor-pointer flex items-center gap-1.5 select-none active:scale-95 ${
                            isSelected
                              ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-sm font-black'
                              : 'bg-gray-950/70 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700 font-bold'
                          }`}
                        >
                          <Tag size={12} className={isSelected ? 'text-purple-300' : 'text-purple-400/60'} />
                          <span>{tag}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            isSelected ? 'bg-purple-500/30 text-purple-100 font-bold' : 'bg-gray-800/80 text-gray-400'
                          }`}>
                            {qtd}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Nenhuma tag cadastrada ainda nos clientes.</p>
                )}
              </div>
            )}

            {/* SEÇÃO EXPANSÍVEL: CIDADES */}
            {mostrarCidades && (
              <div className="pt-3 border-t border-gray-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                  <span className="flex items-center gap-1.5 text-blue-300 uppercase tracking-wider text-[11px]">
                    <MapPin size={13} className="text-blue-400" /> Filtrar por Cidades:
                  </span>
                  {cidadesSelecionadas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCidadesSelecionadas([])}
                      className="text-[10px] uppercase font-black text-blue-400 hover:text-blue-300 border-none bg-transparent cursor-pointer"
                    >
                      Limpar Cidades
                    </button>
                  )}
                </div>
                {cidadesDisponiveis.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {cidadesDisponiveis.map(cid => {
                      const isSelected = cidadesSelecionadas.includes(cid);
                      const qtd = contagemCidades[cid] || 0;
                      return (
                        <button
                          key={cid}
                          type="button"
                          onClick={() => toggleCidade(cid)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all border cursor-pointer flex items-center gap-1.5 select-none active:scale-95 ${
                            isSelected
                              ? 'bg-blue-950/80 border-blue-500 text-blue-200 shadow-sm font-black'
                              : 'bg-gray-950/70 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700 font-bold'
                          }`}
                        >
                          <MapPin size={12} className={isSelected ? 'text-blue-300' : 'text-blue-400/60'} />
                          <span>{cid}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            isSelected ? 'bg-blue-500/30 text-blue-100 font-bold' : 'bg-gray-800/80 text-gray-400'
                          }`}>
                            {qtd}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Nenhuma cidade cadastrada ainda nos clientes.</p>
                )}
              </div>
            )}

            {/* BARRA DE STATUS DOS FILTROS (SE HOUVER QUALQUER FILTRO ATIVO) */}
            {(tagsSelecionadas.length > 0 || cidadesSelecionadas.length > 0 || filtro) && (
              <div className="pt-2 border-t border-gray-800/50 flex items-center justify-between text-xs text-gray-400 flex-wrap gap-2">
                <span>
                  Exibindo <strong className="text-white">{clientesFiltrados.length}</strong> de {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
                </span>
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 flex items-center gap-1 border-none bg-transparent cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Limpar Todos os Filtros</span>
                </button>
              </div>
            )}
          </div>

          {/* LEGENDA DE IDENTIFICAÇÃO RÁPIDA */}
          <div className="flex flex-wrap items-center gap-6 px-5 py-3 bg-gray-900/40 rounded-lg border border-dashed border-gray-800">
             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500/80 border border-blue-500"></div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Última Atividade (Dias)</span></div>
             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-orange-500/80 border border-orange-500"></div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qtd. de Pedidos</span></div>
             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80 border border-emerald-500"></div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Faturamento (R$)</span></div>
          </div>

          {/* LISTA DE CLIENTES */}
          <div className="flex flex-col gap-2.5">
            {carregando ? (
              <LoadingProgress message="Carregando clientes..." compact />
            ) : clientesFiltrados.length === 0 ? (
              <div className="bg-gray-900 p-12 rounded-xl border border-dashed border-gray-800 text-center space-y-3">
                <Users size={36} className="mx-auto text-gray-600 mb-1" />
                <p className="text-gray-400 font-bold text-sm uppercase tracking-wider">Nenhum cliente encontrado</p>
                <p className="text-gray-600 text-xs font-medium max-w-md mx-auto">
                  {filtro || tagsSelecionadas.length > 0 || cidadesSelecionadas.length > 0
                    ? "Tente ajustar os filtros selecionados ou os termos da busca." 
                    : "Cadastre novos clientes para acompanhar faturamento, atividade e pedidos!"}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setModalNovoAberto(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold text-xs uppercase tracking-wider border border-emerald-700 cursor-pointer inline-flex items-center gap-2 transition-all shadow-md"
                  >
                    <Plus size={16} /> Cadastrar Novo Cliente
                  </button>
                </div>
              </div>
            ) : (
              clientesFiltrados.map(cliente => (
                <div key={cliente.id} className="bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 hover:bg-gray-900/90 transition-all p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  
                  {/* IDENTIFICAÇÃO DO CLIENTE */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 text-gray-300 flex items-center justify-center font-black text-lg border border-gray-700 flex-shrink-0">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-gray-200 uppercase text-sm tracking-tight truncate">
                          {cliente.nome}
                        </h4>
                        {cliente.cidade && (
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-950 px-2 py-0.5 rounded border border-gray-800 flex items-center gap-1">
                            <MapPin size={10} className="text-blue-400" />
                            {cliente.cidade}{cliente.estado ? ` - ${cliente.estado}` : ''}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase">
                          <Phone size={10} className="text-emerald-500/70"/> {cliente.celular || 'Sem Contato'}
                        </p>
                        
                        {/* Tags do Cliente */}
                        {cliente.tags && cliente.tags.split(/[,;]+/).map(t => t.trim()).filter(Boolean).map((t, idx) => (
                          <span key={idx} className="text-[9px] font-bold bg-purple-950/50 text-purple-300 border border-purple-900/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Tag size={9} /> {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* METADADOS ANALÍTICOS (PILLS) */}
                  <div className="flex items-center justify-between md:justify-end gap-3 md:gap-6 flex-shrink-0">
                    <div className="flex items-center gap-2 bg-blue-950/30 px-3 py-1.5 rounded-md border border-blue-900/50" title="Dias desde a última compra">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span className="text-[11px] font-black text-blue-400 uppercase">{calcularDias(cliente.ultimaMovimentacao)}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-orange-950/30 px-3 py-1.5 rounded-md border border-orange-900/50" title="Quantidade total de pedidos">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <span className="text-[11px] font-black text-orange-400">{cliente.qtdMovimentacoes || 0}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-emerald-950/30 px-3 py-1.5 rounded-md border border-emerald-900/50" title="Faturamento total">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-[11px] font-black text-emerald-400">
                        R$ { (cliente.totalComprado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }
                      </span>
                    </div>

                    {/* AÇÕES */}
                    <div className="flex items-center gap-1 ml-2">
                      <Link to={`/clientes/${cliente.id}`} className="p-2 text-gray-500 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-md transition-all border border-transparent hover:border-emerald-900/50" title="Ver Detalhes do Cliente">
                        <Eye size={16} />
                      </Link>
                      <button onClick={() => { setEditandoId(cliente.id); setClienteEdicao(cliente); }} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-950/40 rounded-md transition-all border border-transparent hover:border-blue-900/50 cursor-pointer bg-transparent" title="Editar Cliente">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDeleteCliente(cliente.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-950/40 rounded-md transition-all border border-transparent hover:border-red-900/50 cursor-pointer bg-transparent" title="Excluir Cliente">
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

      {/* MODAL NOVO CLIENTE */}
      {modalNovoAberto && (
        <div className="fixed inset-0 bg-gray-950/75 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 w-full md:max-w-xl max-h-[92vh] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-800 animate-in slide-in-from-bottom md:zoom-in duration-200">
            {/* Cabeçalho */}
            <div className="bg-gray-950 px-6 py-5 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-950/60 text-emerald-400 rounded-lg border border-emerald-900/60">
                  <Contact2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-100 uppercase tracking-wider">Novo Cliente</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Cadastre um novo cliente no seu negócio</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setModalNovoAberto(false)} 
                className="text-gray-500 hover:text-white bg-transparent border-none cursor-pointer p-1.5 transition-colors rounded-lg hover:bg-gray-800"
              >
                <X size={20}/>
              </button>
            </div>
            
            {/* Conteúdo */}
            <div className="p-6 md:p-7 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Nome Completo *
                  </label>
                  <input 
                    autoFocus
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-xl outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm transition-all" 
                    value={novoCliente.nome} 
                    onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} 
                    placeholder="Nome do cliente ou empresa" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    WhatsApp / Celular
                  </label>
                  <input 
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-xl outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm transition-all" 
                    value={novoCliente.celular} 
                    onChange={e => setNovoCliente({...novoCliente, celular: e.target.value})} 
                    placeholder="(00) 00000-0000" 
                  />
                </div>
              </div>

              {/* Tags do Cliente */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Tags de Classificação (separadas por vírgula)
                </label>
                <div className="relative">
                  <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                  <input 
                    type="text"
                    className="w-full pl-9 pr-3.5 py-3.5 bg-gray-950 border border-gray-800 rounded-xl outline-none focus:border-purple-600 text-purple-300 font-medium text-sm transition-all placeholder-gray-600" 
                    value={novoCliente.tags} 
                    onChange={e => setNovoCliente({...novoCliente, tags: e.target.value})} 
                    placeholder="Ex: Vip, Mensalista, Atacado, Empresa..." 
                  />
                </div>
                {/* Sugestões rápidas de tags existentes */}
                {tagsDisponiveis.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tagsDisponiveis.slice(0, 6).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const atuais = novoCliente.tags.split(/[,;]+/).map(t => t.trim()).filter(Boolean);
                          if (!atuais.includes(tag)) {
                            setNovoCliente({ ...novoCliente, tags: atuais.length > 0 ? `${novoCliente.tags}, ${tag}` : tag });
                          }
                        }}
                        className="px-2 py-0.5 bg-gray-950 hover:bg-gray-800 text-[10px] font-bold text-purple-400 rounded border border-gray-800 cursor-pointer transition-all"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Endereço, Cidade e UF */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Endereço
                </label>
                <input 
                  className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-xl outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm transition-all" 
                  value={novoCliente.endereco} 
                  onChange={e => setNovoCliente({...novoCliente, endereco: e.target.value})} 
                  placeholder="Rua, número, bairro..." 
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Cidade
                  </label>
                  <input 
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-xl outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm transition-all" 
                    value={novoCliente.cidade} 
                    onChange={e => setNovoCliente({...novoCliente, cidade: e.target.value})} 
                    placeholder="Cidade" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    UF
                  </label>
                  <input 
                    maxLength={2}
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-xl outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-black uppercase text-center text-sm transition-all" 
                    value={novoCliente.estado} 
                    onChange={e => setNovoCliente({...novoCliente, estado: e.target.value})} 
                    placeholder="UF" 
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Observações (Opcional)
                </label>
                <textarea 
                  rows={2} 
                  className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-xl outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm resize-none transition-all" 
                  value={novoCliente.observacoes} 
                  onChange={e => setNovoCliente({...novoCliente, observacoes: e.target.value})} 
                  placeholder="Detalhes adicionais, preferências, histórico..." 
                />
              </div>
            </div>

            {/* Rodapé */}
            <div className="bg-gray-950 px-6 py-4 border-t border-gray-800 flex items-center justify-end gap-2.5 flex-shrink-0">
              <button 
                type="button"
                onClick={() => setModalNovoAberto(false)}
                className="px-4 py-3 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-black uppercase tracking-wider border border-gray-800 cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleAddCliente} 
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-wider text-xs border border-emerald-500 cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Plus size={16} /> Confirmar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO ESCURO */}
      {editandoId && clienteEdicao && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 w-full md:max-w-2xl max-h-[92vh] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-800 animate-in slide-in-from-bottom md:zoom-in duration-200">
            <div className="bg-gray-950 px-6 py-5 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-400"/>
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-widest">Ajustar Cadastro</h3>
              </div>
              <button onClick={() => setEditandoId(null)} className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer p-1 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-6 md:p-8 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nome Completo</label>
                  <input className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" value={clienteEdicao.nome} onChange={e => setClienteEdicao({...clienteEdicao, nome: e.target.value})} placeholder="Nome" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Celular / WhatsApp</label>
                  <input className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" value={clienteEdicao.celular} onChange={e => setClienteEdicao({...clienteEdicao, celular: e.target.value})} placeholder="Celular" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Tags de Classificação (separadas por vírgula)</label>
                <input 
                  type="text" 
                  className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-purple-300 font-bold outline-none focus:border-purple-600 text-sm" 
                  value={clienteEdicao.tags || ''} 
                  onChange={e => setClienteEdicao({...clienteEdicao, tags: e.target.value})} 
                  placeholder="Ex: Vip, Atacado..." 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Endereço Completo</label>
                <input className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" value={clienteEdicao.endereco} onChange={e => setClienteEdicao({...clienteEdicao, endereco: e.target.value})} placeholder="Endereço Completo" />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Cidade</label>
                  <input className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" value={clienteEdicao.cidade} onChange={e => setClienteEdicao({...clienteEdicao, cidade: e.target.value})} placeholder="Cidade" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">UF</label>
                  <input className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-black text-center uppercase outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" maxLength={2} value={clienteEdicao.estado} onChange={e => setClienteEdicao({...clienteEdicao, estado: e.target.value})} placeholder="UF" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Observações</label>
                <textarea className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-white font-medium resize-none outline-none focus:border-emerald-600 placeholder-gray-600 text-sm" rows={3} value={clienteEdicao.observacoes} onChange={e => setClienteEdicao({...clienteEdicao, observacoes: e.target.value})} placeholder="Observações..." />
              </div>
              
              <button onClick={() => handleUpdateCliente(clienteEdicao.id)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 mt-2 rounded-md font-black uppercase text-xs tracking-wider border border-emerald-700 cursor-pointer flex items-center justify-center gap-2 transition-all">
                Salvar Alterações <Save size={16}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
