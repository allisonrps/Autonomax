import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  ArrowLeft, 
  User, 
  Receipt, 
  MapPin, 
  Phone, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  History
} from 'lucide-react';
import api from '../services/api';

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: string;
}

interface Cliente {
  id: number;
  nome: string;
  celular: string;
  endereco: string;
}

interface DadosCliente {
  cliente: Cliente;
  transacoes: Transacao[];
}

export function DetalhesCliente() {
  const { id } = useParams<{ id: string }>(); 
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');
  
  const [dados, setDados] = useState<DadosCliente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDados() {
      if (!id || !negocioId || negocioId === "undefined") {
        setErro("Selecione um negócio no menu superior antes de prosseguir.");
        setCarregando(false);
        return;
      }
      
      try {
        setCarregando(true);
        setErro(null);

        const response = await api.get(`/Transacoes/por-cliente/${id}`, {
          params: { negocioId: Number(negocioId) }
        });
        
        setDados(response.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setErro("Sua sessão expirou. Faça login novamente.");
        } else if (err.response?.status === 404) {
          setErro(`O cliente com ID ${id} não foi encontrado.`);
        } else {
          setErro("Não foi possível conectar ao servidor.");
        }
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [id, negocioId]);

  if (carregando) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="animate-spin text-emerald-600" size={40} />
          <p className="text-gray-500 animate-pulse font-black uppercase text-[10px] tracking-widest">Sincronizando dados...</p>
        </div>
      </Layout>
    );
  }

  if (erro || !dados) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-3xl border border-red-100 shadow-xl text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Cliente não encontrado</h2>
          <p className="text-gray-500 mt-2 font-medium">{erro || "O histórico deste cliente não pôde ser carregado."}</p>
          <Link to="/clientes" className="inline-block mt-6 bg-emerald-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg active:scale-95">
            Voltar para Clientes
          </Link>
        </div>
      </Layout>
    );
  }

  const { cliente, transacoes } = dados;
  const totalGasto = transacoes.reduce((acc, t) => acc + t.valor, 0);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16 pt-8 px-4">
        
        <Link to="/clientes" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 transition-all w-fit">
          <ArrowLeft size={16} /> Voltar para a lista
        </Link>

        {/* HEADER PERFIL - PADRÃO EMERALD */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-emerald-600 p-5 rounded-3xl text-white shadow-xl shadow-emerald-100">
              <User size={36} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-gray-800 tracking-tight uppercase">{cliente.nome}</h2>
              <div className="flex flex-wrap gap-4 mt-3">
                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter">
                  <Phone size={12}/> {cliente.celular || 'Sem celular'}
                </span>
                <span className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase">
                  <MapPin size={12} className="text-emerald-300"/> {cliente.endereco || 'Sem endereço'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-auto bg-emerald-950 p-6 rounded-3xl text-white shadow-2xl shadow-emerald-900/20">
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">Faturamento Total</p>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold opacity-60">R$</span>
              <span className="text-4xl font-black">
                {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* INDICADORES EM CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl">
              <Receipt size={28} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Lançamentos</p>
              <p className="text-2xl font-black text-gray-800">{transacoes.length} compras</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Ticket Médio</p>
              <p className="text-2xl font-black text-gray-800">
                R$ {transacoes.length > 0 ? (totalGasto / transacoes.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </p>
            </div>
          </div>
        </div>

        {/* TABELA HISTÓRICO - PADRÃO EMERALD */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <div className="flex items-center gap-2">
              <History size={18} className="text-emerald-600" />
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Histórico de Atividades</h3>
            </div>
            <span className="text-[10px] font-black bg-white border border-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase">Relatório Individual</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black tracking-[0.2em]">
                <tr className="border-b border-gray-100">
                  <th className="px-8 py-5">Data do Lançamento</th>
                  <th className="px-8 py-5">Descrição do Item</th>
                  <th className="px-8 py-5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transacoes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center text-gray-300 font-black uppercase text-xs tracking-widest italic">
                      Nenhuma transação vinculada a este cliente.
                    </td>
                  </tr>
                ) : (
                  transacoes.map(t => (
                    <tr key={t.id} className="hover:bg-emerald-50/20 transition-all group">
                      <td className="px-8 py-6 text-xs font-black text-gray-400 group-hover:text-emerald-600 transition-colors">
                        {new Date(t.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-gray-700 font-bold text-sm leading-tight">{t.descricao}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="font-black text-emerald-600 text-lg">
                          R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}