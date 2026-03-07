import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  BarChart3, Package, ArrowUpRight, ArrowDownLeft, 
  ChevronLeft, ChevronRight, Calendar,
  TrendingUp, ChevronDown, ChevronUp, LineChart as LineChartIcon, Users
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
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

  // ESTADOS RETRÁTEIS: Todos iniciam fechados por padrão
  const [resumoAberto, setResumoAberto] = useState(false);
  const [graficoAberto, setGraficoAberto] = useState(false); 
  const [itensAberto, setItensAberto] = useState(false);
  const [clientesAberto, setClientesAberto] = useState(false);

  useEffect(() => {
    async function carregarEstatisticas() {
      if (!negocioId) return;
      try {
        setLoading(true);
        const res = await api.get(`/Transacoes/por-negocio/${negocioId}`);
        setTransacoes(res.data);
      } catch (err) { console.error("Erro ao carregar estatísticas", err); } 
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
    return { name: meses[i], entradas: ent, saidas: sai, lucro: ent - sai };
  });

  const rankingItensMap = transacoesDoAno
    .filter(t => t.tipo === 'Entrada')
    .flatMap(t => t.itens || [])
    .reduce((acc: Record<string, number>, item) => {
      const nomeLimpo = item.nome.trim();
      if (nomeLimpo) acc[nomeLimpo] = (acc[nomeLimpo] || 0) + item.quantidade;
      return acc;
    }, {});

  const itensOrdenados = Object.entries(rankingItensMap).sort(([, a], [, b]) => b - a).slice(0, 10);

  const rankingClientesMap = transacoesDoAno
    .filter(t => t.tipo === 'Entrada' && t.cliente)
    .reduce((acc: Record<string, number>, t) => {
      const nome = t.cliente!.nome;
      acc[nome] = (acc[nome] || 0) + t.valor;
      return acc;
    }, {});

  const clientesOrdenados = Object.entries(rankingClientesMap).sort(([, a], [, b]) => b - a).slice(0, 10);

  if (loading) return (
    <Layout><div className="h-96 flex items-center justify-center text-emerald-600 font-black uppercase tracking-widest animate-pulse">Carregando Analítico...</div></Layout>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16 pt-8 px-4 font-sans">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-100"><BarChart3 size={28} /></div>
            <div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Performance Anual</h2>
              <p className="text-sm text-gray-500 font-medium tracking-tight">Análise financeira consolidada</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <button onClick={() => setAnoAtivo(anoAtivo - 1)} className="p-2 hover:bg-emerald-50 rounded-xl transition-all text-gray-400 border-none cursor-pointer bg-transparent"><ChevronLeft size={20} /></button>
            <div className="flex items-center gap-2 px-4"><Calendar size={16} className="text-emerald-600" /><span className="font-black text-gray-700 tracking-widest">{anoAtivo}</span></div>
            <button onClick={() => setAnoAtivo(anoAtivo + 1)} className="p-2 hover:bg-emerald-50 rounded-xl transition-all text-gray-400 border-none cursor-pointer bg-transparent"><ChevronRight size={20} /></button>
          </div>
        </div>

        {/* 1. RESUMO FINANCEIRO RETRÁTIL */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <button onClick={() => setResumoAberto(!resumoAberto)} className="w-full bg-emerald-50/30 px-8 py-5 flex items-center justify-between hover:bg-emerald-50 transition-colors border-none outline-none cursor-pointer">
            <div className="flex items-center gap-3">
              <TrendingUp size={20} className="text-emerald-600"/>
              <h3 className="text-xs font-black text-emerald-900 uppercase tracking-[0.2em]">Resumo Financeiro</h3>
            </div>
            {resumoAberto ? <ChevronUp size={20} className="text-emerald-600"/> : <ChevronDown size={20} className="text-emerald-600"/>}
          </button>
          {resumoAberto && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top duration-300">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1"><ArrowUpRight size={12} className="text-emerald-500"/> Receitas</p><p className="text-2xl font-black text-emerald-600">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1"><ArrowDownLeft size={12} className="text-red-500"/> Despesas</p><p className="text-2xl font-black text-red-500">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
              </div>
              <div className={`p-6 rounded-2xl shadow-inner text-white ${faturamentoLiquido >= 0 ? 'bg-emerald-950' : 'bg-red-950'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Saldo Líquido</p>
                <p className="text-2xl font-black mt-1">R$ {faturamentoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          )}
        </div>

        {/* 2. GRÁFICO EM LINHAS RETRÁTIL */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <button onClick={() => setGraficoAberto(!graficoAberto)} className="w-full bg-emerald-50/50 px-8 py-5 flex items-center justify-between hover:bg-emerald-50 transition-colors border-none outline-none cursor-pointer">
            <div className="flex items-center gap-3">
              <LineChartIcon size={20} className="text-emerald-600" />
              <h3 className="text-xs font-black text-emerald-900 uppercase tracking-[0.2em]">Tendência de Fluxo de Caixa</h3>
            </div>
            {graficoAberto ? <ChevronUp size={20} className="text-emerald-600" /> : <ChevronDown size={20} className="text-emerald-600" />}
          </button>
          {graficoAberto && (
            <div className="p-8 animate-in slide-in-from-top duration-300">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold', fill: '#999'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#ccc'}} tickFormatter={(value) => `R$ ${value}`} />
                    <Tooltip 
                        contentStyle={{
                        borderRadius: '20px', 
                        border: 'none', 
                         boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                       }} 
                     formatter={(value: any) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '30px' }} />
                    <Line type="monotone" dataKey="entradas" name="Receitas" stroke="#10b981" strokeWidth={4} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="saidas" name="Despesas" stroke="#ef4444" strokeWidth={4} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="lucro" name="Lucro Líquido" stroke="#064e3b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* 3. RANKING DE ITENS RETRÁTIL */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <button onClick={() => setItensAberto(!itensAberto)} className="w-full bg-gray-50 px-8 py-5 border-b border-gray-100 flex items-center justify-between hover:bg-gray-100 transition-colors border-none outline-none cursor-pointer">
            <div className="flex items-center gap-3">
              <Package size={20} className="text-emerald-600" />
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Top 10 Itens Mais Vendidos</h3>
            </div>
            {itensAberto ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>
          {itensAberto && (
            <div className="p-8 animate-in slide-in-from-top duration-300 grid grid-cols-1 md:grid-cols-2 gap-4">
              {itensOrdenados.length === 0 ? <p className="text-xs text-gray-400 italic col-span-full text-center py-4">Nenhum item registrado.</p> : 
                itensOrdenados.map(([nome, qtd], idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-emerald-600/30 w-5">#{idx + 1}</span>
                      <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">{nome}</span>
                    </div>
                    <span className="bg-emerald-600 text-white px-3 py-1 rounded-xl text-[10px] font-black">{qtd} UN</span>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* 4. RANKING DE CLIENTES RETRÁTIL */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <button onClick={() => setClientesAberto(!clientesAberto)} className="w-full bg-gray-50 px-8 py-5 border-b border-gray-100 flex items-center justify-between hover:bg-gray-100 transition-colors border-none outline-none cursor-pointer">
            <div className="flex items-center gap-3">
              <Users size={20} className="text-emerald-600" />
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Top 10 Maiores Clientes</h3>
            </div>
            {clientesAberto ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>
          {clientesAberto && (
            <div className="p-8 animate-in slide-in-from-top duration-300 grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientesOrdenados.length === 0 ? <p className="text-xs text-gray-400 italic col-span-full text-center py-4">Nenhuma movimentação de cliente.</p> : 
                clientesOrdenados.map(([nome, valor], idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:border-emerald-950/20 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-300 w-5">#{idx + 1}</span>
                      <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">{nome}</span>
                    </div>
                    <span className="text-emerald-900 font-black text-sm tracking-tighter">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))
              }
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}