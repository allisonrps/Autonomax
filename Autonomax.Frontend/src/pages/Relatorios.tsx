import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  BarChart3, Users, Package, 
  ArrowUpRight, ArrowDownLeft, Wallet, 
  ChevronLeft, ChevronRight, Calendar,
  TrendingUp,
  Award
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';

interface Item {
  nome: string;
  quantidade: number;
}

interface Transacao {
  id: number;
  valor: number;
  tipo: string;
  data: string;
  cliente?: { nome: string };
  itens: Item[];
}

export function Relatorios() {
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [anoAtivo, setAnoAtivo] = useState(new Date().getFullYear());

  useEffect(() => {
    async function carregarEstatisticas() {
      if (!negocioId) return;
      try {
        setLoading(true);
        const res = await api.get(`/Transacoes/por-negocio/${negocioId}`);
        setTransacoes(res.data);
      } catch (err) {
        console.error("Erro ao carregar estatísticas", err);
      } finally {
        setLoading(false);
      }
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

    return {
      name: meses[i],
      entradas: ent,
      saidas: sai,
      lucro: ent - sai
    };
  });

  const rankingItensMap = transacoesDoAno
    .filter(t => t.tipo === 'Entrada')
    .flatMap(t => t.itens || [])
    .reduce((acc: Record<string, number>, item) => {
      const nomeLimpo = item.nome.trim();
      if (nomeLimpo) {
        acc[nomeLimpo] = (acc[nomeLimpo] || 0) + item.quantidade;
      }
      return acc;
    }, {});

  const itensOrdenados = Object.entries(rankingItensMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const rankingClientesMap = transacoesDoAno
    .filter(t => t.tipo === 'Entrada' && t.cliente)
    .reduce((acc: Record<string, number>, t) => {
      const nome = t.cliente!.nome;
      acc[nome] = (acc[nome] || 0) + t.valor;
      return acc;
    }, {});

  const clientesOrdenados = Object.entries(rankingClientesMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  if (loading) return (
    <Layout>
      <div className="h-96 flex items-center justify-center text-emerald-600 font-black uppercase tracking-widest animate-pulse">
        Carregando Analítico...
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16 pt-8 px-4">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-100">
              <BarChart3 size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Dashboard Anual</h2>
              <p className="text-sm text-gray-500 font-medium tracking-tight">Análise detalhada de performance e itens</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm shadow-emerald-50/50">
            <button onClick={() => setAnoAtivo(anoAtivo - 1)} className="p-2 hover:bg-emerald-50 rounded-xl transition-all text-gray-400 hover:text-emerald-600">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 px-4">
              <Calendar size={16} className="text-emerald-600" />
              <span className="font-black text-gray-700 tracking-widest">{anoAtivo}</span>
            </div>
            <button onClick={() => setAnoAtivo(anoAtivo + 1)} className="p-2 hover:bg-emerald-50 rounded-xl transition-all text-gray-400 hover:text-emerald-600">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* CARDS DE TOTAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                <ArrowUpRight size={12} className="text-emerald-500"/> Entradas
              </p>
              <p className="text-2xl font-black text-emerald-600">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><TrendingUp size={20} /></div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                <ArrowDownLeft size={12} className="text-red-500"/> Saídas
              </p>
              <p className="text-2xl font-black text-red-500">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-2xl text-red-500"><ArrowDownLeft size={20} /></div>
          </div>

          <div className="bg-emerald-600 p-6 rounded-3xl shadow-xl shadow-emerald-100 flex items-center justify-between text-white">
            <div>
              <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-1">Lucro Líquido</p>
              <p className="text-2xl font-black">R$ {faturamentoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <Wallet size={32} className="opacity-40" />
          </div>
        </div>

        {/* GRÁFICO */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-8">
             <div className="w-1 h-6 bg-emerald-600 rounded-full" />
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Fluxo de Caixa Mensal</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold', fill: '#999'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#ccc'}} />
                <Tooltip 
                  cursor={{fill: '#f0fdf4'}} 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'}} 
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                <Bar dataKey="entradas" name="Receitas" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="saidas" name="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="lucro" name="Lucro" fill="#065f46" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RANKINGS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ITENS */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-emerald-600" />
                <h3 className="font-black text-gray-700 uppercase text-[10px] tracking-widest">Itens Mais Vendidos</h3>
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">Qtd Acumulada</span>
            </div>
            <div className="p-6 space-y-4">
              {itensOrdenados.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-8">Sem itens registrados para este ano.</p>
              ) : (
                itensOrdenados.map(([nome, qtd], idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-300 group-hover:text-emerald-600 transition-colors">#{idx + 1}</span>
                      <span className="font-bold text-gray-700">{nome}</span>
                    </div>
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl text-xs font-black">{qtd} un.</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CLIENTES */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-emerald-600" />
                <h3 className="font-black text-gray-700 uppercase text-[10px] tracking-widest">Maiores Clientes</h3>
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">Valor Total</span>
            </div>
            <div className="p-6 space-y-4">
              {clientesOrdenados.length === 0 ? (
                 <p className="text-xs text-gray-400 italic text-center py-8">Sem movimentações de clientes.</p>
              ) : (
                clientesOrdenados.map(([nome, valor], idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-300 group-hover:text-emerald-600 transition-colors">#{idx + 1}</span>
                      <span className="font-bold text-gray-700">{nome}</span>
                    </div>
                    <span className="font-black text-gray-800 text-sm">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}