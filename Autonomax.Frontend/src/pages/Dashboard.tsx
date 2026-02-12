import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet, User as UserIcon, CalendarDays } from 'lucide-react';
import api from '../services/api';
import { useParams } from 'react-router-dom';

interface Cliente {
  id: number;
  nome: string;
}

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  tipo: string;
  data: string;
  clienteId?: number;
  cliente?: { nome: string };
}

export function Dashboard() {
  const { mes, ano } = useParams();
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  // Estados para Filtro (Mês e Ano) inicializados pela URL ou data atual
  const [mesAtivo, setMesAtivo] = useState(Number(mes) || new Date().getMonth() + 1);
  const [anoAtivo, setAnoAtivo] = useState(Number(ano) || new Date().getFullYear());

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [novaTransacao, setNovaTransacao] = useState({
    descricao: '',
    valor: '',
    tipo: 'Entrada',
    clienteId: '',
    data: new Date().toISOString().split('T')[0]
  });

  const mesesNome = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Sincroniza o estado interno quando a URL muda (via cliques no Layout)
  useEffect(() => {
    if (mes) setMesAtivo(Number(mes));
    if (ano) setAnoAtivo(Number(ano));
  }, [mes, ano]);

  // Carrega os dados sempre que o negócio ou o período mudar
  useEffect(() => {
    carregarDados();
  }, [negocioId, mesAtivo, anoAtivo]);

  async function carregarDados() {
    if (!negocioId) return;
    try {
      const [resTrans, resCli] = await Promise.all([
        api.get(`/Transacoes/por-periodo/${negocioId}?mes=${mesAtivo}&ano=${anoAtivo}`),
        api.get(`/Clientes/por-negocio/${negocioId}`)
      ]);
      
      setTransacoes(resTrans.data);
      setClientes(resCli.data);
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard", err);
    }
  }

  async function handleAddTransacao() {
    if (!novaTransacao.descricao || !novaTransacao.valor || !negocioId) return;

    try {
      await api.post('/Transacoes', {
        ...novaTransacao,
        valor: Number(novaTransacao.valor),
        negocioId: Number(negocioId),
        clienteId: novaTransacao.clienteId ? Number(novaTransacao.clienteId) : null,
        data: new Date(novaTransacao.data).toISOString() 
      });
      
      setNovaTransacao({ 
        descricao: '', 
        valor: '', 
        tipo: 'Entrada', 
        clienteId: '', 
        data: new Date().toISOString().split('T')[0] 
      });
      carregarDados();
    } catch (err) {
      alert("Erro ao salvar lançamento.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Deseja excluir este lançamento?")) return;
    try {
      await api.delete(`/Transacoes/${id}`);
      carregarDados();
    } catch (err) {
      alert("Erro ao excluir");
    }
  }

  const totalEntradas = transacoes
    .filter(t => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalSaidas = transacoes
    .filter(t => t.tipo === 'Saida')
    .reduce((acc, t) => acc + t.valor, 0);

  const saldo = totalEntradas - totalSaidas;

  return (
    <Layout>
      <div className="space-y-6">
        {/* TÍTULO DA PÁGINA DINÂMICO */}
        <div className="flex items-center gap-2 text-gray-800">
          <CalendarDays className="text-blue-600" />
          <h2 className="text-xl font-bold">
            Fluxo de Caixa: <span className="text-blue-600">{mesesNome[mesAtivo - 1]}</span> de {anoAtivo}
          </h2>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Entradas</p>
              <p className="text-2xl font-bold text-green-600">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <ArrowUpCircle className="text-green-500 size-10 opacity-20" />
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Saídas</p>
              <p className="text-2xl font-bold text-red-500">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <ArrowDownCircle className="text-red-500 size-10 opacity-20" />
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between bg-blue-50/30">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Saldo do Mês</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Wallet className="text-blue-500 size-10 opacity-20" />
          </div>
        </div>

        {/* FORMULÁRIO DE LANÇAMENTO */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-blue-600" /> Novo Lançamento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input 
              type="date"
              className="p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              value={novaTransacao.data}
              onChange={e => setNovaTransacao({...novaTransacao, data: e.target.value})}
            />
            <input 
              placeholder="Descrição"
              className="md:col-span-1 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={novaTransacao.descricao}
              onChange={e => setNovaTransacao({...novaTransacao, descricao: e.target.value})}
            />
            <input 
              type="number"
              placeholder="Valor"
              className="p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={novaTransacao.valor}
              onChange={e => setNovaTransacao({...novaTransacao, valor: e.target.value})}
            />
            <select 
              className="p-2 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
              value={novaTransacao.tipo}
              onChange={e => setNovaTransacao({...novaTransacao, tipo: e.target.value})}
            >
              <option value="Entrada">Entrada (+)</option>
              <option value="Saida">Saída (-)</option>
            </select>
            
            <div className="flex gap-2">
              <select 
                key={`select-cli-${negocioId}`}
                className="flex-1 p-2 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500"
                value={novaTransacao.clienteId}
                onChange={e => setNovaTransacao({...novaTransacao, clienteId: e.target.value})}
              >
                <option value="">{clientes.length > 0 ? "Cliente (Opcional)" : "Sem clientes"}</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <button onClick={handleAddTransacao} className="bg-black text-white p-2 px-4 rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center shadow-md active:scale-95">
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* TABELA DE LANÇAMENTOS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição / Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Valor</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transacoes.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic font-light">
                    Nenhum lançamento encontrado para {mesesNome[mesAtivo - 1]}.
                  </td>
                </tr>
              )}
              {transacoes.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 group transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-700">{t.descricao}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(t.data).toLocaleDateString('pt-BR')}
                      </span>
                      {t.cliente && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-blue-100">
                          <UserIcon size={10} /> {t.cliente.nome}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${t.tipo === 'Entrada' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.tipo === 'Entrada' ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(t.id)} 
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      title="Excluir lançamento"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}