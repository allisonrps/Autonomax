import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom'; // Adicionado useNavigate
import { Layout } from '../components/Layout';
import { 
  Plus, 
  Trash2, 
  Wallet, 
  User as UserIcon, 
  CalendarDays, 
  X, 
  ShoppingCart,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Trophy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';

interface Item {
  nome: string;
  quantidade: number;
}

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
  cliente?: { id: number, nome: string };
  itens: Item[];
}

export function Dashboard() {
  const { mes, ano } = useParams();
  const navigate = useNavigate(); // Hook para navegação
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  const [mesAtivo, setMesAtivo] = useState(Number(mes) || new Date().getMonth() + 1);
  const [anoAtivo, setAnoAtivo] = useState(Number(ano) || new Date().getFullYear());

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  const [itensTemporarios, setItensTemporarios] = useState<{ item: string, qtd: number }[]>([]);
  const [novoItem, setNovoItem] = useState({ nome: '', qtd: 1 });

  const [novaTransacao, setNovaTransacao] = useState({
    valor: '',
    tipo: 'Entrada',
    clienteId: '',
    data: new Date().toISOString().split('T')[0]
  });

  const mesesNome = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // 1. Sincroniza os estados internos com a URL quando ela muda
  useEffect(() => {
    if (mes) setMesAtivo(Number(mes));
    if (ano) setAnoAtivo(Number(ano));
  }, [mes, ano]);

  // 2. Carrega os dados sempre que o negócio ou a data ativa mudar
  useEffect(() => { 
    carregarDados(); 
  }, [negocioId, mesAtivo, anoAtivo]);

  // Função para mudar o mês via navegação de URL
  const navegarPeriodo = (direcao: number) => {
    let novoMes = mesAtivo + direcao;
    let novoAno = anoAtivo;

    if (novoMes > 12) {
      novoMes = 1;
      novoAno++;
    } else if (novoMes < 1) {
      novoMes = 12;
      novoAno--;
    }

    navigate(`/dashboard/${novoMes}/${novoAno}`);
  };

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
      console.error("Erro ao carregar dados", err);
    }
  }

  const handleAdicionarItem = () => {
    if (!novoItem.nome.trim()) return;
    setItensTemporarios([...itensTemporarios, { item: novoItem.nome, qtd: novoItem.qtd }]);
    setNovoItem({ nome: '', qtd: 1 });
  };

  const handleRemoverItem = (index: number) => {
    setItensTemporarios(itensTemporarios.filter((_, i) => i !== index));
  };

  async function handleAddTransacao() {
    if (itensTemporarios.length === 0 || !novaTransacao.valor || !negocioId) {
      alert("Preencha os itens e o valor.");
      return;
    }

    const payload = {
      descricao: itensTemporarios.map(it => `${it.qtd}  ${it.item}`).join(', '),
      valor: Number(novaTransacao.valor),
      tipo: novaTransacao.tipo,
      negocioId: Number(negocioId),
      clienteId: novaTransacao.clienteId ? Number(novaTransacao.clienteId) : null,
      data: new Date(novaTransacao.data).toISOString(),
      itens: itensTemporarios.map(it => ({
        nome: it.item,
        quantidade: it.qtd
      }))
    };

    try {
      await api.post('/Transacoes', payload);
      setItensTemporarios([]);
      setNovaTransacao({ valor: '', tipo: 'Entrada', clienteId: '', data: new Date().toISOString().split('T')[0] });
      carregarDados();
    } catch (err) {
      alert("Erro ao salvar lançamento.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este lançamento?")) return;
    try {
      await api.delete(`/Transacoes/${id}`);
      carregarDados();
    } catch (err) { alert("Erro ao excluir"); }
  }

  const rankingRaw = transacoes
    .filter(t => t.tipo === 'Entrada')
    .flatMap(t => t.itens || [])
    .reduce((acc: any, curr) => {
      acc[curr.nome] = (acc[curr.nome] || 0) + curr.quantidade;
      return acc;
    }, {});

  const rankingOrdenado = Object.entries(rankingRaw)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  const totalEntradas = transacoes.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoes.filter(t => t.tipo === 'Saida').reduce((acc, t) => acc + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        
        {/* NAVEGAÇÃO DE MÊS */}
        <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-blue-600" size={24} />
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">
              {mesesNome[mesAtivo - 1]} <span className="text-blue-600">{anoAtivo}</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navegarPeriodo(-1)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-500 hover:text-blue-600"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => navegarPeriodo(1)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-500 hover:text-blue-600"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* TOP SECTION: CARDS + RANKING */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entradas</p>
                <p className="text-2xl font-black text-green-600 mt-1">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-2xl text-green-600"><ArrowUpRight size={20} /></div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saídas</p>
                <p className="text-2xl font-black text-red-500 mt-1">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-2xl text-red-600"><ArrowDownLeft size={20} /></div>
            </div>
            <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-100 flex items-center justify-between text-white">
              <div>
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Saldo Mensal</p>
                <p className="text-2xl font-black mt-1">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <Wallet size={32} className="opacity-40" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-orange-500" />
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ranking de Itens</h4>
            </div>
            <div className="space-y-3">
              {rankingOrdenado.length === 0 && <p className="text-[10px] text-gray-400 italic">Sem vendas...</p>}
              {rankingOrdenado.map(([nome, qtd], idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-600 truncate max-w-[100px]">{idx + 1}º {nome}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-black">{qtd} </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="bg-blue-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full">1</span>
                <label className="text-sm font-black text-gray-700 uppercase tracking-tight">O que você está vendendo?</label>
              </div>
              <div className="flex gap-2">
                <input placeholder="Ex: Consultoria..." className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={novoItem.nome} onChange={e => setNovoItem({...novoItem, nome: e.target.value})} />
                <input type="number" className="w-20 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-center font-bold" value={novoItem.qtd} onChange={e => setNovoItem({...novoItem, qtd: Number(e.target.value)})} />
                <button onClick={handleAdicionarItem} className="bg-blue-600 text-white px-5 rounded-2xl hover:bg-blue-700 shadow-lg transition-all active:scale-90"><Plus size={24} /></button>
              </div>
              <div className="min-h-[140px] p-5 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-wrap gap-2 content-start">
                {itensTemporarios.length === 0 && <div className="w-full text-center py-8 text-gray-400 text-[10px] font-bold uppercase">Lista Vazia</div>}
                {itensTemporarios.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 pl-4 pr-2 py-2 rounded-xl shadow-sm animate-in fade-in zoom-in duration-300">
                    <span className="text-blue-600 font-black text-xs">{it.qtd}x</span>
                    <span className="text-gray-600 text-xs font-bold">{it.item}</span>
                    <button onClick={() => handleRemoverItem(idx)} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="bg-blue-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full">2</span>
                <label className="text-sm font-black text-gray-700 uppercase tracking-tight">Fechamento</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor Total</label>
                  <input type="number" placeholder="0,00" className="w-full p-4 bg-blue-50/50 border border-blue-100 rounded-2xl font-black text-blue-700 outline-none text-lg" value={novaTransacao.valor} onChange={e => setNovaTransacao({...novaTransacao, valor: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
                  <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-600 outline-none h-[62px]" value={novaTransacao.tipo} onChange={e => setNovaTransacao({...novaTransacao, tipo: e.target.value})}>
                    <option value="Entrada">Receita (+)</option>
                    <option value="Saida">Despesa (-)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600" value={novaTransacao.data} onChange={e => setNovaTransacao({...novaTransacao, data: e.target.value})} />
                <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600" value={novaTransacao.clienteId} onChange={e => setNovaTransacao({...novaTransacao, clienteId: e.target.value})}>
                  <option value="">Cliente (Opcional)</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <button onClick={handleAddTransacao} disabled={itensTemporarios.length === 0 || !novaTransacao.valor} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-black transition-all disabled:opacity-30 active:scale-95">Salvar Lançamento</button>
            </div>
          </div>
        </div>

        {/* TABELA */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2"><Receipt size={18} className="text-blue-600"/> Histórico</h3>
            <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase">{transacoes.length} registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50">
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  <th className="px-8 py-5">Descrição e Cliente</th>
                  <th className="px-8 py-5 text-right">Valor</th>
                  <th className="px-8 py-5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transacoes.length === 0 ? (
                  <tr><td colSpan={3} className="px-8 py-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest italic">Nada para mostrar aqui</td></tr>
                ) : (
                  transacoes.map(t => (
                    <tr key={t.id} className="hover:bg-blue-50/30 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl flex-shrink-0 ${t.tipo === 'Entrada' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {t.tipo === 'Entrada' ? <Plus size={16} /> : <X size={16} />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-700 text-sm leading-tight break-words">{t.descricao}</div>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{new Date(t.data).toLocaleDateString('pt-BR')}</span>
                              {t.cliente && <Link to={`/clientes/${t.cliente.id}`} className="text-[10px] text-blue-500 font-black uppercase tracking-widest hover:text-blue-700 underline underline-offset-4">{t.cliente.nome}</Link>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-8 py-6 text-right font-black text-base whitespace-nowrap ${t.tipo === 'Entrada' ? 'text-green-600' : 'text-red-500'}`}>{t.tipo === 'Entrada' ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-8 py-6 text-center">
                        <button onClick={() => handleDelete(t.id)} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all shadow-sm border border-transparent hover:border-red-100"><Trash2 size={20}/></button>
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