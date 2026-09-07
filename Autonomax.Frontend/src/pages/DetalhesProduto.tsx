import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  ArrowLeft, Package, Wrench, Receipt, DollarSign,
  ChevronLeft, ChevronRight, TrendingUp, Calendar,
  Tag, ChevronDown, ChevronUp, Edit3, Trash2,
  X, Save, Boxes, User,
  QrCode, Coins, CreditCard
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import api from '../services/api';

interface ProdutoServico {
  id: number;
  nome: string;
  descricao?: string;
  categoria?: string;
  preco: number;
  ehServico: boolean;
  dataCriacao?: string;
  negocioId: number;
}

interface ItemVenda {
  nome: string;
  quantidade: number;
}

interface TransacaoVinculada {
  id: number;
  descricao: string;
  valor: number;
  tipo: string;
  status: string;
  metodoPagamento: string;
  data: string;
  clienteId?: number | null;
  cliente?: { id: number; nome: string };
  itens?: ItemVenda[];
  quantidadeItem: number;
}

interface MesEvolucao {
  mes: string;
  mesNumero: number;
  faturamento: number;
  quantidade: number;
}

interface DadosDetalhesProduto {
  produto: ProdutoServico;
  totalFaturado: number;
  quantidadeTotal: number;
  qtdTransacoes: number;
  ticketMedio: number;
  ultimaVenda?: string;
  ano: number;
  evolucaoMensal: MesEvolucao[];
  transacoes: TransacaoVinculada[];
}

