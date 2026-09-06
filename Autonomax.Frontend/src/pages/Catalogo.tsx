import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { 
  Trash2, Edit3, Save, X, Search, 
  ArrowDownWideNarrow, Plus, Package, 
  Wrench, ChevronDown, ChevronUp, DollarSign, 
  Boxes, Sparkles
} from 'lucide-react';
import api from '../services/api';

export interface ProdutoServico {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  ehServico: boolean;
  negocioId: number;
}

export function Catalogo() {
  const [itens, setItens] = useState<ProdutoServico[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  
  const [novoItem, setNovoItem] = useState({
    nome: '',
    descricao: '',
    preco: '',
    ehServico: false
  });

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [itemEdicao, setItemEdicao] = useState<ProdutoServico | null>(null);

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'produtos' | 'servicos'>('todos');
  const [ordenacao, setOrdenacao] = useState('nome-asc');

  const currentNegocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  useEffect(() => {
    carregarItens();
  }, [currentNegocioId]);

  async function carregarItens() {
    if (!currentNegocioId) return;
    setCarregando(true);
    try {
      const response = await api.get(`/ProdutosServicos/por-negocio/${currentNegocioId}`);
      setItens(response.data || []);
    } catch (err) {
      console.error("Erro ao carregar itens do catálogo:", err);
    } finally {
      setCarregando(false);
    }
  }

  async function handleAddItem() {
    if (!novoItem.nome.trim()) {
      alert("Por favor, informe o nome do item.");
      return;
    }
    if (!novoItem.preco || Number(novoItem.preco) <= 0) {
      alert("Por favor, informe um preço válido maior que zero.");
      return;
    }
    if (!currentNegocioId) return;

    try {
      await api.post('/ProdutosServicos', {
        nome: novoItem.nome.trim(),
        descricao: novoItem.descricao.trim(),
        preco: Number(novoItem.preco),
        ehServico: novoItem.ehServico,
        negocioId: Number(currentNegocioId)
      });
      setNovoItem({ nome: '', descricao: '', preco: '', ehServico: false });
      setFormAberto(false);
      carregarItens();
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
    if (itemEdicao.preco <= 0) {
      alert("O preço deve ser maior que zero.");
      return;
    }

    try {
      await api.put(`/ProdutosServicos/${id}`, {
        nome: itemEdicao.nome.trim(),
        descricao: itemEdicao.descricao,
        preco: Number(itemEdicao.preco),
        ehServico: itemEdicao.ehServico
      });
      setEditandoId(null);
      carregarItens();
    } catch (err) {
      alert("Erro ao atualizar item.");
    }
  }

  async function handleDeleteItem(id: number) {
    if (!confirm("Tem certeza que deseja remover este item do catálogo?")) return;
    try {
      await api.delete(`/ProdutosServicos/${id}`);
      carregarItens();
    } catch (err) {
      alert("Erro ao excluir item.");
    }
  }

  // Estatísticas do Catálogo
  const metricas = useMemo(() => {
    const totalItens = itens.length;
    const totalProdutos = itens.filter(i => !i.ehServico).length;
    const totalServicos = itens.filter(i => i.ehServico).length;
    const somaPrecos = itens.reduce((acc, i) => acc + (Number(i.preco) || 0), 0);
    const precoMedio = totalItens > 0 ? somaPrecos / totalItens : 0;

    return { totalItens, totalProdutos, totalServicos, precoMedio };
  }, [itens]);

  // Filtragem e Ordenação
  const itensFiltrados = useMemo(() => {
    const termo = filtroTexto.trim().toLowerCase();
    return itens
      .filter(item => {
        if (filtroTipo === 'produtos' && item.ehServico) return false;
        if (filtroTipo === 'servicos' && !item.ehServico) return false;

        if (!termo) return true;
        const nomeMatch = item.nome?.toLowerCase().includes(termo);
        const descMatch = item.descricao?.toLowerCase().includes(termo);
        return nomeMatch || descMatch;
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
  }, [itens, filtroTexto, filtroTipo, ordenacao]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-5">
          
          {/* HEADER E KPIS DO CATÁLOGO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Serviços / Horas</p>
                <p className="text-xl font-black text-blue-400">{metricas.totalServicos}</p>
              </div>
            </div>

            {/* Preço Médio */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
              <div className="p-3 bg-amber-950/50 text-amber-400 rounded-lg border border-amber-900/50">
                <DollarSign size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Preço Médio</p>
                <p className="text-xl font-black text-amber-400">
                  R$ {metricas.precoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* PAINEL DE CONTROLE (BUSCA, TIPO E ORDENAÇÃO) */}
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50 hidden md:flex">
                <Package size={22} />
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black tracking-tight uppercase text-gray-100 whitespace-nowrap">Catálogo</h2>
                <div className="px-2.5 py-1 bg-emerald-950/30 border border-emerald-900/50 rounded-md flex items-center justify-center">
                  <span className="text-[10px] font-black text-emerald-400 tracking-wider">
                    {itensFiltrados.length} {itensFiltrados.length === 1 ? 'ITEM' : 'ITENS'}
                  </span>
                </div>
              </div>
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

              {/* Campo de Busca */}
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text"
                  placeholder="Localizar item..."
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

          {/* CADASTRO RETRÁTIL DE NOVO PRODUTO / SERVIÇO */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <button 
              onClick={() => setFormAberto(!formAberto)} 
              className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between hover:bg-gray-800/80 transition-colors border-none outline-none cursor-pointer border-b border-gray-800"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400" />
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-wider">Novo Produto ou Serviço</h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span>{formAberto ? 'Fechar' : 'Cadastrar Item'}</span>
                {formAberto ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </button>
            
            {formAberto && (
              <div className="p-5 md:p-6 space-y-4 bg-gray-900 animate-in slide-in-from-top duration-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Nome */}
                  <div className="md:col-span-6">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Nome do Item *
                    </label>
                    <input 
                      className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm transition-all" 
                      value={novoItem.nome} 
                      onChange={e => setNovoItem({...novoItem, nome: e.target.value})} 
                      placeholder="Ex: Consultoria em TI, Troca de Tela, Cabo HDMI..." 
                    />
                  </div>

                  {/* Preço Unitário */}
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Preço Padrão (R$) *
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
                    Descrição ou Detalhes (Opcional)
                  </label>
                  <textarea 
                    rows={2} 
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none focus:border-emerald-600 text-white placeholder-gray-600 font-medium text-sm resize-none transition-all" 
                    value={novoItem.descricao} 
                    onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} 
                    placeholder="Especificações técnicas, garantia, o que está incluso no serviço..." 
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

          {/* LISTA DE ITENS DO CATÁLOGO */}
          <div className="flex flex-col gap-2.5">
            {carregando ? (
              <div className="bg-gray-900 p-12 rounded-xl border border-gray-800 text-center">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Carregando catálogo...</p>
              </div>
            ) : itensFiltrados.length === 0 ? (
              <div className="bg-gray-900 p-12 rounded-xl border border-dashed border-gray-800 text-center">
                <Boxes size={36} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-1">Nenhum item encontrado</p>
                <p className="text-gray-600 text-xs font-medium">
                  {filtroTexto || filtroTipo !== 'todos' 
                    ? "Tente ajustar os filtros ou os termos da busca." 
                    : "Cadastre seu primeiro produto ou serviço acima para agilizar seus lançamentos!"}
                </p>
              </div>
            ) : (
              itensFiltrados.map(item => (
                <div 
                  key={item.id} 
                  className="bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 hover:bg-gray-900/90 transition-all p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  {/* IDENTIFICAÇÃO DO ITEM */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-black text-lg border flex-shrink-0 ${
                      item.ehServico 
                        ? 'bg-blue-950/50 text-blue-400 border-blue-900/60' 
                        : 'bg-teal-950/50 text-teal-400 border-teal-900/60'
                    }`}>
                      {item.ehServico ? <Wrench size={20} /> : <Package size={20} />}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-gray-200 uppercase text-sm tracking-tight truncate">
                          {item.nome}
                        </h4>
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
                  <div className="flex items-center justify-between md:justify-end gap-4">
                    {/* Preço Unitário */}
                    <div className="bg-gray-950 px-4 py-2 rounded-lg border border-gray-800 text-right min-w-[120px]">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Preço Padrão</span>
                      <span className="text-base font-black text-emerald-400">
                        R$ {Number(item.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-1">
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Preço Padrão (R$)</label>
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
