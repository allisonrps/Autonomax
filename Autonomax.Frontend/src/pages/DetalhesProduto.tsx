import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  ArrowLeft, Package, Wrench, Receipt, DollarSign,
  ChevronLeft, ChevronRight, TrendingUp,
  Tag, ChevronDown, ChevronUp, Edit3,
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
  categoria?: string;
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
    categoria: '',
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

                  {/* Tag / Categoria */}
                  {produto.categoria && (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border bg-purple-950/40 text-purple-300 border-purple-900/50 flex items-center gap-1">
                      <Tag size={11} /> {produto.categoria}
                    </span>
                  )}

                  {/* Tipo */}
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
              {/* Preço Unitário (Sem o texto Preço Padrão) */}
              <div className="bg-gray-950 px-4 py-2.5 rounded-lg border border-gray-800 text-right flex items-center justify-center">
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

            {/* Unidades Vendidas */}
            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
              <div className="p-3 bg-teal-950/50 text-teal-400 rounded-lg border border-teal-900/50">
                <Boxes size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unidades Vendidas</p>
                <p className="text-xl font-black text-white">{quantidadeTotal}</p>
              </div>
            </div>

            {/* Total de Vendas (Transações) */}
            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
              <div className="p-3 bg-blue-950/50 text-blue-400 rounded-lg border border-blue-900/50">
                <Receipt size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total de Vendas</p>
                <p className="text-xl font-black text-blue-400">{qtdTransacoes}</p>
              </div>
            </div>

            {/* Ticket Médio */}
            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-sm">
              <div className="p-3 bg-amber-950/50 text-amber-400 rounded-lg border border-amber-900/50">
                <HandCoins size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ticket Médio</p>
                <p className="text-xl font-black text-amber-400">
                  R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* GRÁFICO DE EVOLUÇÃO MENSAL COM SELETOR DE ANO */}
          <div className="bg-gray-900 p-5 md:p-6 rounded-xl border border-gray-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" />
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-wider">
                  Performance Mês a Mês ({anoAtivo})
                </h3>
              </div>

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

            {/* Gráfico Recharts */}
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
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                      formatter={(value: any) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
                      labelFormatter={(label) => `Mês de ${label}`}
                    />
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
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                      formatter={(value: any) => [`${value} unidades`, 'Qtd. Vendida']}
                      labelFormatter={(label) => `Mês de ${label}`}
                    />
                    <Bar dataKey="quantidade" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* ONDE FOI VENDIDO (CARDS DE TRANSAÇÕES VINCULADAS) */}
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
                {transacoes.map((t) => (
                  <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
                    {/* Header do Card */}
                    <div 
                      onClick={() => setItemAberto(itemAberto === t.id ? null : t.id)}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-gray-800/40 transition-colors"
                    >
                      <div className="flex items-start md:items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 md:mt-0">
                          <ArrowUpRight size={18} />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{t.descricao}</span>
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-900/50 px-2 py-0.5 rounded">
                              {t.quantidadeItem}x na venda
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span>{new Date(t.data).toLocaleDateString('pt-BR')} ({calcularTempoDesde(t.data)})</span>
                            {t.cliente && (
                              <span className="text-gray-300 font-medium flex items-center gap-1">
                                <User size={12} className="text-emerald-400" /> {t.cliente.nome}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-gray-800/60 pt-2 md:pt-0">
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Total Venda</span>
                          <span className="text-sm font-black text-white">
                            R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                            t.status === 'Pago' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' : 'bg-amber-950/60 text-amber-400 border border-amber-900/50'
                          }`}>
                            {t.status}
                          </span>

                          <span className="px-2 py-1 bg-gray-950 text-gray-400 border border-gray-800 rounded text-[10px] font-bold uppercase">
                            {t.metodoPagamento}
                          </span>

                          <button className="text-gray-500 hover:text-white bg-transparent border-none p-1">
                            {itemAberto === t.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Detalhes Expansíveis */}
                    {itemAberto === t.id && (
                      <div className="bg-gray-950/60 p-4 border-t border-gray-800/80 text-xs space-y-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Itens inclusos neste lançamento:</p>
                        <div className="flex flex-wrap gap-2">
                          {t.itens && t.itens.length > 0 ? (
                            t.itens.map((it, idx) => (
                              <span key={idx} className="bg-gray-900 border border-gray-800 px-2.5 py-1 rounded text-gray-300">
                                <strong className="text-emerald-400">{it.quantidade}x</strong> {it.nome}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 italic">Itens discriminados na descrição: {t.descricao}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
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
