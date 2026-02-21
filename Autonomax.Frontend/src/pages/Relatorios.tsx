import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  BarChart3, Users, Package, 
  ArrowUpRight, ArrowDownLeft, Wallet, 
  ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';

// Definição das interfaces para garantir que o TypeScript entenda os dados do banco
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
  itens: Item[]; // Este array precisa vir preenchido do Backend
}

export function Relatorios() {
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId'); //
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [anoAtivo, setAnoAtivo] = useState(new Date().getFullYear());

  useEffect(() => {
    async function carregarEstatisticas() {
      if (!negocioId) return;
      try {
        setLoading(true);
        // Importante: No seu C#, use .Include(t => t.Itens) neste endpoint!
        const res = await api.get(`/Transacoes/por-negocio/${negocioId}`);
        console.log("Dados recebidos da API:", res.data); 
        setTransacoes(res.data);
      } catch (err) {
        console.error("Erro ao carregar estatísticas", err);
      } finally {
        setLoading(false);
      }
    }
    carregarEstatisticas();
  }, [negocioId]);

  // 1. Filtro por Ano
  const transacoesDoAno = transacoes.filter(t => new Date(t.data).getFullYear() === anoAtivo);

  // 2. Totais Financeiros
  const totalEntradas = transacoesDoAno.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoesDoAno.filter(t => t.tipo === 'Saida').reduce((acc, t) => acc + t.valor, 0);
  const faturamentoLiquido = totalEntradas - totalSaidas;

  // 3. Dados do Gráfico Mensal
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

  // 4. RANKING GLOBAL DE ITENS (Soma as quantidades da tabela ItensTransacao)
  const rankingItensMap = transacoesDoAno
    .filter(t => t.tipo === 'Entrada')
    .flatMap(t => t.itens || []) // Extrai os itens de todas as transações do ano
    .reduce((acc: Record<string, number>, item) => {
      const nomeLimpo = item.nome.trim(); //
      if (nomeLimpo) {
        acc[nomeLimpo] = (acc[nomeLimpo] || 0) + item.quantidade; // Soma as quantidades
      }
      return acc;
    }, {});

  const itensOrdenados = Object.entries(rankingItensMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // 5. RANKING DE CLIENTES
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

  if (loading) return <div className="p-8 text-center font-bold">Carregando estatísticas...</div>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        
        {/* HEADER COM SELETOR DE ANO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl">
              <BarChart3 size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Dashboard Anual</h2>
              <p className="text-sm text-gray-500 font-medium tracking-tight">Análise baseada em ItensTransacao</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <button onClick={() => setAnoAtivo(anoAtivo - 1)} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-blue-600">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 px-4">
              <Calendar size={16} className="text-blue-600" />
              <span className="font-black text-gray-700 tracking-widest">{anoAtivo}</span>
            </div>
            <button onClick={() => setAnoAtivo(anoAtivo + 1)} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-blue-600">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* CARDS DE TOTAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-green-500 mb-2 font-black uppercase text-[10px] tracking-widest">
              <ArrowUpRight size={16} /> Entradas
            </div>
            <p className="text-3xl font-black text-gray-800">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-red-500 mb-2 font-black uppercase text-[10px] tracking-widest">
              <ArrowDownLeft size={16} /> Saídas
            </div>
            <p className="text-3xl font-black text-gray-800">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-100 text-white">
            <div className="flex items-center gap-2 text-blue-200 mb-2 font-black uppercase text-[10px] tracking-widest">
              <Wallet size={16} /> Lucro Líquido
            </div>
            <p className="text-3xl font-black">R$ {faturamentoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* GRÁFICO */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Fluxo Mensal</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold', fill: '#999'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#ccc'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Legend verticalAlign="top" align="right" iconType="circle" />
                <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucro" name="Lucro Líquido" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RANKINGS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
              <Package size={18} className="text-orange-500" />
              <h3 className="font-black text-gray-700 uppercase text-[10px] tracking-widest">Top Itens Vendidos (Qtd)</h3>
            </div>
            <div className="p-6 space-y-4">
              {itensOrdenados.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-4">Verifique se o Backend enviou a lista 'itens'</p>
              ) : (
                itensOrdenados.map(([nome, qtd], idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-300">#{idx + 1}</span>
                      <span className="font-bold text-gray-700">{nome}</span>
                    </div>
                    <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-xl text-xs font-black">{qtd} un.</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              <h3 className="font-black text-gray-700 uppercase text-[10px] tracking-widest">Top Clientes (Valor)</h3>
            </div>
            <div className="p-6 space-y-4">
              {clientesOrdenados.map(([nome, valor], idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-300">#{idx + 1}</span>
                    <span className="font-bold text-gray-700">{nome}</span>
                  </div>
                  <span className="font-black text-gray-800 text-sm">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}