import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  BarChart3, Package, ArrowUpRight, ArrowDownLeft, 
  ChevronLeft, ChevronRight, Calendar,
  TrendingUp, ChevronDown, ChevronUp, LineChart as LineChartIcon, Users, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';

interface Item { nome: string; quantidade: number; }
interface Transacao {
  id: number; valor: number; tipo: string; data: string;
  cliente?: { nome: string }; itens: Item[];
}

export function Relatorios() {
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [anoAtivo, setAnoAtivo] = useState(new Date().getFullYear());

  const [resumoAberto, setResumoAberto] = useState(true);
  const [graficoAberto, setGraficoAberto] = useState(true); 
  const [itensAberto, setItensAberto] = useState(true);
  const [clientesAberto, setClientesAberto] = useState(true);

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
  const totalEntradas = transacoesDoAno.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoesDoAno.filter(t => t.tipo === 'Saida').reduce((acc, t) => acc + t.valor, 0);
  const faturamentoLiquido = totalEntradas - totalSaidas;

  const dadosGrafico = Array.from({ length: 12 }, (_, i) => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const transacoesMes = transacoesDoAno.filter(t => new Date(t.data).getMonth() === i);
    const ent = transacoesMes.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
    const sai = transacoesMes.filter(t => t.tipo === 'Saida').reduce((acc, t) => acc + t.valor, 0);
    return { name: meses[i], entradas: ent, saidas: sai };
  });

  const dadosPizza = [{ name: 'Receitas', value: totalEntradas }, { name: 'Despesas', value: totalSaidas }];
  const COLORS = ['#10b981', '#f43f5e'];

  const rankingItens = Object.entries(transacoesDoAno.filter(t => t.tipo === 'Entrada').flatMap(t => t.itens || [])
    .reduce((acc: Record<string, number>, item) => {
      const nome = item.nome.trim(); if (nome) acc[nome] = (acc[nome] || 0) + item.quantidade;
      return acc;
    }, {})).sort(([, a], [, b]) => b - a).slice(0, 10);

  const rankingClientes = Object.entries(transacoesDoAno.filter(t => t.tipo === 'Entrada' && t.cliente)
    .reduce((acc: Record<string, number>, t) => {
      acc[t.cliente!.nome] = (acc[t.cliente!.nome] || 0) + t.valor;
      return acc;
    }, {})).sort(([, a], [, b]) => b - a).slice(0, 10);

  if (loading) return <Layout><div className="min-h-screen bg-gray-950 flex items-center justify-center text-emerald-500 font-black uppercase tracking-widest animate-pulse">Carregando Analítico...</div></Layout>;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50"><BarChart3 size={22} /></div>
              <h2 className="text-lg font-black uppercase tracking-tight">Performance {anoAtivo}</h2>
            </div>
            <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 p-1 rounded-md">
              <button onClick={() => setAnoAtivo(a => a - 1)} className="p-2 text-gray-500 hover:text-white"><ChevronLeft size={18}/></button>
              <span className="font-black text-sm px-2">{anoAtivo}</span>
              <button onClick={() => setAnoAtivo(a => a + 1)} className="p-2 text-gray-500 hover:text-white"><ChevronRight size={18}/></button>
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
             <button onClick={() => setResumoAberto(!resumoAberto)} className="w-full px-6 py-4 flex justify-between border-b border-gray-800">
                <span className="text-xs font-black uppercase flex items-center gap-2"><TrendingUp size={16} className="text-emerald-400"/> Resumo Financeiro</span>
                {resumoAberto ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
             </button>
             {resumoAberto && (
               <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[ {l: 'Receitas', v: totalEntradas, c: 'text-emerald-400'}, {l: 'Despesas', v: totalSaidas, c: 'text-red-400'}, {l: 'Saldo', v: faturamentoLiquido, c: faturamentoLiquido >= 0 ? 'text-white' : 'text-red-400'} ].map((item, i) => (
                    <div key={i} className="bg-gray-950 p-5 rounded-lg border border-gray-800">
                        <p className="text-[9px] font-black uppercase text-gray-500">{item.l}</p>
                        <p className={`text-2xl font-black ${item.c}`}>R$ {item.v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  ))}
               </div>
             )}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2"><LineChartIcon size={16} className="text-emerald-400"/> Evolução Mensal</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dadosGrafico}><CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false}/><XAxis dataKey="name" stroke="#6b7280" fontSize={10}/><YAxis stroke="#6b7280" fontSize={10}/><Tooltip contentStyle={{backgroundColor: '#111827', border: '1px solid #374151'}}/><Legend/><Line dataKey="entradas" stroke="#10b981" strokeWidth={3}/><Line dataKey="saidas" stroke="#f43f5e" strokeWidth={3}/></LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2"><PieChartIcon size={16} className="text-emerald-400"/> Distribuição</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart><Pie data={dadosPizza} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{dadosPizza.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{backgroundColor: '#111827'}} /></PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[ {t: 'Top 10 Itens', d: rankingItens, u: 'UN'}, {t: 'Top 10 Clientes', d: rankingClientes, u: 'R$'} ].map((rank, i) => (
                <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="p-4 border-b border-gray-800 text-xs font-black uppercase">{rank.t}</div>
                    <div className="p-2">{rank.d.map(([nome, val], idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                            <span className="text-xs font-bold text-gray-300">{idx+1}. {nome}</span>
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded">{rank.u === 'R$' ? 'R$ ' + val.toLocaleString('pt-BR') : val + ' UN'}</span>
                        </div>
                    ))}</div>
                </div>
            ))}
          </div>

        </div>
      </div>
    </Layout>
  );
}