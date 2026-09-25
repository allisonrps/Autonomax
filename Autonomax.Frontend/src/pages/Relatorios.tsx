import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  BarChart3, 
  ChevronLeft, ChevronRight,
  TrendingUp, ChevronDown, ChevronUp, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  Trophy, ArrowUpRight, ShoppingBag, User, CalendarDays
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';
import { LoadingProgress } from '../components/LoadingProgress';

interface Item { 
  nome: string; 
  quantidade: number;
  precoUnitario?: number;
  preco?: number;
  valorTotal?: number;
}

interface Transacao {
  id: number; 
  valor: number; 
  tipo: string; 
  data: string;
  cliente?: { id?: number; nome: string }; 
  itens: Item[];
  metodoPagamento?: string;
  status?: string;
}

interface ProdutoServico {
  id: number;
  nome: string;
  preco: number;
  ehServico: boolean;
}

const COLORS_PAGAMENTO = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export function Relatorios() {
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [produtosCatalogo, setProdutosCatalogo] = useState<ProdutoServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [anoAtivo, setAnoAtivo] = useState(new Date().getFullYear());

  const [resumoAberto, setResumoAberto] = useState(false);
  const [modoComparativo, setModoComparativo] = useState<'Bruto' | 'Despesa' | 'Líquido'>('Líquido');
  const [modoItemRanking, setModoItemRanking] = useState<'unidades' | 'valor'>('unidades');

  useEffect(() => {
    async function carregarDados() {
      if (!negocioId) return;
      try {
        setLoading(true);
        const [resTrans, resCat] = await Promise.all([
          api.get(`/Transacoes/por-negocio/${negocioId}`),
          api.get(`/ProdutosServicos/por-negocio/${negocioId}`).catch(() => ({ data: [] }))
        ]);
        setTransacoes(resTrans.data);
        setProdutosCatalogo(resCat.data || []);
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    }
    carregarDados();
  }, [negocioId]);

  const transacoesDoAno = useMemo(() => 
    transacoes.filter(t => new Date(t.data).getFullYear() === anoAtivo),
  [transacoes, anoAtivo]);

  const transacoesEntrada = useMemo(() => 
    transacoesDoAno.filter(t => t.tipo === 'Entrada'),
  [transacoesDoAno]);

  const transacoesSaida = useMemo(() => 
    transacoesDoAno.filter(t => t.tipo === 'Saida'),
  [transacoesDoAno]);

  const totalEntradas = useMemo(() => 
    transacoesEntrada.reduce((acc, t) => acc + t.valor, 0),
  [transacoesEntrada]);

  const totalSaidas = useMemo(() => 
    transacoesSaida.reduce((acc, t) => acc + t.valor, 0),
  [transacoesSaida]);

  const faturamentoLiquido = totalEntradas - totalSaidas;
  const ticketMedio = transacoesEntrada.length > 0 ? totalEntradas / transacoesEntrada.length : 0;
  const totalTransacoes = transacoesDoAno.length;
  const margemLucro = totalEntradas > 0 ? ((totalEntradas - totalSaidas) / totalEntradas) * 100 : 0;

  const dadosGrafico = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const transacoesMes = transacoesDoAno.filter(t => new Date(t.data).getMonth() === i);
      const ent = transacoesMes.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
      const sai = transacoesMes.filter(t => t.tipo === 'Saida').reduce((acc, t) => acc + t.valor, 0);
      return { name: meses[i], entradas: ent, saidas: sai, saldo: ent - sai };
    });
  }, [transacoesDoAno]);

  const melhorMes = useMemo(() => 
    dadosGrafico.reduce((prev, curr) => (curr.entradas > prev.entradas ? curr : prev), dadosGrafico[0]),
  [dadosGrafico]);

  // Média mensal líquida considerando apenas meses fechados
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtualIndex = hoje.getMonth();

  let qtdMesesFechados = 0;
  if (anoAtivo < anoAtual) {
    qtdMesesFechados = 12;
  } else if (anoAtivo === anoAtual) {
    qtdMesesFechados = mesAtualIndex;
  } else {
    qtdMesesFechados = 0;
  }

  const mesesFechados = dadosGrafico.slice(0, qtdMesesFechados);
  const somaSaldoFechados = mesesFechados.reduce((acc, m) => acc + m.saldo, 0);
  const mediaMensalLiquida = qtdMesesFechados > 0 ? somaSaldoFechados / qtdMesesFechados : 0;
  const textoMesesFechados = qtdMesesFechados > 0
    ? `${qtdMesesFechados} ${qtdMesesFechados === 1 ? 'mês fechado' : 'meses fechados'} (Jan${qtdMesesFechados > 1 ? ' - ' + dadosGrafico[qtdMesesFechados - 1].name : ''})`
    : 'Sem meses fechados';

  const formatarMoeda = (valor: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const formatarTooltip = (value: any): [string, string] => [formatarMoeda(Number(value || 0)), ''];

  // Dados para o Gráfico e Estatísticas de Formas de Pagamento
  const dadosPizzaPagamento = useMemo(() => {
    const mapPagamentos: Record<string, number> = {};
    transacoesEntrada.forEach(t => {
      const m = t.metodoPagamento?.trim() || 'Não Informado';
      mapPagamentos[m] = (mapPagamentos[m] || 0) + t.valor;
    });

    return Object.entries(mapPagamentos)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transacoesEntrada]);

  // Rankings
  const rankingItensUnidades = useMemo(() => {
    const mapUnidades: Record<string, number> = {};
    transacoesEntrada.flatMap(t => t.itens || []).forEach(item => {
      const nome = item.nome?.replace(/^[\d\s*xX•\-_/]+/, '').trim() || item.nome?.trim();
      if (nome) {
        mapUnidades[nome] = (mapUnidades[nome] || 0) + Math.max(1, item.quantidade || 1);
      }
    });

    return Object.entries(mapUnidades)
      .map(([nome, val]) => ({ nome, val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 10);
  }, [transacoesEntrada]);

  const rankingItensValor = useMemo(() => {
    const mapValor: Record<string, number> = {};
    transacoesEntrada.forEach(t => {
      const itens = t.itens || [];
      if (itens.length === 0) return;
      const somaQtd = itens.reduce((acc, it) => acc + Math.max(1, it.quantidade || 1), 0);

      itens.forEach(item => {
        const nome = item.nome?.replace(/^[\d\s*xX•\-_/]+/, '').trim() || item.nome?.trim();
        if (!nome) return;
        const qtd = Math.max(1, item.quantidade || 1);
        let valItem = 0;
        if (item.valorTotal) {
          valItem = item.valorTotal;
        } else if (item.precoUnitario) {
          valItem = item.precoUnitario * qtd;
        } else if (item.preco) {
          valItem = item.preco * qtd;
        } else {
          valItem = somaQtd > 0 ? (t.valor * (qtd / somaQtd)) : t.valor;
        }
        mapValor[nome] = (mapValor[nome] || 0) + valItem;
      });
    });

    return Object.entries(mapValor)
      .map(([nome, val]) => ({ nome, val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 10);
  }, [transacoesEntrada]);

  const rankingClientes = useMemo(() => {
    const mapClientes: Record<string, { id?: number; nome: string; valor: number }> = {};
    transacoesEntrada.forEach(t => {
      if (!t.cliente || !t.cliente.nome) return;
      const nome = t.cliente.nome;
      if (!mapClientes[nome]) {
        mapClientes[nome] = { id: t.cliente.id, nome, valor: 0 };
      }
      mapClientes[nome].valor += t.valor;
    });

    return Object.values(mapClientes)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [transacoesEntrada]);

  const encontrarIdProduto = (nomeItem: string): number | null => {
    if (!produtosCatalogo.length) return null;
    const nomeNorm = nomeItem.toLowerCase().trim();
    const prod = produtosCatalogo.find(p => p.nome.toLowerCase().trim() === nomeNorm);
    return prod ? prod.id : null;
  };

  const renderBadgePosicao = (index: number) => {
    if (index === 0) return <Trophy size={14} className="text-yellow-400 mr-2 inline flex-shrink-0" />;
    if (index === 1) return <Trophy size={14} className="text-gray-400 mr-2 inline flex-shrink-0" />;
    if (index === 2) return <Trophy size={14} className="text-amber-700 mr-2 inline flex-shrink-0" />;
    return <span className="w-5 inline-block text-gray-500 mr-1 flex-shrink-0 font-mono text-[10px]">{index + 1}.</span>;
  };

  if (loading) return (
    <Layout>
      <LoadingProgress message="Carregando dados analíticos..." />
    </Layout>
  );

  const rankingItensAtual = modoItemRanking === 'unidades' ? rankingItensUnidades : rankingItensValor;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 sm:px-6 lg:px-8 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50">
                <BarChart3 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">Performance Financeira</h2>
                <p className="text-xs text-gray-500 font-medium">Análise e resultados do ano de {anoAtivo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 p-1 rounded-md self-start sm:self-auto">
              <button onClick={() => setAnoAtivo(a => a - 1)} className="p-2 text-gray-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none"><ChevronLeft size={18}/></button>
              <span className="font-black text-sm px-2">{anoAtivo}</span>
              <button onClick={() => setAnoAtivo(a => a + 1)} className="p-2 text-gray-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none"><ChevronRight size={18}/></button>
            </div>
          </div>

          {/* Resumo (KPIs) */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
             <button 
               onClick={() => setResumoAberto(!resumoAberto)} 
               className="w-full px-6 py-4 flex justify-between items-center border-b border-gray-800 hover:bg-gray-800/30 transition-colors bg-transparent text-left cursor-pointer border-none"
             >
               <span className="text-xs font-black uppercase flex items-center gap-2">
                 <TrendingUp size={16} className="text-emerald-400"/> Indicadores Principais (KPIs)
               </span>
               {resumoAberto ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
             </button>
             {resumoAberto && (
               <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-950 p-5 rounded-lg border border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Receitas</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">{formatarMoeda(totalEntradas)}</p>
                  </div>
                  <div className="bg-gray-950 p-5 rounded-lg border border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Despesas</p>
                      <p className="text-2xl font-black text-red-400 mt-1">{formatarMoeda(totalSaidas)}</p>
                  </div>
                  <div className="bg-gray-950 p-5 rounded-lg border border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Saldo Líquido</p>
                      <p className={`text-2xl font-black mt-1 ${faturamentoLiquido >= 0 ? 'text-white' : 'text-red-500'}`}>
                        {formatarMoeda(faturamentoLiquido)}
                      </p>
                  </div>
                  <div className="bg-gray-950 p-5 rounded-lg border border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Margem de Lucro</p>
                      <p className="text-2xl font-black text-blue-400 mt-1">{margemLucro.toFixed(1)}%</p>
                  </div>
                  
                  <div className="bg-gray-950 p-5 rounded-lg border border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Média Mensal Líquida</p>
                      <p className={`text-2xl font-black mt-1 ${mediaMensalLiquida >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatarMoeda(mediaMensalLiquida)}
                      </p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mt-0.5 truncate" title={textoMesesFechados}>
                        {textoMesesFechados}
                      </p>
                  </div>

                  <div className="bg-gray-950 p-5 rounded-lg border border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Ticket Médio</p>
                      <p className="text-2xl font-black text-gray-200 mt-1">{formatarMoeda(ticketMedio)}</p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">
                        Por entrada
                      </p>
                  </div>

                  <div className="bg-gray-950 p-5 rounded-lg border border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Transações Totais</p>
                      <p className="text-2xl font-black text-gray-200 mt-1">{totalTransacoes}</p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">
                        Ano {anoAtivo}
                      </p>
                  </div>

                  <div className="bg-gray-950 p-5 rounded-lg border border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Melhor Mês (Receita)</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">{melhorMes?.name || '---'}</p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mt-0.5 truncate">
                        {melhorMes ? formatarMoeda(melhorMes.entradas) : ''}
                      </p>
                  </div>
               </div>
             )}
          </div>

          {/* Gráficos Principais: Mês a Mês (Evolução) & Formas de Pagamento Avançado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Gráfico Mês a Mês */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col justify-between">
                <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2">
                  <LineChartIcon size={16} className="text-blue-400"/> Gráfico Mês a Mês
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dadosGrafico} margin={{top: 5, right: 10, left: 10, bottom: 5}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false}/>
                          <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickMargin={10}/>
                          <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`} width={45}/>
                          <Tooltip formatter={formatarTooltip} contentStyle={{backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px'}}/>
                          <Line type="monotone" name="Receitas" dataKey="entradas" stroke="#10b981" strokeWidth={3} dot={{r: 2}} activeDot={{r: 5}}/>
                          <Line type="monotone" name="Despesas" dataKey="saidas" stroke="#f43f5e" strokeWidth={3} dot={{r: 2}} activeDot={{r: 5}}/>
                          <Line type="monotone" name="Saldo Líquido" dataKey="saldo" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Card Completo de Formas de Pagamento (Gráfico Donut + Estatísticas Detalhadas com Valores e %) */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase flex items-center gap-2">
                    <PieChartIcon size={16} className="text-purple-400"/> Formas de Pagamento
                  </h3>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                    {dadosPizzaPagamento.length} {dadosPizzaPagamento.length === 1 ? 'método' : 'métodos'}
                  </span>
                </div>

                {dadosPizzaPagamento.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1">
                    {/* Gráfico Donut */}
                    <div className="sm:col-span-5 h-56 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dadosPizzaPagamento}
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="name"
                          >
                            {dadosPizzaPagamento.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS_PAGAMENTO[index % COLORS_PAGAMENTO.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(val: any) => [formatarMoeda(Number(val || 0)), 'Receita']} 
                            contentStyle={{backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px'}}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Lista Estilizada de Estatísticas por Método (Valor e %) */}
                    <div className="sm:col-span-7 space-y-2 max-h-60 overflow-y-auto pr-1">
                      {dadosPizzaPagamento.map((item, idx) => {
                        const pct = totalEntradas > 0 ? (item.value / totalEntradas) * 100 : 0;
                        const cor = COLORS_PAGAMENTO[idx % COLORS_PAGAMENTO.length];
                        return (
                          <div key={idx} className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/80 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 font-bold text-gray-200 truncate pr-2">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                                <span className="truncate">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[10px] font-black text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded">
                                  {pct.toFixed(1)}%
                                </span>
                                <span className="font-black text-white text-xs">
                                  {formatarMoeda(item.value)}
                                </span>
                              </div>
                            </div>
                            {/* Barra de Progresso em % */}
                            <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: cor }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-56 flex items-center justify-center text-xs text-gray-500 italic">
                    Nenhuma transação com forma de pagamento registrada
                  </div>
                )}
            </div>

          </div>

          {/* Seção de Rankings (3 Cards Expandidos no Desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Card 1: Lista Mês a Mês Clicável */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
              <div className="p-3.5 border-b border-gray-800 bg-gray-900/50 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-blue-400" />
                  <span>Mês a Mês ({anoAtivo})</span>
                </div>
                
                {/* Toggle Bruto - Despesa - Líquido */}
                <div className="grid grid-cols-3 gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800">
                  {(['Bruto', 'Despesa', 'Líquido'] as const).map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setModoComparativo(tipo)}
                      className={`py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer border-none ${
                        modoComparativo === tipo
                          ? tipo === 'Bruto'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : tipo === 'Despesa'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white bg-transparent'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 divide-y divide-gray-800/40">
                {dadosGrafico.map((item, idx) => {
                  let valor = item.saldo;
                  let corBadge = item.saldo >= 0 ? 'text-emerald-400 bg-emerald-950/40' : 'text-red-400 bg-red-950/40';

                  if (modoComparativo === 'Bruto') {
                    valor = item.entradas;
                    corBadge = 'text-emerald-400 bg-emerald-950/40';
                  } else if (modoComparativo === 'Despesa') {
                    valor = item.saidas;
                    corBadge = 'text-red-400 bg-red-950/40';
                  }

                  return (
                    <Link 
                      key={idx}
                      to={`/fluxo-caixa/${idx + 1}/${anoAtivo}`}
                      className="group flex items-center justify-between py-2.5 px-3.5 hover:bg-gray-800/80 transition-colors no-underline cursor-pointer"
                      title={`Ver fluxo de caixa de ${item.name}`}
                    >
                      <div className="flex items-center text-xs font-bold text-gray-200 group-hover:text-blue-400 transition-colors truncate pr-2">
                        <span className="w-5 inline-block text-[10px] text-gray-500 font-mono flex-shrink-0">{idx + 1}.</span>
                        <span className="truncate">{item.name}</span>
                        <ArrowUpRight size={12} className="ml-1 opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity flex-shrink-0" />
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded whitespace-nowrap ${corBadge}`}>
                        {formatarMoeda(valor)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Card 2: Top Produtos/Serviços com Toggle Unidades/Valor e Links */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
              <div className="p-3.5 border-b border-gray-800 bg-gray-900/50 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <ShoppingBag size={13} className="text-emerald-400" />
                  <span>Top Produtos / Serviços</span>
                </div>

                {/* Toggle Unidades (UN) / Valor (R$) */}
                <div className="grid grid-cols-2 gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800">
                  <button
                    type="button"
                    onClick={() => setModoItemRanking('unidades')}
                    className={`py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer border-none ${
                      modoItemRanking === 'unidades'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white bg-transparent'
                    }`}
                  >
                    Unidades (UN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoItemRanking('valor')}
                    className={`py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer border-none ${
                      modoItemRanking === 'valor'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white bg-transparent'
                    }`}
                  >
                    Valor (R$)
                  </button>
                </div>
              </div>

              <div className="bg-gray-900 divide-y divide-gray-800/40">
                {rankingItensAtual.length > 0 ? (
                  rankingItensAtual.map((item, idx) => {
                    const prodId = encontrarIdProduto(item.nome);
                    const linkPath = prodId ? `/catalogo/${prodId}` : `/catalogo?busca=${encodeURIComponent(item.nome)}`;
                    
                    return (
                      <Link
                        key={idx}
                        to={linkPath}
                        className="group flex items-center justify-between py-2.5 px-3.5 hover:bg-gray-800/80 transition-colors no-underline cursor-pointer"
                        title={`Ver detalhes do produto/serviço ${item.nome}`}
                      >
                        <div className="flex items-center text-xs font-bold text-gray-200 group-hover:text-emerald-400 transition-colors truncate pr-2">
                          {renderBadgePosicao(idx)}
                          <span className="truncate">{item.nome}</span>
                          <ArrowUpRight size={12} className="ml-1 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity flex-shrink-0" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded whitespace-nowrap">
                          {modoItemRanking === 'valor' ? formatarMoeda(item.val) : `${item.val} UN`}
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-4 text-xs text-gray-500 italic text-center">Nenhum item registrado</div>
                )}
              </div>
            </div>

            {/* Card 3: Top Clientes Clicável */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
              <div className="p-3.5 border-b border-gray-800 text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-900/50 flex items-center gap-1.5">
                <User size={13} className="text-amber-400" />
                <span>Top Clientes</span>
              </div>
              <div className="bg-gray-900 divide-y divide-gray-800/40">
                {rankingClientes.length > 0 ? (
                  rankingClientes.map((c, idx) => {
                    const linkPath = c.id ? `/clientes/${c.id}` : '/clientes';
                    return (
                      <Link
                        key={idx}
                        to={linkPath}
                        className="group flex items-center justify-between py-2.5 px-3.5 hover:bg-gray-800/80 transition-colors no-underline cursor-pointer"
                        title={`Ver perfil do cliente ${c.nome}`}
                      >
                        <div className="flex items-center text-xs font-bold text-gray-200 group-hover:text-amber-400 transition-colors truncate pr-2">
                          {renderBadgePosicao(idx)}
                          <span className="truncate">{c.nome}</span>
                          <ArrowUpRight size={12} className="ml-1 opacity-0 group-hover:opacity-100 text-amber-400 transition-opacity flex-shrink-0" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded whitespace-nowrap">
                          {formatarMoeda(c.valor)}
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-4 text-xs text-gray-500 italic text-center">Nenhum cliente registrado</div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}