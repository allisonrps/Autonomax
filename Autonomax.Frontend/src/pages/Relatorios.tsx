import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  BarChart3, 
  ChevronLeft, ChevronRight,
  TrendingUp, ChevronDown, ChevronUp, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Trophy
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import api from '../services/api';
import { LoadingProgress } from '../components/LoadingProgress';

interface Item { nome: string; quantidade: number; }
interface Transacao {
  id: number; 
  valor: number; 
  tipo: string; 
  data: string;
  cliente?: { nome: string }; 
  itens: Item[];
  metodoPagamento?: string;
  status?: string;
}

export function Relatorios() {
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [anoAtivo, setAnoAtivo] = useState(new Date().getFullYear());

  const [resumoAberto, setResumoAberto] = useState(false);

  useEffect(() => {
    async function carregarEstatisticas() {
      if (!negocioId) return;
      try {
        setLoading(true);
        const res = await api.get(`/Transacoes/por-negocio/${negocioId}`);
        setTransacoes(res.data);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    }
    carregarEstatisticas();
  }, [negocioId]);

  const transacoesDoAno = transacoes.filter(t => new Date(t.data).getFullYear() === anoAtivo);
  const transacoesEntrada = transacoesDoAno.filter(t => t.tipo === 'Entrada');
  const transacoesSaida = transacoesDoAno.filter(t => t.tipo === 'Saida');

  const totalEntradas = transacoesEntrada.reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoesSaida.reduce((acc, t) => acc + t.valor, 0);
  const faturamentoLiquido = totalEntradas - totalSaidas;

  const ticketMedio = transacoesEntrada.length > 0 ? totalEntradas / transacoesEntrada.length : 0;
  const totalTransacoes = transacoesDoAno.length;
  const margemLucro = totalEntradas > 0 ? ((totalEntradas - totalSaidas) / totalEntradas) * 100 : 0;

  const dadosGrafico = Array.from({ length: 12 }, (_, i) => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const transacoesMes = transacoesDoAno.filter(t => new Date(t.data).getMonth() === i);
    const ent = transacoesMes.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
    const sai = transacoesMes.filter(t => t.tipo === 'Saida').reduce((acc, t) => acc + t.valor, 0);
    return { name: meses[i], entradas: ent, saidas: sai, saldo: ent - sai };
  });

  const melhorMes = dadosGrafico.reduce((prev, curr) => (curr.entradas > prev.entradas ? curr : prev), dadosGrafico[0]);

  // Média mensal líquida considerando apenas meses fechados (desconsiderando o mês ativo)
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

  // Payment Methods Pie Chart
  const metodosAgrupados = transacoesEntrada.reduce((acc: Record<string, number>, t) => {
    const metodo = t.metodoPagamento || 'Não Informado';
    acc[metodo] = (acc[metodo] || 0) + t.valor;
    return acc;
  }, {});
  
  const dadosPizzaMetodos = Object.entries(metodosAgrupados)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

  const formatarMoeda = (valor: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const formatarTooltip = (value: any): [string, string] => [formatarMoeda(Number(value || 0)), ''];

  const rankingItens = Object.entries(transacoesEntrada.flatMap(t => t.itens || [])
    .reduce((acc: Record<string, number>, item) => {
      const nome = item.nome?.replace(/^[\d\s*xX•\-_/]+/, '').trim() || item.nome?.trim(); 
      if (nome) acc[nome] = (acc[nome] || 0) + Math.max(1, item.quantidade || 1);
      return acc;
    }, {})).sort(([, a], [, b]) => b - a).slice(0, 10);

  const rankingClientes = Object.entries(transacoesEntrada.filter(t => t.cliente)
    .reduce((acc: Record<string, number>, t) => {
      acc[t.cliente!.nome] = (acc[t.cliente!.nome] || 0) + t.valor;
      return acc;
    }, {})).sort(([, a], [, b]) => b - a).slice(0, 10);

  const rankingMetodos = Object.entries(transacoesEntrada
    .reduce((acc: Record<string, number>, t) => {
      const m = t.metodoPagamento || 'Não Informado';
      acc[m] = (acc[m] || 0) + t.valor;
      return acc;
    }, {})).sort(([, a], [, b]) => b - a).slice(0, 10);

  const renderBadgePosicao = (index: number) => {
    if (index === 0) return <Trophy size={14} className="text-yellow-400 mr-2 inline" />;
    if (index === 1) return <Trophy size={14} className="text-gray-400 mr-2 inline" />;
    if (index === 2) return <Trophy size={14} className="text-amber-700 mr-2 inline" />;
    return <span className="w-5 inline-block text-gray-500 mr-1">{index + 1}.</span>;
  };

  if (loading) return (
    <Layout>
      <LoadingProgress message="Carregando dados analíticos..." />
    </Layout>
  );

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
              <button onClick={() => setAnoAtivo(a => a - 1)} className="p-2 text-gray-500 hover:text-white transition-colors"><ChevronLeft size={18}/></button>
              <span className="font-black text-sm px-2">{anoAtivo}</span>
              <button onClick={() => setAnoAtivo(a => a + 1)} className="p-2 text-gray-500 hover:text-white transition-colors"><ChevronRight size={18}/></button>
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
             <button 
               onClick={() => setResumoAberto(!resumoAberto)} 
               className="w-full px-6 py-4 flex justify-between items-center border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
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

          {/* Gráficos de Linha e Barra */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2"><LineChartIcon size={16} className="text-blue-400"/> Evolução Mensal</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dadosGrafico} margin={{top: 5, right: 10, left: 10, bottom: 5}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false}/>
                          <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickMargin={10}/>
                          <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`} width={45}/>
                          <Tooltip formatter={formatarTooltip} contentStyle={{backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px'}}/>
                          <Legend wrapperStyle={{fontSize: '11px', paddingTop: '10px'}}/>
                          <Line type="monotone" name="Receitas" dataKey="entradas" stroke="#10b981" strokeWidth={3} dot={{r: 2}} activeDot={{r: 5}}/>
                          <Line type="monotone" name="Despesas" dataKey="saidas" stroke="#f43f5e" strokeWidth={3} dot={{r: 2}} activeDot={{r: 5}}/>
                          <Line type="monotone" name="Saldo Líquido" dataKey="saldo" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2"><BarChartIcon size={16} className="text-amber-400"/> Comparativo Mensal</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dadosGrafico} margin={{top: 5, right: 10, left: 10, bottom: 5}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false}/>
                          <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickMargin={10}/>
                          <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`} width={45}/>
                          <Tooltip formatter={formatarTooltip} cursor={{fill: '#1f2937'}} contentStyle={{backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px'}}/>
                          <Legend wrapperStyle={{fontSize: '11px', paddingTop: '10px'}}/>
                          <Bar name="Receitas" dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar name="Despesas" dataKey="saidas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
          </div>

          {/* Gráfico de Pizza e Rankings Menores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 lg:col-span-1">
                <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2"><PieChartIcon size={16} className="text-emerald-400"/> Métodos de Pagamento</h3>
                {dadosPizzaMetodos.length > 0 ? (
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={dadosPizzaMetodos} innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                              {dadosPizzaMetodos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={formatarTooltip} contentStyle={{backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px'}} />
                            <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{fontSize: '10px', marginTop: '10px'}} />
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-sm text-gray-500 italic">
                    Sem dados de pagamento
                  </div>
                )}
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[ 
                {t: 'Top Produtos/Serviços', d: rankingItens, u: 'UN'}, 
                {t: 'Top Clientes', d: rankingClientes, u: 'R$'},
                {t: 'Formas de Pagamento', d: rankingMetodos, u: 'R$'}
              ].map((rank, i) => (
                  <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col h-full">
                      <div className="p-4 border-b border-gray-800 text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-900/50">{rank.t}</div>
                      <div className="flex-1 overflow-auto bg-gray-900">
                        {rank.d.length > 0 ? rank.d.map(([nome, val], idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border-b border-gray-800/50 last:border-0 hover:bg-gray-800 transition-colors">
                              <div className="flex items-center text-xs font-bold text-gray-200 truncate pr-2">
                                {renderBadgePosicao(idx)}
                                <span className="truncate">{nome}</span>
                              </div>
                              <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded whitespace-nowrap">
                                {rank.u === 'R$' ? formatarMoeda(val as number) : `${val} UN`}
                              </span>
                          </div>
                        )) : (
                          <div className="p-4 text-xs text-gray-500 italic text-center">Nenhum dado</div>
                        )}
                      </div>
                  </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}