import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  ArrowLeft, 
  User, 
  DollarSign, 
  Receipt, 
  MapPin, 
  Phone, 
  AlertCircle, 
  Loader2,
  TrendingUp
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
  // Captura do ID da URL
  const { id } = useParams<{ id: string }>(); 
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');
  
  const [dados, setDados] = useState<DadosCliente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDados() {
      // DEBUG: Vamos ver o que o React está tentando enviar
      console.log("Tentando carregar Cliente ID:", id);
      console.log("Negocio ID do LocalStorage:", negocioId);

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
        
        console.log("Resposta da API:", response.data);
        setDados(response.data);
      } catch (err: any) {
        console.error("ERRO DETALHADO DA API:", err.response);
        
        if (err.response?.status === 401) {
          setErro("Sua sessão expirou. Faça login novamente.");
        } else if (err.response?.status === 404) {
          setErro(`O cliente com ID ${id} não foi encontrado no negócio selecionado.`);
        } else {
          setErro("Não foi possível conectar ao servidor. Verifique se o Backend está rodando.");
        }
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [id, negocioId]);

  // Tela de Carregamento
  if (carregando) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-gray-500 animate-pulse font-medium">Sincronizando dados...</p>
        </div>
      </Layout>
    );
  }

  // Tela de Erro (Caso o cliente realmente não exista no banco)
  if (erro || !dados) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-2xl border border-red-100 shadow-sm text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-800">Ops! Cliente não encontrado</h2>
          <p className="text-gray-500 mt-2">{erro || "O histórico deste cliente não pôde ser carregado."}</p>
          <Link to="/clientes" className="inline-block mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Voltar para Clientes
          </Link>
        </div>
      </Layout>
    );
  }

  // Desestruturação dos dados após garantir que existem
  const { cliente, transacoes } = dados;
  const totalGasto = transacoes.reduce((acc, t) => acc + t.valor, 0);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        
        <Link to="/clientes" className="flex items-center gap-2 text-sm text-gray-500 font-medium hover:text-blue-600 transition-colors w-fit">
          <ArrowLeft size={16} /> Voltar para a lista
        </Link>

        {/* HEADER PERFIL */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-4 rounded-full text-white shadow-lg shadow-blue-100">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase">{cliente.nome}</h2>
              <div className="flex flex-wrap gap-4 mt-2 text-gray-500 text-sm">
                <span className="flex items-center gap-1.5"><Phone size={14} className="text-blue-500"/> {cliente.celular || 'Sem celular'}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-500"/> {cliente.endereco || 'Sem endereço'}</span>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-auto bg-blue-600 p-5 rounded-2xl text-white shadow-xl shadow-blue-200">
            <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest mb-1">Total Consumido</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg opacity-90">R$</span>
              <span className="text-3xl font-black">
                {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* INDICADORES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Receipt size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Lançamentos</p>
              <p className="text-xl font-bold">{transacoes.length} pedidos</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Ticket Médio</p>
              <p className="text-xl font-bold">
                R$ {transacoes.length > 0 ? (totalGasto / transacoes.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </p>
            </div>
          </div>
        </div>

        {/* TABELA HISTÓRICO */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-800">Histórico de Atividades</h3>
            <span className="text-xs font-medium text-gray-400">Dados baseados no negócio atual</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transacoes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">
                      Nenhuma transação vinculada a este cliente.
                    </td>
                  </tr>
                ) : (
                  transacoes.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(t.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700 font-semibold">{t.descricao}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-blue-600">
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