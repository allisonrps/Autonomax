import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  BarChart3, 
  ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  Trophy, ArrowUpRight, ShoppingBag, User, CalendarDays,
  MapPin, Tag, Building2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Sector
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

interface ClienteRelatorio {
  id: number;
  nome: string;
  cidade?: string;
  estado?: string;
  tags?: string;
}

interface FornecedorRelatorio {
  id: number;
  nome: string;
  categoria?: string;
  telefone?: string;
}

interface Transacao {
  id: number; 
  valor: number; 
  tipo: string; 
  data: string;
  descricao?: string;
  clienteId?: number;
  cliente?: { id?: number; nome: string; cidade?: string; estado?: string; tags?: string }; 
  fornecedorId?: number;
  fornecedor?: { id?: number; nome: string; categoria?: string };
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
const COLORS_TAGS = ['#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#6366f1', '#3b82f6', '#14b8a6', '#f59e0b', '#10b981', '#64748b'];
const COLORS_CIDADES = ['#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#6366f1', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b'];
const COLORS_DESPESAS = ['#f43f5e', '#fb7185', '#f97316', '#fb923c', '#f59e0b', '#e11d48', '#be123c', '#ef4444', '#dc2626', '#b91c1c'];

export function Relatorios() {
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [produtosCatalogo, setProdutosCatalogo] = useState<ProdutoServico[]>([]);
  const [clientes, setClientes] = useState<ClienteRelatorio[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorRelatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [anoAtivo, setAnoAtivo] = useState(new Date().getFullYear());

  const [resumoAberto, setResumoAberto] = useState(false);
  const [modoComparativo, setModoComparativo] = useState<'Bruto' | 'Despesa' | 'Líquido'>('Líquido');
  const [modoItemRanking, setModoItemRanking] = useState<'unidades' | 'valor'>('unidades');
  const [abaDespesas, setAbaDespesas] = useState<'tags' | 'parceiros'>('tags');

  useEffect(() => {
    async function carregarDados() {
      if (!negocioId) return;
      try {
        setLoading(true);
        const [resTrans, resCat, resCli, resForn] = await Promise.all([
          api.get(`/Transacoes/por-negocio/${negocioId}`),
          api.get(`/ProdutosServicos/por-negocio/${negocioId}`).catch(() => ({ data: [] })),
          api.get(`/Clientes/por-negocio/${negocioId}`).catch(() => ({ data: [] })),
          api.get(`/Fornecedores/por-negocio/${negocioId}`).catch(() => ({ data: [] }))
        ]);
        const transFormatadas = (resTrans.data || []).map((t: Transacao) => ({
          ...t,
          metodoPagamento: t.metodoPagamento === 'A Vista' ? 'Dinheiro' : t.metodoPagamento
        }));
        setTransacoes(transFormatadas);
        setProdutosCatalogo(resCat.data || []);
        setClientes(resCli.data || []);
        setFornecedores(resForn.data || []);
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

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    const sliceColor = fill || payload?.fill || '#3b82f6';
    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 2}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={sliceColor}
        stroke="#ffffff"
        strokeWidth={2}
      />
    );
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0];
    const item = data.payload || {};
    const nome = item.name || item.nome || '';
    const valor = item.value !== undefined ? item.value : (item.valor !== undefined ? item.valor : 0);
    const pct = item.porcentagem !== undefined ? `${item.porcentagem}%` : '';
    const cor = item.fill || data.color || '#10b981';

    return (
      <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700/80 px-2.5 py-1.5 rounded-lg shadow-xl text-[11px] pointer-events-none flex items-center gap-2">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
        <span className="font-semibold text-gray-300 truncate max-w-[150px]">{nome}:</span>
        <span className="font-black text-white">{formatarMoeda(valor)}</span>
        {pct && <span className="text-[10px] font-bold text-gray-400">({pct})</span>}
      </div>
    );
  };

  // Dados para o Gráfico e Estatísticas de Formas de Pagamento
  const dadosPizzaPagamento = useMemo(() => {
    const mapPagamentos: Record<string, number> = {};
    transacoesEntrada.forEach(t => {
      let m = t.metodoPagamento?.trim() || 'Não Informado';
      if (m === 'A Vista') m = 'Dinheiro';
      mapPagamentos[m] = (mapPagamentos[m] || 0) + t.valor;
    });

    const ordenado = Object.entries(mapPagamentos).sort((a, b) => b[1] - a[1]);
    return ordenado.map(([name, value], idx) => ({
      name,
      value,
      porcentagem: totalEntradas > 0 ? Number(((value / totalEntradas) * 100).toFixed(1)) : 0,
      fill: COLORS_PAGAMENTO[idx % COLORS_PAGAMENTO.length]
    }));
  }, [transacoesEntrada, totalEntradas]);

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

  const clientesMap = useMemo(() => {
    const map = new Map<number, ClienteRelatorio>();
    clientes.forEach(c => map.set(c.id, c));
    return map;
  }, [clientes]);

  const rankingClientes = useMemo(() => {
    const mapClientes: Record<string, { id?: number; nome: string; valor: number }> = {};
    transacoesEntrada.forEach(t => {
      const cId = t.cliente?.id || t.clienteId;
      const cObj = (cId ? clientesMap.get(cId) : null) || t.cliente;
      if (!cObj || !cObj.nome) return;
      const nome = cObj.nome;
      if (!mapClientes[nome]) {
        mapClientes[nome] = { id: cObj.id, nome, valor: 0 };
      }
      mapClientes[nome].valor += t.valor;
    });

    return Object.values(mapClientes)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [transacoesEntrada, clientesMap]);

  const fornecedoresMap = useMemo(() => {
    const map = new Map<number, FornecedorRelatorio>();
    fornecedores.forEach(f => map.set(f.id, f));
    return map;
  }, [fornecedores]);

  const dadosCidades = useMemo(() => {
    const mapCidades: Record<string, number> = {};
    transacoesEntrada.forEach(t => {
      const cId = t.cliente?.id || t.clienteId;
      const cObj = (cId ? clientesMap.get(cId) : null) || t.cliente;
      const cid = cObj?.cidade?.trim() || 'Não Informada';
      mapCidades[cid] = (mapCidades[cid] || 0) + (t.valor || 0);
    });

    const ordenado = Object.entries(mapCidades).sort((a, b) => b[1] - a[1]);
    return ordenado.map(([nome, valor], idx) => ({
      nome,
      valor,
      porcentagem: totalEntradas > 0 ? Number(((valor / totalEntradas) * 100).toFixed(1)) : 0,
      fill: COLORS_CIDADES[idx % COLORS_CIDADES.length]
    }));
  }, [transacoesEntrada, clientesMap, totalEntradas]);

  const dadosTags = useMemo(() => {
    const mapTags: Record<string, number> = {};
    transacoesEntrada.forEach(t => {
      const cId = t.cliente?.id || t.clienteId;
      const cObj = (cId ? clientesMap.get(cId) : null) || t.cliente;
      const tagsStr = cObj?.tags?.trim();

      if (!tagsStr) {
        mapTags['Sem Tag'] = (mapTags['Sem Tag'] || 0) + (t.valor || 0);
      } else {
        const tags = tagsStr.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
        if (tags.length === 0) {
          mapTags['Sem Tag'] = (mapTags['Sem Tag'] || 0) + (t.valor || 0);
        } else {
          tags.forEach(tg => {
            const tagNorm = tg.charAt(0).toUpperCase() + tg.slice(1);
            mapTags[tagNorm] = (mapTags[tagNorm] || 0) + (t.valor || 0);
          });
        }
      }
    });

    const ordenado = Object.entries(mapTags).sort((a, b) => b[1] - a[1]);
    return ordenado.map(([nome, valor], idx) => ({
      nome,
      valor,
      porcentagem: totalEntradas > 0 ? Number(((valor / totalEntradas) * 100).toFixed(1)) : 0,
      fill: COLORS_TAGS[idx % COLORS_TAGS.length]
    }));
  }, [transacoesEntrada, clientesMap, totalEntradas]);

  const dadosDespesasParceiros = useMemo(() => {
    const map: Record<string, number> = {};
    transacoesSaida.forEach(t => {
      const fId = t.fornecedorId || t.fornecedor?.id;
      const fObj = (fId ? fornecedoresMap.get(fId) : null) || t.fornecedor;
      const nomeParceiro = fObj?.nome?.trim() || 'Sem Parceiro';
      map[nomeParceiro] = (map[nomeParceiro] || 0) + (t.valor || 0);
    });

    const ordenado = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return ordenado.map(([nome, valor], idx) => ({
      nome,
      valor,
      porcentagem: totalSaidas > 0 ? Number(((valor / totalSaidas) * 100).toFixed(1)) : 0,
      fill: COLORS_DESPESAS[idx % COLORS_DESPESAS.length]
    }));
  }, [transacoesSaida, fornecedoresMap, totalSaidas]);

  const dadosDespesasTags = useMemo(() => {
    const map: Record<string, number> = {};
    transacoesSaida.forEach(t => {
      const fId = t.fornecedorId || t.fornecedor?.id;
      const fObj = (fId ? fornecedoresMap.get(fId) : null) || t.fornecedor;
      const catStr = fObj?.categoria?.trim();

      if (catStr) {
        const tagsList = catStr.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
        if (tagsList.length > 0) {
          tagsList.forEach(tg => {
            const tagNorm = tg.charAt(0).toUpperCase() + tg.slice(1);
            map[tagNorm] = (map[tagNorm] || 0) + (t.valor || 0);
          });
          return;
        }
      }

      if (t.itens && t.itens.length > 0) {
        t.itens.forEach(it => {
          const nomeLimpo = it.nome?.replace(/^[\d\s*xX•\-_/]+/, '').trim();
          if (nomeLimpo) {
            const tagNorm = nomeLimpo.charAt(0).toUpperCase() + nomeLimpo.slice(1);
            map[tagNorm] = (map[tagNorm] || 0) + (t.valor / t.itens.length);
          }
        });
        return;
      }

      const desc = t.descricao?.replace(/^[\d\s*xX•\-_/]+/, '').trim() || 'Sem Tag';
      const tagNorm = desc.charAt(0).toUpperCase() + desc.slice(1);
      map[tagNorm] = (map[tagNorm] || 0) + (t.valor || 0);
    });

    const ordenado = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return ordenado.map(([nome, valor], idx) => ({
      nome,
      valor,
      porcentagem: totalSaidas > 0 ? Number(((valor / totalSaidas) * 100).toFixed(1)) : 0,
      fill: COLORS_DESPESAS[idx % COLORS_DESPESAS.length]
    }));
  }, [transacoesSaida, fornecedoresMap, totalSaidas]);

  const encontrarIdProduto = (nomeItem: string): number | null => {
    if (!produtosCatalogo.length) return null;
    const nomeNorm = nomeItem.toLowerCase().trim();
    const prod = produtosCatalogo.find(p => p.nome.toLowerCase().trim() === nomeNorm);
    return prod ? prod.id : null;
  };

  const renderBadgePosicao = (index: number) => {
    if (index === 0) return <Trophy size={16} className="text-yellow-400 mr-2 inline flex-shrink-0" />;
    if (index === 1) return <Trophy size={16} className="text-gray-400 mr-2 inline flex-shrink-0" />;
    if (index === 2) return <Trophy size={16} className="text-amber-700 mr-2 inline flex-shrink-0" />;
    return <span className="w-5 inline-block text-gray-500 mr-1 flex-shrink-0 font-mono text-xs">{index + 1}.</span>;
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
                <h2 className="text-lg font-black uppercase tracking-tight">Performance Anual</h2>
                <p className="text-xs text-gray-500 font-medium">Resultados e balanço financeiro de {anoAtivo}</p>
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

          {/* Gráfico Mês a Mês (Topo - Ocupando toda a área de 2 cards) */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <h3 className="text-xs font-black uppercase flex items-center gap-2">
                  <LineChartIcon size={16} className="text-blue-400"/> Gráfico Mês a Mês
                </h3>
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> Receitas</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"/> Despesas</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"/> Saldo Líquido</span>
                </div>
              </div>
              <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dadosGrafico} margin={{top: 5, right: 10, left: 10, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false}/>
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickMargin={10}/>
                        <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`} width={45}/>
                        <Tooltip formatter={formatarTooltip} contentStyle={{backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px'}}/>
                        <Line type="monotone" name="Receitas" dataKey="entradas" stroke="#10b981" strokeWidth={3} dot={{r: 2.5}} activeDot={{r: 5}}/>
                        <Line type="monotone" name="Despesas" dataKey="saidas" stroke="#f43f5e" strokeWidth={3} dot={{r: 2.5}} activeDot={{r: 5}}/>
                        <Line type="monotone" name="Saldo Líquido" dataKey="saldo" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false}/>
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Métodos de Pagamento & Despesas (Dividindo o espaço lado a lado) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
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
                            stroke="none"
                            activeShape={renderActiveShape}
                          >
                            {dadosPizzaPagamento.map((item, index) => (
                              <Cell key={`cell-${index}`} fill={item.fill || COLORS_PAGAMENTO[index % COLORS_PAGAMENTO.length]} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Lista Estilizada de Estatísticas por Método (Estilo Tabela / Ranking Compacto) */}
                    <div className="sm:col-span-7 max-h-60 overflow-y-auto pr-1 custom-scrollbar bg-gray-950/70 rounded-xl border border-gray-800/80 divide-y divide-gray-800/50">
                      {dadosPizzaPagamento.map((item, idx) => {
                        const pct = totalEntradas > 0 ? (item.value / totalEntradas) * 100 : 0;
                        const cor = COLORS_PAGAMENTO[idx % COLORS_PAGAMENTO.length];
                        return (
                          <div key={idx} className="flex items-center justify-between py-2 px-3 hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-2 font-bold text-gray-200 truncate pr-2 text-xs">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
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

            {/* Card: Despesas por Tags e Parceiros */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <TrendingDown size={16} className="text-red-400"/>
                  <h3 className="text-xs font-black uppercase text-gray-200">
                    Despesas por {abaDespesas === 'tags' ? 'Tags' : 'Parceiros'}
                  </h3>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider font-mono bg-gray-950 px-2 py-0.5 rounded border border-gray-800">
                    {abaDespesas === 'tags' 
                      ? `${dadosDespesasTags.length} ${dadosDespesasTags.length === 1 ? 'tag' : 'tags'}`
                      : `${dadosDespesasParceiros.length} ${dadosDespesasParceiros.length === 1 ? 'parceiro' : 'parceiros'}`
                    }
                  </span>
                </div>

                {/* Abas: Tags e Parceiros */}
                <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800">
                  <button
                    type="button"
                    onClick={() => setAbaDespesas('tags')}
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                      abaDespesas === 'tags'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white bg-transparent'
                    }`}
                  >
                    <Tag size={12} />
                    <span>Tags</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbaDespesas('parceiros')}
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                      abaDespesas === 'parceiros'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white bg-transparent'
                    }`}
                  >
                    <Building2 size={12} />
                    <span>Parceiros</span>
                  </button>
                </div>
              </div>

              {(abaDespesas === 'tags' ? dadosDespesasTags : dadosDespesasParceiros).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1">
                  {/* Gráfico Donut / Pizza */}
                  <div className="sm:col-span-5 h-56 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={abaDespesas === 'tags' ? dadosDespesasTags : dadosDespesasParceiros}
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="valor"
                          nameKey="nome"
                          stroke="none"
                          activeShape={renderActiveShape}
                        >
                          {(abaDespesas === 'tags' ? dadosDespesasTags : dadosDespesasParceiros).map((item, index) => (
                            <Cell key={`cell-desp-${index}`} fill={item.fill || COLORS_DESPESAS[index % COLORS_DESPESAS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Lista do lado do gráfico com Valor e % (Estilo Tabela / Ranking Compacto) */}
                  <div className="sm:col-span-7 max-h-60 overflow-y-auto pr-1 custom-scrollbar bg-gray-950/70 rounded-xl border border-gray-800/80 divide-y divide-gray-800/50">
                    {(abaDespesas === 'tags' ? dadosDespesasTags : dadosDespesasParceiros).map((item, idx) => {
                      const cor = item.fill || COLORS_DESPESAS[idx % COLORS_DESPESAS.length];
                      return (
                        <div key={idx} className="flex items-center justify-between py-2 px-3 hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center gap-2 font-bold text-gray-200 truncate pr-2 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                            <span className="truncate">{item.nome}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-black text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded">
                              {item.porcentagem.toFixed(1)}%
                            </span>
                            <span className="font-black text-white text-xs">
                              {formatarMoeda(item.valor)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-gray-500 italic">
                  Nenhuma despesa registrada para {abaDespesas === 'tags' ? 'tags' : 'parceiros'} em {anoAtivo}
                </div>
              )}
            </div>

          </div>

          {/* Faturamento por Tags & Faturamento por Cidades & Despesas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Card: Faturamento por Tags */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase flex items-center gap-2">
                  <Tag size={16} className="text-purple-400"/> Faturamento por Tags
                </h3>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  {dadosTags.length} {dadosTags.length === 1 ? 'tag' : 'tags'}
                </span>
              </div>

              {dadosTags.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1">
                  {/* Gráfico Donut / Pizza */}
                  <div className="sm:col-span-5 h-56 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosTags}
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="valor"
                          nameKey="nome"
                          stroke="none"
                          activeShape={renderActiveShape}
                        >
                          {dadosTags.map((item, index) => (
                            <Cell key={`cell-tag-${index}`} fill={item.fill || COLORS_TAGS[index % COLORS_TAGS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Lista do lado do gráfico com Valor e % (Estilo Tabela / Ranking Compacto) */}
                  <div className="sm:col-span-7 max-h-60 overflow-y-auto pr-1 custom-scrollbar bg-gray-950/70 rounded-xl border border-gray-800/80 divide-y divide-gray-800/50">
                    {dadosTags.map((item, idx) => {
                      const cor = item.fill || COLORS_TAGS[idx % COLORS_TAGS.length];
                      return (
                        <div key={idx} className="flex items-center justify-between py-2 px-3 hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center gap-2 font-bold text-gray-200 truncate pr-2 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                            <span className="truncate">{item.nome}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-black text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded">
                              {item.porcentagem.toFixed(1)}%
                            </span>
                            <span className="font-black text-white text-xs">
                              {formatarMoeda(item.valor)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-gray-500 italic">
                  Nenhuma transação com tags de clientes registrada em {anoAtivo}
                </div>
              )}
            </div>

            {/* Card: Faturamento por Cidades */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase flex items-center gap-2">
                  <MapPin size={16} className="text-blue-400"/> Faturamento por Cidades
                </h3>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  {dadosCidades.length} {dadosCidades.length === 1 ? 'cidade' : 'cidades'}
                </span>
              </div>

              {dadosCidades.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1">
                  {/* Gráfico Donut / Pizza */}
                  <div className="sm:col-span-5 h-56 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosCidades}
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="valor"
                          nameKey="nome"
                          stroke="none"
                          activeShape={renderActiveShape}
                        >
                          {dadosCidades.map((item, index) => (
                            <Cell key={`cell-cid-${index}`} fill={item.fill || COLORS_CIDADES[index % COLORS_CIDADES.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Lista do lado do gráfico com Valor e % (Estilo Tabela / Ranking Compacto) */}
                  <div className="sm:col-span-7 max-h-60 overflow-y-auto pr-1 custom-scrollbar bg-gray-950/70 rounded-xl border border-gray-800/80 divide-y divide-gray-800/50">
                    {dadosCidades.map((item, idx) => {
                      const cor = item.fill || COLORS_CIDADES[idx % COLORS_CIDADES.length];
                      return (
                        <div key={idx} className="flex items-center justify-between py-2 px-3 hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center gap-2 font-bold text-gray-200 truncate pr-2 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                            <span className="truncate">{item.nome}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-black text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded">
                              {item.porcentagem.toFixed(1)}%
                            </span>
                            <span className="font-black text-white text-xs">
                              {formatarMoeda(item.valor)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-gray-500 italic">
                  Nenhuma transação com cidades registrada em {anoAtivo}
                </div>
              )}
            </div>

          </div>

          {/* Seção de Rankings (3 Cards Expandidos no Desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Card 1: Lista Mês a Mês Clicável */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-800 bg-gray-900/50 space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <CalendarDays size={15} className="text-blue-400" />
                  <span>Mês a Mês ({anoAtivo})</span>
                </div>
                
                {/* Toggle Bruto - Despesa - Líquido */}
                <div className="grid grid-cols-3 gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800">
                  {(['Bruto', 'Despesa', 'Líquido'] as const).map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setModoComparativo(tipo)}
                      className={`py-1.5 text-[10px] font-black uppercase rounded transition-all cursor-pointer border-none ${
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
                      className="group flex items-center justify-between py-1.5 px-3 sm:px-4 hover:bg-gray-800/80 transition-colors no-underline cursor-pointer"
                      title={`Ver fluxo de caixa de ${item.name}`}
                    >
                      <div className="flex items-center text-sm font-bold text-gray-200 group-hover:text-blue-400 transition-colors truncate pr-2">
                        <span className="w-5 inline-block text-xs text-gray-500 font-mono flex-shrink-0">{idx + 1}.</span>
                        <span className="truncate">{item.name}</span>
                        <ArrowUpRight size={13} className="ml-1 opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity flex-shrink-0" />
                      </div>
                      <span className={`text-xs font-black px-2 py-0.5 rounded whitespace-nowrap ${corBadge}`}>
                        {formatarMoeda(valor)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Card 2: Top Produtos/Serviços com Toggle Unidades/Valor e Links */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-800 bg-gray-900/50 space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <ShoppingBag size={15} className="text-emerald-400" />
                  <span>Top Produtos / Serviços</span>
                </div>

                {/* Toggle Unidades (UN) / Valor (R$) */}
                <div className="grid grid-cols-2 gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800">
                  <button
                    type="button"
                    onClick={() => setModoItemRanking('unidades')}
                    className={`py-1.5 text-[10px] font-black uppercase rounded transition-all cursor-pointer border-none ${
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
                    className={`py-1.5 text-[10px] font-black uppercase rounded transition-all cursor-pointer border-none ${
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
                        className="group flex items-center justify-between py-1.5 px-3 sm:px-4 hover:bg-gray-800/80 transition-colors no-underline cursor-pointer"
                        title={`Ver detalhes do produto/serviço ${item.nome}`}
                      >
                        <div className="flex items-center text-sm font-bold text-gray-200 group-hover:text-emerald-400 transition-colors truncate pr-2">
                          {renderBadgePosicao(idx)}
                          <span className="truncate">{item.nome}</span>
                          <ArrowUpRight size={13} className="ml-1 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity flex-shrink-0" />
                        </div>
                        <span className="text-xs font-black text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded whitespace-nowrap">
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
              <div className="p-4 border-b border-gray-800 text-xs font-black uppercase tracking-wider text-gray-300 bg-gray-900/50 flex items-center gap-1.5">
                <User size={15} className="text-amber-400" />
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
                        className="group flex items-center justify-between py-1.5 px-3 sm:px-4 hover:bg-gray-800/80 transition-colors no-underline cursor-pointer"
                        title={`Ver perfil do cliente ${c.nome}`}
                      >
                        <div className="flex items-center text-sm font-bold text-gray-200 group-hover:text-amber-400 transition-colors truncate pr-2">
                          {renderBadgePosicao(idx)}
                          <span className="truncate">{c.nome}</span>
                          <ArrowUpRight size={13} className="ml-1 opacity-0 group-hover:opacity-100 text-amber-400 transition-opacity flex-shrink-0" />
                        </div>
                        <span className="text-xs font-black text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded whitespace-nowrap">
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