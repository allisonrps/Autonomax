import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  ArrowLeft, Package, Wrench, Receipt, DollarSign,
  ChevronLeft, ChevronRight, TrendingUp,
  Tag, CheckCircle2, ChevronDown, ChevronUp, Edit3,
  X, Save, Boxes, HandCoins, User, ArrowUpRight
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
  preco: number;
  ehServico: boolean;
  negocioId: number;
}

interface TransacaoVinculada {
  id: number;
  descricao: string;
  valor: number;
  tipo: string;
  status: string;
  metodoPagamento: string;
  data: string;
  cliente?: { id: number; nome: string };
  itens?: { nome: string; quantidade: number }[];
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
  const [itemAberto, setItemAberto] = useState<number | null>(null);
  const [tipoGrafico, setTipoGrafico] = useState<'faturamento' | 'quantidade'>('faturamento');

  // Modal de edição do produto
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [itemEdicao, setItemEdicao] = useState({
    nome: '',
    descricao: '',
    preco: '',
    ehServico: false
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
        preco: Number(itemEdicao.preco) || 0,
        ehServico: itemEdicao.ehServico
      });
      setModalEdicaoAberto(false);
      carregarDados();
    } catch (err) {
      alert("Erro ao atualizar o item.");
    }
  }

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

  if (!dados || !dados.produto) {
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

  const { produto, totalFaturado, quantidadeTotal, qtdTransacoes, ticketMedio, evolucaoMensal, transacoes } = dados;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* HEADER PRINCIPAL */}
          <div className="bg-gray-900 p-5 md:p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <Link 
                to="/catalogo" 
                className="p-2.5 bg-gray-950 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg border border-gray-800 transition-all flex items-center justify-center"
                title="Voltar ao Catálogo"
              >
                <ArrowLeft size={18} />
              </Link>
              
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border flex-shrink-0 ${
                produto.ehServico 
                  ? 'bg-blue-950/50 text-blue-400 border-blue-900/60' 
                  : 'bg-teal-950/50 text-teal-400 border-teal-900/60'
              }`}>
                {produto.ehServico ? <Wrench size={22} /> : <Package size={22} />}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
                    {produto.nome}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                    produto.ehServico 
                      ? 'bg-blue-950/40 text-blue-400 border-blue-900/50' 
                      : 'bg-teal-950/40 text-teal-400 border-teal-900/50'
                  }`}>
                    {produto.ehServico ? 'Serviço' : 'Produto'}
                  </span>
                </div>
                {produto.descricao && (
                  <p className="text-xs text-gray-400 font-normal mt-0.5">
                    {produto.descricao}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              {/* Preço Cadastrado */}
              <div className="bg-gray-950 px-4 py-2 rounded-lg border border-gray-800 text-right">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Preço Padrão</span>
                <span className="text-base font-black text-emerald-400">
                  R$ {Number(produto.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Botão de Edição */}
              <button
                onClick={() => setModalEdicaoAberto(true)}
                className="p-2.5 bg-gray-950 hover:bg-gray-800 text-gray-400 hover:text-blue-400 rounded-lg border border-gray-800 transition-all cursor-pointer flex items-center justify-center"
                title="Editar Item"
              >
                <Edit3 size={18} />
              </button>
            </div>
          </div>

          {/* GRID DE KPIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Faturamento Total */}
            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50">
                <DollarSign size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Faturamento Total</p>
                <p className="text-xl font-black text-emerald-400">
                  R$ {totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Quantidade Total Vendida */}
            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
              <div className="p-3 bg-teal-950/50 text-teal-400 rounded-lg border border-teal-900/50">
                <Boxes size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qtd. Total Vendida</p>
                <p className="text-xl font-black text-teal-400">
                  {quantidadeTotal} {quantidadeTotal === 1 ? 'unidade' : 'unidades'}
                </p>
              </div>
            </div>

            {/* Lançamentos Vinculados */}
            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
              <div className="p-3 bg-blue-950/50 text-blue-400 rounded-lg border border-blue-900/50">
                <Receipt size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vendas / Lançamentos</p>
                <p className="text-xl font-black text-blue-400">
                  {qtdTransacoes} {qtdTransacoes === 1 ? 'venda' : 'vendas'}
                </p>
              </div>
            </div>

            {/* Ticket Médio */}
            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
              <div className="p-3 bg-amber-950/50 text-amber-400 rounded-lg border border-amber-900/50">
                <HandCoins size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ticket Médio p/ Venda</p>
                <p className="text-xl font-black text-amber-400">
                  R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* PAINEL DO GRÁFICO MÊS A MÊS */}
          <div className="bg-gray-900 p-5 md:p-6 rounded-xl border border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">
                    Evolução Mensal ({anoAtivo})
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">
                    Desempenho de vendas do item ao longo dos meses
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                {/* Seletor de Tipo de Gráfico */}
                <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800 text-[10px] font-bold uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => setTipoGrafico('faturamento')}
                    className={`px-3 py-1.5 rounded transition-all border-none cursor-pointer ${
                      tipoGrafico === 'faturamento' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    R$ Faturamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoGrafico('quantidade')}
                    className={`px-3 py-1.5 rounded transition-all border-none cursor-pointer ${
                      tipoGrafico === 'quantidade' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Quantidade
                  </button>
                </div>

                {/* Seletor de Ano */}
                <div className="flex items-center gap-1 bg-gray-950 border border-gray-800 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAnoAtivo(a => a - 1)}
                    className="p-1.5 text-gray-500 hover:text-white bg-transparent border-none cursor-pointer"
                    title="Ano Anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-black text-xs px-2 text-white">{anoAtivo}</span>
                  <button
                    type="button"
                    onClick={() => setAnoAtivo(a => a + 1)}
                    className="p-1.5 text-gray-500 hover:text-white bg-transparent border-none cursor-pointer"
                    title="Próximo Ano"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Container do Gráfico */}
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                {tipoGrafico === 'faturamento' ? (
                  <AreaChart data={evolucaoMensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis 
                      dataKey="mes" 
                      stroke="#9ca3af" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => `R$ ${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#030712', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                      formatter={(valor: any) => [`R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="faturamento" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorFaturamento)" 
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={evolucaoMensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis 
                      dataKey="mes" 
                      stroke="#9ca3af" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#030712', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                      formatter={(valor: any) => [`${valor} un`, 'Quantidade']}
                    />
                    <Bar 
                      dataKey="quantidade" 
                      fill="#14b8a6" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* ONDE FOI VENDIDO (LANÇAMENTOS VINCULADOS) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-emerald-400" />
                <h2 className="text-sm font-black text-gray-200 uppercase tracking-wider">
                  Vendas & Lançamentos Vinculados
                </h2>
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded-md">
                {transacoes.length} {transacoes.length === 1 ? 'LANÇAMENTO' : 'LANÇAMENTOS'}
              </span>
            </div>

            {transacoes.length === 0 ? (
              <div className="bg-gray-900 p-12 rounded-xl border border-dashed border-gray-800 text-center">
                <Receipt size={36} className="mx-auto text-gray-600 mb-2" />
                <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Nenhuma venda encontrada para este item.</p>
                <p className="text-gray-600 text-xs font-medium mt-1">Quando você registrar vendas com este item no fluxo de caixa, elas aparecerão aqui.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {transacoes.map((t) => {
                  const dataObj = formatarDataLocal(t.data);
                  const isAberta = itemAberto === t.id;

                  return (
                    <div 
                      key={t.id} 
                      className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => setItemAberto(isAberta ? null : t.id)}
                        className="w-full flex items-center justify-between p-4 bg-transparent border-none cursor-pointer outline-none text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Dia */}
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center border bg-emerald-950/40 border-emerald-900 text-emerald-400 flex-shrink-0">
                            <span className="text-xs font-black">
                              {dataObj.getDate().toString().padStart(2, '0')}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-gray-200 uppercase tracking-tight truncate">
                                {t.cliente?.nome || "Venda Avulsa"}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-teal-950/40 text-teal-400 border border-teal-900/50">
                                {t.quantidadeItem}x neste pedido
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {dataObj.toLocaleDateString('pt-BR')} ({calcularTempoDesde(t.data)})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-sm font-black tracking-tight ${
                            t.status === 'Pendente' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {isAberta ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
                        </div>
                      </button>

                      {/* DETALHES EXPANSÍVEIS */}
                      {isAberta && (
                        <div className="px-4 pb-4 pt-1 space-y-3 bg-gray-950/30 border-t border-gray-800/60 animate-in slide-in-from-top duration-200">
                          {/* Descrição dos itens da transação */}
                          <div className="p-3 bg-gray-950/60 rounded-lg border border-gray-800 text-xs text-gray-300 font-medium">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Itens do Lançamento:</span>
                            {t.descricao}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                                t.status === 'Pago' 
                                  ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400' 
                                  : 'bg-amber-950/50 border-amber-900 text-amber-400'
                              }`}>
                                <CheckCircle2 size={11} /> {t.status}
                              </span>

                              <span className="bg-gray-950 border border-gray-800 px-2.5 py-1 rounded-md flex items-center gap-1 text-[9px] font-black uppercase text-gray-400">
                                <Tag size={10} className="text-gray-500" /> {t.metodoPagamento}
                              </span>
                            </div>

                            {t.cliente && (
                              <Link 
                                to={`/clientes/${t.cliente.id}`} 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-900/60 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors"
                              >
                                <User size={12} /> Ver Perfil do Cliente <ArrowUpRight size={12} />
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                  placeholder="Nome do produto ou serviço" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Preço Padrão (Opcional - R$)</label>
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
                onClick={handleSalvarEdicao} 
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