export function DetalhesProduto() {
  const { id } = useParams<{ id: string }>();
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  const [anoAtivo, setAnoAtivo] = useState(new Date().getFullYear());
  const [dados, setDados] = useState<DadosDetalhesProduto | null>(null);
  const [carregando, setCarregando] = useState(true);
  
  // Card de Performance / Gráfico recolhido por padrão
  const [graficoAberto, setGraficoAberto] = useState(false);
  
  // Card de transação expandido
  const [itemAberto, setItemAberto] = useState<number | null>(null);
  const [tipoGrafico, setTipoGrafico] = useState<'faturamento' | 'quantidade'>('faturamento');

  // Paginação das vendas
  const [paginaVendas, setPaginaVendas] = useState(1);
  const VENDAS_POR_PAGINA = 10;

  // Modal de edição do produto
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [itemEdicao, setItemEdicao] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    preco: '',
    ehServico: false
  });

  // Modal de edição de transação
  const [transacaoEditando, setTransacaoEditando] = useState<TransacaoVinculada | null>(null);
  const [formTransacaoEdicao, setFormTransacaoEdicao] = useState({
    descricao: '',
    valor: '',
    data: '',
    status: 'Pago',
    metodoPagamento: 'Pix'
  });

  const formatarDataLocal = (dataISO: string) => {
    const data = new Date(dataISO);
    data.setMinutes(data.getMinutes() + data.getTimezoneOffset());
    return data;
  };

  const calcularTempoDesde = (dataISO: string) => {
    const dataPedido = formatarDataLocal(dataISO);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataPedido.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(hoje.getTime() - dataPedido.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    return `há ${diffDays} dias`;
  };

  const carregarDados = useCallback(async () => {
    if (!id || !negocioId) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const response = await api.get(`/ProdutosServicos/${id}/detalhes`, {
        params: { negocioId: Number(negocioId), ano: anoAtivo }
      });
      setDados(response.data);
      if (response.data.produto) {
        setItemEdicao({
          nome: response.data.produto.nome,
          descricao: response.data.produto.descricao || '',
          categoria: response.data.produto.categoria || '',
          preco: String(response.data.produto.preco || ''),
          ehServico: response.data.produto.ehServico
        });
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes do produto:", err);
    } finally {
      setCarregando(false);
    }
  }, [id, negocioId, anoAtivo]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function handleSalvarEdicao() {
    if (!id || !itemEdicao.nome.trim()) {
      alert("O nome é obrigatório.");
      return;
    }

    try {
      await api.put(`/ProdutosServicos/${id}`, {
        nome: itemEdicao.nome.trim(),
        descricao: itemEdicao.descricao.trim(),
        categoria: itemEdicao.categoria?.trim() || null,
        preco: Number(itemEdicao.preco) || 0,
        ehServico: itemEdicao.ehServico
      });
      setModalEdicaoAberto(false);
      carregarDados();
    } catch (err) {
      alert("Erro ao atualizar o item.");
    }
  }

  // Deletar lançamento
  async function handleDeletarTransacao(transacaoId: number) {
    if (!confirm("Tem certeza que deseja excluir esta venda do fluxo de caixa?")) return;
    try {
      await api.delete(`/Transacoes/${transacaoId}`);
      carregarDados();
    } catch (err) {
      alert("Erro ao excluir transação.");
    }
  }

  // Abrir modal de edição da transação
  function abrirEdicaoTransacao(t: TransacaoVinculada) {
    setTransacaoEditando(t);
    setFormTransacaoEdicao({
      descricao: t.descricao,
      valor: String(t.valor),
      data: t.data.split('T')[0],
      status: t.status,
      metodoPagamento: t.metodoPagamento
    });
  }

  // Salvar alteração da transação
  async function handleSalvarEdicaoTransacao() {
    if (!transacaoEditando) return;
    try {
      const dataAjustada = new Date(formTransacaoEdicao.data + 'T12:00:00');
      await api.put(`/Transacoes/${transacaoEditando.id}`, {
        ...transacaoEditando,
        descricao: formTransacaoEdicao.descricao,
        valor: Number(formTransacaoEdicao.valor) || 0,
        status: formTransacaoEdicao.status,
        metodoPagamento: formTransacaoEdicao.metodoPagamento,
        data: dataAjustada.toISOString(),
        negocioId: Number(negocioId),
        clienteId: transacaoEditando.clienteId || null
      });
      setTransacaoEditando(null);
      carregarDados();
    } catch (err) {
      alert("Erro ao atualizar transação.");
    }
  }

  // Custom Tooltip do Recharts exibindo Faturamento E Quantidade
  const CustomTooltipGrafico = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as MesEvolucao;
      return (
        <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 shadow-2xl text-xs space-y-2 min-w-[170px]">
          <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
            <span className="font-black text-gray-200 uppercase tracking-wider">Mês de {label}</span>
            <span className="text-[10px] font-bold text-gray-500">{anoAtivo}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-400 font-medium flex items-center gap-1">
                <DollarSign size={12} className="text-emerald-400" /> Faturamento:
              </span>
              <strong className="text-emerald-400 font-black">
                R$ {Number(data.faturamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-400 font-medium flex items-center gap-1">
                <Boxes size={12} className="text-teal-400" /> Quantidade:
              </span>
              <strong className="text-teal-400 font-black">
                {data.quantidade || 0} {data.quantidade === 1 ? 'unid.' : 'unids.'}
              </strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const { produto, totalFaturado, quantidadeTotal, ultimaVenda, evolucaoMensal, transacoes = [] } = dados || {};

  // Paginação das vendas
  const totalPaginasVendas = Math.ceil(transacoes.length / VENDAS_POR_PAGINA) || 1;
  const transacoesPaginadas = useMemo(() => {
    const inicio = (paginaVendas - 1) * VENDAS_POR_PAGINA;
    return transacoes.slice(inicio, inicio + VENDAS_POR_PAGINA);
  }, [transacoes, paginaVendas]);

  if (carregando) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-emerald-500 font-black uppercase tracking-widest gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400">Carregando análise do item...</p>
        </div>
      </Layout>
    );
  }

  if (!dados || !produto) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-950 pt-12 px-4 text-center">
          <div className="max-w-md mx-auto bg-gray-900 p-8 rounded-xl border border-gray-800">
            <Package size={40} className="mx-auto text-gray-600 mb-3" />
            <h3 className="text-base font-black text-gray-200 uppercase">Item não encontrado</h3>
            <p className="text-xs text-gray-400 mt-2">O produto ou serviço solicitado não foi localizado.</p>
            <Link 
              to="/catalogo" 
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-emerald-700 hover:bg-emerald-500"
            >
              <ArrowLeft size={16} /> Voltar ao Catálogo
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-6 sm:pt-8 pb-16 px-3 sm:px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* HEADER PRINCIPAL RESPONSIVO */}
          <div className="bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
              <Link 
                to="/catalogo" 
                className="p-2 sm:p-2.5 bg-gray-950 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg border border-gray-800 transition-all flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0"
                title="Voltar ao Catálogo"
              >
                <ArrowLeft size={18} />
              </Link>
              
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-xl border flex-shrink-0 ${
                produto.ehServico 
                  ? 'bg-blue-950/50 text-blue-400 border-blue-900/60' 
                  : 'bg-teal-950/50 text-teal-400 border-teal-900/60'
              }`}>
                {produto.ehServico ? <Wrench size={22} /> : <Package size={22} />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-xl font-black text-white uppercase tracking-tight break-words">
                    {produto.nome}
                  </h1>

                  {/* Tag / Categoria */}
                  {produto.categoria && (
                    <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider border bg-purple-950/40 text-purple-300 border-purple-900/50 flex items-center gap-1 flex-shrink-0">
                      <Tag size={10} /> {produto.categoria}
                    </span>
                  )}

                  {/* Tipo */}
                  <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider border flex-shrink-0 ${
                    produto.ehServico 
                      ? 'bg-blue-950/40 text-blue-400 border-blue-900/50' 
                      : 'bg-teal-950/40 text-teal-400 border-teal-900/50'
                  }`}>
                    {produto.ehServico ? 'Serviço' : 'Produto'}
                  </span>
                </div>

                {produto.descricao && (
                  <p className="text-xs text-gray-400 font-normal mt-1 break-words">
                    {produto.descricao}
                  </p>
                )}

                {/* Data de Registro do Item */}
                <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">
                  <Calendar size={11} className="text-gray-600" />
                  Cadastrado em {new Date(produto.dataCriacao || Date.now()).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-gray-800/80 pt-3 sm:pt-0">
              {/* Preço Unitário */}
              <div className="bg-gray-950 px-4 py-2.5 rounded-lg border border-gray-800 text-center sm:text-right flex-1 sm:flex-initial">
                <span className="text-sm sm:text-base font-black text-emerald-400">
                  R$ {Number(produto.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Botão de Edição */}
              <button
                type="button"
                onClick={() => setModalEdicaoAberto(true)}
                className="p-2.5 bg-gray-950 hover:bg-gray-800 text-gray-400 hover:text-blue-400 rounded-lg border border-gray-800 transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
                title="Editar Item"
              >
                <Edit3 size={18} />
              </button>
            </div>
          </div>

          {/* GRID DE KPIS (LIMPO, IMPACTANTE E SEM REDUNDÂNCIAS) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Faturamento Total */}
            <div className="bg-gray-900 p-4 sm:p-5 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50">
                <DollarSign size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Faturamento Total</p>
                <p className="text-lg sm:text-xl font-black text-emerald-400">
                  R$ {totalFaturado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Unidades Vendidas */}
            <div className="bg-gray-900 p-4 sm:p-5 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
              <div className="p-3 bg-teal-950/50 text-teal-400 rounded-lg border border-teal-900/50">
                <Boxes size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unidades Vendidas</p>
                <p className="text-lg sm:text-xl font-black text-white">{quantidadeTotal}</p>
              </div>
            </div>

            {/* Última Venda */}
            <div className="bg-gray-900 p-4 sm:p-5 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
              <div className="p-3 bg-amber-950/50 text-amber-400 rounded-lg border border-amber-900/50">
                <Calendar size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Última Venda</p>
                <p className="text-base sm:text-lg font-black text-amber-400">
                  {ultimaVenda ? `${new Date(ultimaVenda).toLocaleDateString('pt-BR')} (${calcularTempoDesde(ultimaVenda)})` : 'Nenhuma venda'}
                </p>
              </div>
            </div>
          </div>

          {/* CARD DE PERFORMANCE MÊS A MÊS (OCULTO POR PADRÃO COM FLECHINHA) */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-sm overflow-hidden">
            <button 
              type="button"
              onClick={() => setGraficoAberto(!graficoAberto)}
              className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-gray-800/60 transition-colors border-none outline-none cursor-pointer bg-transparent text-left"
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp size={18} className="text-emerald-400" />
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-wider">
                  Performance Mês a Mês ({anoAtivo})
                </h3>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-[10px] font-bold uppercase text-gray-500 hidden sm:inline">
                  {graficoAberto ? 'Ocultar Gráfico' : 'Ver Gráfico'}
                </span>
                {graficoAberto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {graficoAberto && (
              <div className="p-4 sm:p-6 border-t border-gray-800/80 space-y-4 animate-in slide-in-from-top duration-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <span className="text-xs text-gray-400 font-medium">
                    Evolução das vendas deste item ao longo do ano de {anoAtivo}.
                  </span>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                    {/* Alternador de Métrica (Faturamento vs Quantidade) */}
                    <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800">
                      <button
                        type="button"
                        onClick={() => setTipoGrafico('faturamento')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                          tipoGrafico === 'faturamento' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        Faturamento (R$)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoGrafico('quantidade')}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                          tipoGrafico === 'quantidade' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        Quantidade (Unid.)
                      </button>
                    </div>

                    {/* Seletor de Ano */}
                    <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800">
                      <button
                        type="button"
                        onClick={() => setAnoAtivo(prev => prev - 1)}
                        className="p-1.5 text-gray-400 hover:text-white bg-transparent border-none cursor-pointer rounded hover:bg-gray-900"
                        title="Ano Anterior"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-2 text-xs font-black text-white">{anoAtivo}</span>
                      <button
                        type="button"
                        onClick={() => setAnoAtivo(prev => prev + 1)}
                        className="p-1.5 text-gray-400 hover:text-white bg-transparent border-none cursor-pointer rounded hover:bg-gray-900"
                        title="Próximo Ano"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Gráfico Recharts com Tooltip exibindo Faturamento E Quantidade */}
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    {tipoGrafico === 'faturamento' ? (
                      <AreaChart data={evolucaoMensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradienteFaturamento" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="mes" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis 
                          stroke="#6b7280" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={val => `R$ ${val}`} 
                        />
                        <Tooltip content={<CustomTooltipGrafico />} />
                        <Area 
                          type="monotone" 
                          dataKey="faturamento" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#gradienteFaturamento)" 
                        />
                      </AreaChart>
                    ) : (
                      <BarChart data={evolucaoMensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="mes" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltipGrafico />} />
                        <Bar dataKey="quantidade" fill="#0d9488" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* ONDE FOI VENDIDO (CARDS DE VENDAS COM DATA À ESQUERDA, ITENS EM TAGS E PAGINAÇÃO) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-black text-gray-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <Receipt size={16} className="text-emerald-400" />
                Onde Foi Vendido ({transacoes.length} Lançamentos)
              </h3>
            </div>

            {transacoes.length === 0 ? (
              <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 text-center">
                <Receipt size={32} className="mx-auto text-gray-600 mb-2" />
                <p className="text-xs font-bold text-gray-400 uppercase">Nenhuma venda registrada ainda</p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Assim que você lançar vendas com este item no fluxo de caixa, os registros e clientes aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {transacoesPaginadas.map((t) => {
                  const dataObj = formatarDataLocal(t.data);
                  const isAberta = itemAberto === t.id;

                  return (
                    <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all shadow-sm">
                      {/* HEADER DO CARD DE VENDA (DATA À ESQUERDA, CLIENTE, TAG 1X 2X, VALOR) */}
                      <button 
                        type="button"
                        onClick={() => setItemAberto(isAberta ? null : t.id)}
                        className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-transparent border-none cursor-pointer outline-none text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Bloco de Data à Esquerda */}
                          <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center border bg-emerald-950/40 border-emerald-900/60 text-emerald-400 flex-shrink-0">
                            <span className="text-xs font-black leading-none">
                              {dataObj.getDate().toString().padStart(2, '0')}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mt-0.5">
                              {dataObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                            </span>
                          </div>

                          {/* Nome do Cliente e Tag de Quantidade (1x, 2x...) */}
                          <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-gray-200 uppercase tracking-tight truncate">
                              {t.cliente?.nome || "Venda Avulsa"}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-900/50 flex-shrink-0">
                              {t.quantidadeItem}x
                            </span>
                          </div>
                        </div>

                        {/* Valor Total da Venda e Flecha */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                            R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <div className="text-gray-500">
                            {isAberta ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                      </button>

                      {/* DETALHES EXPANSÍVEIS AO CLICAR */}
                      {isAberta && (
                        <div className="px-4 pb-4 pt-2.5 space-y-3 bg-gray-950/40 border-t border-gray-800/80 animate-in slide-in-from-top duration-200 text-xs">
                          {/* Itens inclusos nesta venda envolvidos diretamente em Tags */}
                          <div className="flex flex-wrap gap-1.5">
                            {t.itens && t.itens.length > 0 ? (
                              t.itens.map((it, idx) => (
                                <span key={idx} className="bg-gray-900 border border-gray-800 px-2.5 py-1 rounded text-gray-300 text-xs">
                                  <strong className="text-emerald-400">{it.quantidade}x</strong> {it.nome}
                                </span>
                              ))
                            ) : (
                              <span className="bg-gray-900 border border-gray-800 px-2.5 py-1 rounded text-gray-300 text-xs">{t.descricao}</span>
                            )}
                          </div>

                          {/* Rodapé com badges e Ações: Ver Cliente (somente ícone), Editar, Deletar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-800/60">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                                t.status === 'Pago' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' : 'bg-amber-950/60 text-amber-400 border border-amber-900/50'
                              }`}>
                                {t.status}
                              </span>
                              <span className="bg-gray-900 border border-gray-800 px-2.5 py-1 rounded text-[9px] font-black uppercase text-gray-400">
                                {t.metodoPagamento}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {t.clienteId && (
                                <Link 
                                  to={`/clientes/${t.clienteId}`} 
                                  className="p-2 text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-md cursor-pointer hover:bg-emerald-900/40 transition-all flex items-center justify-center"
                                  title="Ver Cliente"
                                >
                                  <User size={14} />
                                </Link>
                              )}
                              <button 
                                type="button"
                                onClick={() => abrirEdicaoTransacao(t)} 
                                className="p-2 text-blue-400 bg-blue-950/40 border border-blue-900 rounded-md cursor-pointer hover:bg-blue-900/40 transition-all flex items-center justify-center"
                                title="Editar Transação"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeletarTransacao(t.id)} 
                                className="p-2 text-red-400 bg-red-950/40 border border-red-900 rounded-md cursor-pointer hover:bg-red-900/40 transition-all flex items-center justify-center"
                                title="Excluir Transação"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* CONTROLE DE PAGINAÇÃO DAS VENDAS */}
                {totalPaginasVendas > 1 && (
                  <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 mt-3">
                    <span className="text-xs font-medium text-gray-400">
                      Mostrando <strong className="text-white">{(paginaVendas - 1) * VENDAS_POR_PAGINA + 1}</strong> a <strong className="text-white">{Math.min(paginaVendas * VENDAS_POR_PAGINA, transacoes.length)}</strong> de <strong className="text-emerald-400">{transacoes.length}</strong> vendas
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={paginaVendas === 1}
                        onClick={() => setPaginaVendas(prev => Math.max(prev - 1, 1))}
                        className="px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-md text-xs font-bold text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-all"
                      >
                        <ChevronLeft size={14} /> Anterior
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPaginasVendas }, (_, i) => i + 1).map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setPaginaVendas(num)}
                            className={`w-8 h-8 rounded-md text-xs font-black border transition-all cursor-pointer ${
                              paginaVendas === num
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
                        disabled={paginaVendas === totalPaginasVendas}
                        onClick={() => setPaginaVendas(prev => Math.min(prev + 1, totalPaginasVendas))}
                        className="px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-md text-xs font-bold text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-all"
                      >
                        Próxima <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MODAL DE EDIÇÃO DO PRODUTO */}
      {modalEdicaoAberto && (
        <div className="fixed inset-0 bg-gray-950/70 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-gray-900 w-full md:max-w-xl h-[95vh] md:h-auto md:max-h-[95vh] rounded-t-lg md:rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-800 animate-in slide-in-from-bottom md:zoom-in duration-200">
            <div className="bg-gray-950 px-6 py-5 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-400"/>
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-widest">Ajustar Item</h3>
              </div>
              <button 
                type="button"
                onClick={() => setModalEdicaoAberto(false)} 
                className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer p-1 transition-colors"
              >
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nome do Item *</label>
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
                    onChange={e => setItemEdicao({...itemEdicao, preco: e.target.value})} 
                    placeholder="0,00" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Tag / Categoria</label>
                  <input 
                    type="text"
                    className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-purple-300 font-bold outline-none focus:border-purple-600 text-sm" 
                    value={itemEdicao.categoria} 
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
                  value={itemEdicao.descricao} 
                  onChange={e => setItemEdicao({...itemEdicao, descricao: e.target.value})} 
                  placeholder="Descrição..." 
                />
              </div>
              
              <button 
                type="button"
                onClick={handleSalvarEdicao} 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 mt-2 rounded-md font-black uppercase text-xs tracking-wider border border-emerald-700 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                Salvar Alterações <Save size={16}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE TRANSAÇÃO VINCULADA */}
      {transacaoEditando && (
        <div className="fixed inset-0 bg-gray-950/70 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-gray-900 w-full md:max-w-xl h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-lg md:rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-800 animate-in slide-in-from-bottom md:zoom-in duration-200">
            <div className="bg-gray-950 px-6 py-5 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-400"/>
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-widest">Ajustar Transação de Venda</h3>
              </div>
              <button 
                type="button"
                onClick={() => setTransacaoEditando(null)} 
                className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer p-1 transition-colors"
              >
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Descrição</label>
                <input 
                  className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md text-white font-medium outline-none focus:border-emerald-600 text-sm" 
                  value={formTransacaoEdicao.descricao} 
                  onChange={e => setFormTransacaoEdicao({...formTransacaoEdicao, descricao: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Valor Total (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md text-emerald-400 font-black outline-none focus:border-emerald-600 text-sm" 
                    value={formTransacaoEdicao.valor} 
                    onChange={e => setFormTransacaoEdicao({...formTransacaoEdicao, valor: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Data</label>
                  <input 
                    type="date"
                    className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md text-gray-300 font-bold outline-none focus:border-emerald-600 text-sm" 
                    value={formTransacaoEdicao.data} 
                    onChange={e => setFormTransacaoEdicao({...formTransacaoEdicao, data: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Status</label>
                  <div className="flex bg-gray-950 p-1 rounded-md border border-gray-800 gap-1">
                    <button 
                      type="button" 
                      onClick={() => setFormTransacaoEdicao({...formTransacaoEdicao, status: 'Pago'})}
                      className={`flex-1 py-2 rounded-md font-black text-[10px] uppercase tracking-wider border-none cursor-pointer ${
                        formTransacaoEdicao.status === 'Pago' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-500'
                      }`}
                    >
                      Pago
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormTransacaoEdicao({...formTransacaoEdicao, status: 'Pendente'})}
                      className={`flex-1 py-2 rounded-md font-black text-[10px] uppercase tracking-wider border-none cursor-pointer ${
                        formTransacaoEdicao.status === 'Pendente' ? 'bg-amber-500 text-white' : 'bg-transparent text-gray-500'
                      }`}
                    >
                      Pendente
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Método de Pagamento</label>
                  <div className="flex bg-gray-950 p-1 rounded-md border border-gray-800 gap-1">
                    <button 
                      type="button" 
                      onClick={() => setFormTransacaoEdicao({...formTransacaoEdicao, metodoPagamento: 'Pix'})}
                      className={`flex-1 py-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${
                        formTransacaoEdicao.metodoPagamento === 'Pix' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-transparent text-gray-500'
                      }`}
                    >
                      <QrCode size={14} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormTransacaoEdicao({...formTransacaoEdicao, metodoPagamento: 'Dinheiro'})}
                      className={`flex-1 py-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${
                        formTransacaoEdicao.metodoPagamento === 'Dinheiro' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-transparent text-gray-500'
                      }`}
                    >
                      <Coins size={14} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormTransacaoEdicao({...formTransacaoEdicao, metodoPagamento: 'Cartão'})}
                      className={`flex-1 py-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${
                        formTransacaoEdicao.metodoPagamento === 'Cartão' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-transparent text-gray-500'
                      }`}
                    >
                      <CreditCard size={14} />
                    </button>
                  </div>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={handleSalvarEdicaoTransacao} 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 mt-2 rounded-md font-black uppercase text-xs tracking-wider border border-emerald-700 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                Salvar Transação <Save size={16}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
