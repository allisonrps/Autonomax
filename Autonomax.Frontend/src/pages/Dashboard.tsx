import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Trash2, CalendarDays, X, Receipt, ChevronLeft, 
  ChevronRight, CheckCircle2, FileDown,
  ChevronDown, ChevronUp, Edit3, Save, Tag,
  BarChart3, User, DollarSign, HandCoins, Plus, PackagePlus, Target, Wallet, ArrowUpRight, ArrowDownRight,
  Filter, Coins, QrCode, CreditCard
} from 'lucide-react';
import api from '../services/api';

interface Item { nome: string; quantidade: number; }
interface Cliente { id: number; nome: string; }
interface Fornecedor { id: number; nome: string; }

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  tipo: string;
  status: string;
  metodoPagamento: string;
  data: string;
  cliente?: { id: number, nome: string };
  fornecedor?: { id: number, nome: string };
  clienteId?: number | null;
  fornecedorId?: number | null;
  itens: Item[];
}

export function Dashboard() {
  const { mes, ano } = useParams();
  const navigate = useNavigate();
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  const [mesAtivo, setMesAtivo] = useState(Number(mes) || new Date().getMonth() + 1);
  const [anoAtivo, setAnoAtivo] = useState(Number(ano) || new Date().getFullYear());
  
  const [resumoAberto, setResumoAberto] = useState(false); 
  const [itemAberto, setItemAberto] = useState<number | null>(null);
  
  const [filtroAtivo, setFiltroAtivo] = useState<'Tudo' | 'Entrada' | 'Saida' | 'Pendente'>('Tudo');

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Transacao | null>(null);
  const [novoItemEdicao, setNovoItemEdicao] = useState({ nome: '', qtd: 1 });

  const [itensTemporarios, setItensTemporarios] = useState<{ item: string, qtd: number }[]>([]);
  const [novoItem, setNovoItem] = useState({ item: '', qtd: 1 });
  
  const [novaTransacao, setNovaTransacao] = useState({
    valor: '', tipo: 'Entrada', status: 'Pago', metodoPagamento: 'Pix', clienteId: '', fornecedorId: '',
    data: new Date().toLocaleDateString('en-CA')
  });

  const mesesNome = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const formatarDataLocal = (dataISO: string) => {
    const data = new Date(dataISO);
    data.setMinutes(data.getMinutes() + data.getTimezoneOffset());
    return data;
  };

  const carregarDados = useCallback(async () => {
    if (!negocioId) return;
    try {
      const [resTrans, resCli, resFor] = await Promise.all([
        api.get(`/Transacoes/por-periodo/${negocioId}?mes=${mesAtivo}&ano=${anoAtivo}`),
        api.get(`/Clientes/por-negocio/${negocioId}`),
        api.get(`/Fornecedores/por-negocio/${negocioId}`)
      ]);
      const ordenadas = resTrans.data.sort((a: Transacao, b: Transacao) => 
        new Date(b.data).getTime() - new Date(a.data).getTime()
      );
      setTransacoes(ordenadas);
      setClientes(resCli.data || []);
      setFornecedores(resFor.data || []);
    } catch (err) { console.error(err); }
  }, [negocioId, mesAtivo, anoAtivo]);

  useEffect(() => {
    if (mes) setMesAtivo(Number(mes));
    if (ano) setAnoAtivo(Number(ano));
  }, [mes, ano]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const navegarPeriodo = (direcao: number) => {
    let nMes = mesAtivo + direcao;
    let nAno = anoAtivo;
    if (nMes > 12) { nMes = 1; nAno++; } else if (nMes < 1) { nMes = 12; nAno--; }
    navigate(`/dashboard/${nMes}/${nAno}`);
  };

  const handleExportarMensalPDF = async () => {
    try {
      const response = await api.get(`/Transacoes/fluxo-caixa/relatorio-pdf`, {
        params: { negocioId, mes: mesAtivo, ano: anoAtivo },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_${mesesNome[mesAtivo-1]}_${anoAtivo}.pdf`;
      a.click();
    } catch (err) { alert("Erro ao gerar PDF."); }
  };

  const handleAdicionarItem = () => {
    if (!novoItem.item.trim()) return;
    setItensTemporarios([...itensTemporarios, { item: novoItem.item, qtd: novoItem.qtd }]);
    setNovoItem({ item: '', qtd: 1 });
  };

  async function handleAddTransacao() {
    if (itensTemporarios.length === 0) return alert("Adicione pelo menos um item.");
    if (!novaTransacao.valor) return alert("Informe o valor.");
    const dataAjustada = new Date(novaTransacao.data + 'T12:00:00');
    const payload = {
      descricao: itensTemporarios.map(it => `${it.qtd}x ${it.item}`).join(', '),
      valor: Number(novaTransacao.valor), 
      tipo: novaTransacao.tipo,
      status: novaTransacao.status, 
      metodoPagamento: novaTransacao.metodoPagamento,
      negocioId: Number(negocioId), 
      clienteId: novaTransacao.tipo === 'Entrada' ? Number(novaTransacao.clienteId) || null : null,
      fornecedorId: novaTransacao.tipo === 'Saida' ? Number(novaTransacao.fornecedorId) || null : null,
      data: dataAjustada.toISOString(),
      itens: itensTemporarios.map(it => ({ nome: it.item, quantity: it.qtd }))
    };
    try {
      await api.post('/Transacoes', payload);
      setItensTemporarios([]);
      setNovaTransacao({ ...novaTransacao, valor: '', clienteId: '', fornecedorId: '' });
      setFormAberto(false);
      carregarDados();
    } catch (err) { alert("Erro ao salvar."); }
  }

  async function handleUpdateTransacao() {
    if (!editando) return;
    const dataBase = editando.data.split('T')[0];
    const dataAjustada = new Date(dataBase + 'T12:00:00');
    const payload = {
      ...editando,
      descricao: editando.itens.map(it => `${it.quantidade || it.quantidade}x ${it.nome}`).join(', '),
      negocioId: Number(negocioId),
      clienteId: editando.tipo === 'Entrada' ? Number(editando.clienteId) || null : null,
      fornecedorId: editando.tipo === 'Saida' ? Number(editando.fornecedorId) || null : null,
      data: dataAjustada.toISOString()
    };
    try {
      await api.put(`/Transacoes/${editando.id}`, payload);
      setEditando(null);
      carregarDados();
    } catch (err) { alert("Erro ao atualizar."); }
  }

  async function handleAlternarStatus(t: Transacao) {
    const nStatus = t.status === 'Pago' ? 'Pendente' : 'Pago';
    try {
      await api.put(`/Transacoes/${t.id}`, { ...t, status: nStatus, negocioId: Number(negocioId) });
      carregarDados();
    } catch (err) { console.error(err); }
  }

  async function handleAlternarMetodo(t: Transacao) {
    const metodos = ['Pix', 'Dinheiro', 'Cartão'];
    const next = (metodos.indexOf(t.metodoPagamento) + 1) % metodos.length;
    try {
      await api.put(`/Transacoes/${t.id}`, { ...t, metodoPagamento: metodos[next], negocioId: Number(negocioId) });
      carregarDados();
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir lançamento?")) return;
    try { await api.delete(`/Transacoes/${id}`); carregarDados(); } catch (err) { alert("Erro ao excluir"); }
  }

  const totalEntradas = transacoes.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoes.filter(t => t.tipo === 'Saida').reduce((acc, t) => acc + t.valor, 0);
  const totalPendentes = transacoes.filter(t => t.status === 'Pendente').reduce((acc, t) => acc + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  const transacoesFiltradas = transacoes.filter(t => {
    if (filtroAtivo === 'Tudo') return true;
    if (filtroAtivo === 'Pendente') return t.status === 'Pendente';
    return t.tipo === filtroAtivo;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-5">
          
          {/* NAVEGAÇÃO / CONTROLE DE PERÍODO PADRÃO CLIENTES */}
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50 hidden md:flex">
                <CalendarDays size={22} />
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black tracking-tight uppercase text-gray-100 whitespace-nowrap">
                  {mesesNome[mesAtivo - 1]} <span className="text-emerald-400">{anoAtivo}</span>
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 w-full lg:w-auto justify-end">
              <button onClick={() => navegarPeriodo(-1)} className="p-2 hover:bg-gray-800 rounded-md transition-all text-gray-300 border border-gray-800 bg-gray-950 cursor-pointer"><ChevronLeft size={18} /></button>
              <button onClick={() => navegarPeriodo(1)} className="p-2 hover:bg-gray-800 rounded-md transition-all text-gray-300 border border-gray-800 bg-gray-950 cursor-pointer"><ChevronRight size={18} /></button>
            </div>
          </div>

          {/* PAINEL DE SALDOS */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <button onClick={() => setResumoAberto(!resumoAberto)} className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-none outline-none cursor-pointer border-b border-gray-800">
              <div className="flex items-center gap-2"><BarChart3 size={18} className="text-emerald-400"/><h3 className="text-xs font-black text-gray-200 uppercase tracking-wider">Painel de Saldos</h3></div>
              {resumoAberto ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
            </button>
            {resumoAberto && (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-in slide-in-from-top duration-200 bg-gray-900">
                <div className="p-4 rounded-md border border-gray-800 flex items-center gap-3.5 bg-gray-950/30">
                  <div className="p-2.5 bg-emerald-950/50 text-emerald-400 rounded-md border border-emerald-900/50"><ArrowUpRight size={20} /></div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Receitas</p>
                    <p className="text-base font-black text-emerald-400">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="p-4 rounded-md border border-gray-800 flex items-center gap-3.5 bg-gray-950/30">
                  <div className="p-2.5 bg-red-950/50 text-red-400 rounded-md border border-red-900/50"><ArrowDownRight size={20} /></div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Despesas</p>
                    <p className="text-base font-black text-red-400">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="p-4 rounded-md border border-gray-800 flex items-center gap-3.5 bg-gray-950/30">
                  <div className="p-2.5 bg-amber-950/50 text-amber-400 rounded-md border border-amber-900/50"><Wallet size={20} /></div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">A Receber</p>
                    <p className="text-base font-black text-amber-400">R$ {totalPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className={`p-4 rounded-md border flex items-center gap-3.5 text-white ${saldo >= 0 ? 'bg-emerald-950 border-emerald-900' : 'bg-red-950 border-red-900'}`}>
                  <div className="p-2.5 bg-white/10 rounded-md text-white border border-white/10"><DollarSign size={20} /></div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Caixa Líquido</p>
                    <p className="text-base font-black">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NOVO LANÇAMENTO */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <button onClick={() => setFormAberto(!formAberto)} className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-none outline-none cursor-pointer border-b border-gray-800">
              <div className="flex items-center gap-2"><PackagePlus size={18} className="text-emerald-400"/><h3 className="text-xs font-black text-gray-200 uppercase tracking-wider">Novo Lançamento</h3></div>
              {formAberto ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
            </button>
            
            {formAberto && (
              <div className="p-5 md:p-6 space-y-4 bg-gray-900">
                
                {/* ENTRADA DOS PRODUTOS */}
                <div className="flex flex-col md:flex-row gap-2">
                  <input placeholder="Descreva o produto ou serviço..." className="flex-1 p-3 bg-gray-950 border border-gray-800 rounded-md outline-none text-white focus:border-emerald-500 font-medium text-sm transition-all placeholder-gray-600" value={novoItem.item} onChange={e => setNovoItem({...novoItem, item: e.target.value})} />
                  <div className="flex gap-2 w-full md:w-auto">
                    <input type="number" className="w-16 p-3 bg-gray-950 border border-gray-800 rounded-md text-center font-black text-sm text-white" value={novoItem.qtd} onChange={e => setNovoItem({...novoItem, qtd: Number(e.target.value)})} />
                    <button onClick={handleAdicionarItem} className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 rounded-md border border-emerald-800 cursor-pointer flex items-center justify-center transition-all"><Plus size={18} /></button>
                  </div>
                </div>

                {/* ITENS TEMPORÁRIOS */}
                {itensTemporarios.length > 0 && (
                  <div className="p-3 bg-gray-950/50 rounded-md border border-gray-800 flex flex-wrap gap-2">
                    {itensTemporarios.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1 rounded-md">
                        <span className="text-emerald-400 font-black text-xs">{it.qtd}x</span><span className="text-gray-300 text-xs font-medium">{it.item}</span>
                        <button onClick={() => setItensTemporarios(itensTemporarios.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-red-400 border-none bg-transparent cursor-pointer"><X size={12}/></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* CONTROLADORES COMPACTOS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                  
                  <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-3 gap-2">
                    {/* Toggle de Tipo */}
                    <div className="bg-gray-950 p-1 rounded-md flex gap-1 border border-gray-800">
                      <button type="button" onClick={() => setNovaTransacao({ ...novaTransacao, tipo: 'Entrada' })} className={`flex-1 py-2 rounded-md font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${novaTransacao.tipo === 'Entrada' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-500 hover:text-gray-400'}`}>Receita</button>
                      <button type="button" onClick={() => setNovaTransacao({ ...novaTransacao, tipo: 'Saida' })} className={`flex-1 py-2 rounded-md font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${novaTransacao.tipo === 'Saida' ? 'bg-red-600 text-white' : 'bg-transparent text-gray-500 hover:text-gray-400'}`}>Despesa</button>
                    </div>

                    {/* Toggle de Status */}
                    <div className="bg-gray-950 p-1 rounded-md flex gap-1 border border-gray-800">
                      <button type="button" onClick={() => setNovaTransacao({ ...novaTransacao, status: 'Pago' })} className={`flex-1 py-2 rounded-md font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${novaTransacao.status === 'Pago' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-500 hover:text-gray-400'}`}>Pago</button>
                      <button type="button" onClick={() => setNovaTransacao({ ...novaTransacao, status: 'Pendente' })} className={`flex-1 py-2 rounded-md font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${novaTransacao.status === 'Pendente' ? 'bg-amber-500 text-white' : 'bg-transparent text-gray-500 hover:text-gray-400'}`}>Pendente</button>
                    </div>

                    {/* Toggle de Métodos */}
                    <div className="bg-gray-950 p-1 rounded-md flex gap-1 border border-gray-800">
                      <button type="button" onClick={() => setNovaTransacao({ ...novaTransacao, metodoPagamento: 'Pix' })} className={`flex-1 py-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${novaTransacao.metodoPagamento === 'Pix' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-transparent text-gray-500'}`}><QrCode size={14} /></button>
                      <button type="button" onClick={() => setNovaTransacao({ ...novaTransacao, metodoPagamento: 'Dinheiro' })} className={`flex-1 py-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${novaTransacao.metodoPagamento === 'Dinheiro' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-transparent text-gray-500'}`}><Coins size={14} /></button>
                      <button type="button" onClick={() => setNovaTransacao({ ...novaTransacao, metodoPagamento: 'Cartão' })} className={`flex-1 py-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${novaTransacao.metodoPagamento === 'Cartão' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-transparent text-gray-500'}`}><CreditCard size={14} /></button>
                    </div>
                  </div>

                  {/* Inputs de Dados */}
                  <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-2 w-full">
                    <input type="number" placeholder="Valor R$" className="p-2.5 bg-gray-950 border border-gray-800 rounded-md font-black text-emerald-400 outline-none text-sm text-center focus:border-emerald-600 placeholder-gray-700" value={novaTransacao.valor} onChange={e => setNovaTransacao({...novaTransacao, valor: e.target.value})} />
                    <input type="date" className="p-2.5 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-300 outline-none text-sm text-center focus:border-emerald-600" value={novaTransacao.data} onChange={e => setNovaTransacao({...novaTransacao, data: e.target.value})} />
                    
                    {novaTransacao.tipo === 'Entrada' ? (
                      <select className="col-span-2 md:col-span-1 p-2.5 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-400 outline-none text-xs focus:border-emerald-600" value={novaTransacao.clienteId} onChange={e => setNovaTransacao({...novaTransacao, clienteId: e.target.value})}>
                        <option value="">Sem Cliente</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    ) : (
                      <select className="col-span-2 md:col-span-1 p-2.5 bg-gray-950 border border-gray-800 text-red-400 rounded-md font-bold outline-none text-xs focus:border-red-600" value={novaTransacao.fornecedorId} onChange={e => setNovaTransacao({...novaTransacao, fornecedorId: e.target.value})}>
                        <option value="">Sem Fornecedor</option>
                        {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                      </select>
                    )}
                  </div>

                </div>

                <button onClick={handleAddTransacao} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-md font-black uppercase tracking-wider text-xs border border-emerald-700 cursor-pointer flex items-center justify-center gap-2 transition-all">
                  Salvar Transação <Target size={14} />
                </button>

              </div>
            )}
          </div>

          {/* HISTÓRICO FINANCEIRO */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
              <h3 className="font-black text-gray-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <Receipt size={16} className="text-emerald-400"/> Lançamentos do Período
              </h3>
              
              <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end gap-2">
                {/* Filtros em linha */}
                <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-md border border-gray-800">
                   <button onClick={() => setFiltroAtivo('Tudo')} className={`p-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${filtroAtivo === 'Tudo' ? 'bg-gray-800 text-white' : 'bg-transparent text-gray-500 hover:text-gray-400'}`} title="Todos"><Filter size={16} /></button>
                   <button onClick={() => setFiltroAtivo('Entrada')} className={`p-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${filtroAtivo === 'Entrada' ? 'bg-emerald-600 text-white' : 'bg-transparent text-emerald-500 hover:text-emerald-400'}`} title="Receitas"><ArrowUpRight size={16} /></button>
                   <button onClick={() => setFiltroAtivo('Saida')} className={`p-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${filtroAtivo === 'Saida' ? 'bg-red-600 text-white' : 'bg-transparent text-red-500 hover:text-red-400'}`} title="Despesas"><ArrowDownRight size={16} /></button>
                   <button onClick={() => setFiltroAtivo('Pendente')} className={`p-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${filtroAtivo === 'Pendente' ? 'bg-amber-500 text-white' : 'bg-transparent text-amber-500 hover:text-amber-400'}`} title="Pendentes"><Wallet size={16} /></button>
                </div>

                {/* Botão Exportar PDF ao lado no mobile e com texto no desktop */}
                <button onClick={handleExportarMensalPDF} className="flex-shrink-0 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-black p-2 md:py-2 md:px-4 rounded-md transition-all text-xs border border-gray-700 cursor-pointer" title="Exportar PDF">
                  <FileDown size={18} />
                  <span className="hidden md:inline">Exportar PDF</span>
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {transacoesFiltradas.length === 0 ? (
                <div className="bg-gray-900 p-12 rounded-lg border border-dashed border-gray-800 text-center">
                  <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Nenhum lançamento encontrado.</p>
                </div>
              ) : (
                transacoesFiltradas.map(t => {
                  const isEntrada = t.tipo === 'Entrada';
                  const dataObj = formatarDataLocal(t.data);
                  return (
                    <div key={t.id} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-gray-700 transition-all">
                      <button onClick={() => setItemAberto(itemAberto === t.id ? null : t.id)} className="w-full flex items-center justify-between p-4 bg-transparent border-none cursor-pointer outline-none text-left">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center border ${isEntrada ? 'bg-emerald-950/40 border-emerald-900 text-emerald-400' : 'bg-red-950/40 border-red-900 text-red-400'}`}>
                            <span className="text-xs font-black">
                              {dataObj.getDate().toString().padStart(2, '0')}
                            </span>
                          </div>
                          <span className="text-xs font-black text-gray-200 uppercase tracking-tight truncate max-w-[150px] md:max-w-none">
                            {isEntrada ? (t.cliente?.nome || "Venda Avulsa") : (t.fornecedor?.nome || "Gasto Geral")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-black tracking-tight ${t.status === 'Pendente' ? 'text-amber-400' : isEntrada ? 'text-emerald-400' : 'text-red-400'}`}>
                            {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {itemAberto === t.id ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
                        </div>
                      </button>

                      {itemAberto === t.id && (
                        <div className="px-4 pb-4 pt-1 space-y-4 animate-in slide-in-from-top duration-200 bg-gray-950/20 border-t border-gray-800/60">
                          <div className="p-3 bg-gray-950/50 rounded-md border border-gray-800 text-xs text-gray-400 font-medium">{t.descricao}</div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleAlternarStatus(t)} className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border cursor-pointer transition-colors ${t.status === 'Pago' ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400 hover:bg-emerald-900/50' : 'bg-amber-950/50 border-amber-900 text-amber-400 hover:bg-amber-900/50'}`}>
                                <CheckCircle2 size={10}/> {t.status}
                              </button>
                              <button onClick={() => handleAlternarMetodo(t)} className="bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer hover:bg-gray-800 transition-colors text-[9px] font-black uppercase text-gray-400">
                                <Tag size={10} className="text-gray-500"/>{t.metodoPagamento}
                              </button>
                            </div>
                            <div className="flex gap-1">
                              {(t.clienteId || t.fornecedorId) && (
                                <Link to={isEntrada ? `/clientes/${t.clienteId}` : `/fornecedores/${t.fornecedorId}`} className={`p-2 rounded-md border transition-all flex items-center justify-center ${isEntrada ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900 hover:bg-emerald-900/30' : 'text-red-400 bg-red-950/40 border-red-900 hover:bg-red-900/30'}`}>
                                  <User size={14}/>
                                </Link>
                              )}
                              <button onClick={() => setEditando(t)} className={`p-2 rounded-md border border-gray-800 transition-all cursor-pointer flex items-center justify-center ${isEntrada ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900' : 'text-red-400 bg-red-950/40 border-red-900'}`}><Edit3 size={14}/></button>
                              <button onClick={() => handleDelete(t.id)} className="p-2 text-red-400 bg-red-950/40 border border-red-900 rounded-md cursor-pointer hover:bg-red-900/30 transition-all flex items-center justify-center"><Trash2 size={14}/></button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-gray-900 w-full md:max-w-xl h-[95vh] md:h-auto md:max-h-[95vh] rounded-t-lg md:rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-800 animate-in slide-in-from-bottom md:zoom-in duration-250">
            <div className="bg-gray-950 px-6 py-4 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2"><Edit3 size={18} className="text-emerald-400"/><h3 className="text-xs font-black text-gray-200 uppercase tracking-widest">Ajustar Transação</h3></div>
              <button onClick={() => setEditando(null)} className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer p-1"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-6 overflow-y-auto flex-1 pb-20 md:pb-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Itens da Transação</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input placeholder="Item..." className="flex-1 p-3 bg-gray-950 border border-gray-800 rounded-md outline-none text-xs font-medium focus:border-emerald-600 text-white" value={novoItemEdicao.nome} onChange={e => setNovoItemEdicao({...novoItemEdicao, nome: e.target.value})} />
                    <input type="number" className="w-14 p-3 bg-gray-950 border border-gray-800 rounded-md text-center font-black text-xs text-white" value={novoItemEdicao.qtd} onChange={e => setNovoItemEdicao({...novoItemEdicao, qtd: Number(e.target.value)})} />
                    <button onClick={() => { if(novoItemEdicao.nome && editando) { setEditando({...editando, itens: [...editando.itens, {nome: novoItemEdicao.nome, quantidade: novoItemEdicao.qtd}]}); setNovoItemEdicao({nome:'', qtd:1}); }}} className="bg-emerald-700 text-white px-4 rounded-md border border-emerald-800 cursor-pointer"><Plus size={16}/></button>
                  </div>
                  <div className="min-h-[80px] p-3 bg-gray-950 rounded-md border border-gray-800 flex flex-wrap gap-1.5">
                    {editando.itens.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-md">
                        <span className="text-emerald-400 font-black text-[10px]">{it.quantidade}x</span><span className="text-gray-300 text-[10px] font-bold">{it.nome}</span>
                        <button onClick={() => setEditando({...editando, itens: editando.itens.filter((_, i) => i !== idx)})} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"><X size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><label className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase ml-1"><DollarSign size={10}/> Valor R$</label><input type="number" className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md font-black text-emerald-400 outline-none text-sm focus:border-emerald-600" value={editando.valor} onChange={e => setEditando({...editando, valor: Number(e.target.value)})} /></div>
                <div className="space-y-1"><label className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase ml-1"><HandCoins size={10}/> Método</label><select className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-300 outline-none text-xs focus:border-emerald-600" value={editando.metodoPagamento} onChange={e => setEditando({...editando, metodoPagamento: e.target.value})}><option value="Pix">Pix</option><option value="Dinheiro">Dinheiro</option><option value="Cartão">Cartão</option></select></div>
                <div className="space-y-1"><label className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase ml-1"><CalendarDays size={10}/> Data</label><input type="date" className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-300 outline-none text-sm focus:border-emerald-600" value={editando.data.split('T')[0]} onChange={e => setEditando({...editando, data: e.target.value})} /></div>
                <div className="space-y-1"><label className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase ml-1"><CheckCircle2 size={10}/> Status</label><select className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-300 outline-none text-xs focus:border-emerald-600" value={editando.status} onChange={e => setEditando({...editando, status: e.target.value})}><option value="Pago">✅ Pago</option><option value="Pendente">⏳ Pendente</option></select></div>
              </div>
              <button onClick={handleUpdateTransacao} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-md font-black uppercase text-xs tracking-wider border border-emerald-700 cursor-pointer transition-colors active:scale-95 mb-4">Salvar Alterações <Save size={14} className="inline ml-1" /></button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}