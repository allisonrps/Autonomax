import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Plus, Trash2, CalendarDays, X, Receipt, ChevronLeft, 
  ChevronRight, PackagePlus, Target, CheckCircle2, 
  Clock, ChevronDown, ChevronUp, Edit3, Save, Tag,
  BarChart3, User, DollarSign, HandCoins, Truck
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
  const [resumoAberto, setResumoAberto] = useState(true);
  const [itemAberto, setItemAberto] = useState<number | null>(null);
  
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Transacao | null>(null);
  const [novoItemEdicao, setNovoItemEdicao] = useState({ nome: '', qtd: 1 });

  const [itensTemporarios, setItensTemporarios] = useState<{ item: string, qtd: number }[]>([]);
  const [novoItem, setNovoItem] = useState({ nome: '', qtd: 1 });
  const [novaTransacao, setNovaTransacao] = useState({
    valor: '', tipo: 'Entrada', status: 'Pendente', metodoPagamento: 'Pix', clienteId: '', fornecedorId: '',
    data: new Date().toLocaleDateString('en-CA') 
  });

  const mesesNome = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const formatarDataLocal = (dataISO: string) => {
    const data = new Date(dataISO);
    data.setMinutes(data.getMinutes() + data.getTimezoneOffset());
    return data;
  };

  useEffect(() => {
    if (mes) setMesAtivo(Number(mes));
    if (ano) setAnoAtivo(Number(ano));
  }, [mes, ano]);

  useEffect(() => { carregarDados(); }, [negocioId, mesAtivo, anoAtivo]);

  async function carregarDados() {
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
  }

  const navegarPeriodo = (direcao: number) => {
    let nMes = mesAtivo + direcao;
    let nAno = anoAtivo;
    if (nMes > 12) { nMes = 1; nAno++; } else if (nMes < 1) { nMes = 12; nAno--; }
    navigate(`/dashboard/${nMes}/${nAno}`);
  };

  const handleAdicionarItem = () => {
    if (!novoItem.nome.trim()) return;
    setItensTemporarios([...itensTemporarios, { item: novoItem.nome, qtd: novoItem.qtd }]);
    setNovoItem({ nome: '', qtd: 1 });
  };

  async function handleAddTransacao() {
    if (itensTemporarios.length === 0) return alert("Adicione pelo menos um item na lista (+).");
    if (!novaTransacao.valor) return alert("Informe o valor total do lançamento.");
    
    const dataAjustada = new Date(novaTransacao.data + 'T12:00:00');

    const payload = {
      descricao: itensTemporarios.map(it => `${it.qtd}x ${it.item}`).join(', '),
      valor: Number(novaTransacao.valor), 
      tipo: novaTransacao.tipo,
      status: novaTransacao.status, 
      metodoPagamento: novaTransacao.metodoPagamento,
      negocioId: Number(negocioId), 
      clienteId: novaTransacao.tipo === 'Entrada' && novaTransacao.clienteId ? Number(novaTransacao.clienteId) : null,
      fornecedorId: novaTransacao.tipo === 'Saida' && novaTransacao.fornecedorId ? Number(novaTransacao.fornecedorId) : null,
      data: dataAjustada.toISOString(),
      itens: itensTemporarios.map(it => ({ nome: it.item, quantidade: it.qtd }))
    };

    try {
      await api.post('/Transacoes', payload);
      setItensTemporarios([]);
      setNovaTransacao({ ...novaTransacao, valor: '', status: 'Pendente', clienteId: '', fornecedorId: '' });
      carregarDados();
    } catch (err) { alert("Erro ao salvar."); }
  }

  async function handleUpdateTransacao() {
    if (!editando) return;
    const dataAjustada = new Date(editando.data.split('T')[0] + 'T12:00:00');

    const payload = {
      ...editando,
      descricao: editando.itens.map(it => `${it.quantidade}x ${it.nome}`).join(', '),
      negocioId: Number(negocioId),
      clienteId: editando.tipo === 'Entrada' ? (editando.clienteId ? Number(editando.clienteId) : null) : null,
      fornecedorId: editando.tipo === 'Saida' ? (editando.fornecedorId ? Number(editando.fornecedorId) : null) : null,
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

  async function handleDelete(id: number) {
    if (!confirm("Excluir lançamento?")) return;
    try { await api.delete(`/Transacoes/${id}`); carregarDados(); } catch (err) { alert("Erro ao excluir"); }
  }

  const totalEntradas = transacoes.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoes.filter(t => t.tipo === 'Saida').reduce((acc, t) => acc + t.valor, 0);
  const totalPendentes = transacoes.filter(t => t.status === 'Pendente').reduce((acc, t) => acc + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-16 pt-8 px-4">
        
        {/* NAVEGAÇÃO DE PERÍODO */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-200 shadow-xl shadow-emerald-50/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm"><CalendarDays size={24} /></div>
            <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">
              {mesesNome[mesAtivo - 1]} <span className="text-emerald-600">{anoAtivo}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navegarPeriodo(-1)} className="p-3 hover:bg-emerald-50 rounded-2xl transition-all text-gray-400 border-none bg-transparent cursor-pointer"><ChevronLeft size={28} /></button>
            <button onClick={() => navegarPeriodo(1)} className="p-3 hover:bg-emerald-50 rounded-2xl transition-all text-gray-400 border-none bg-transparent cursor-pointer"><ChevronRight size={28} /></button>
          </div>
        </div>

        {/* RESUMO FINANCEIRO */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <button onClick={() => setResumoAberto(!resumoAberto)} className="w-full bg-emerald-50/30 px-8 py-5 flex items-center justify-between hover:bg-emerald-50 transition-colors border-none outline-none cursor-pointer">
            <div className="flex items-center gap-3"><BarChart3 size={20} className="text-emerald-600"/><h3 className="text-xs font-black text-emerald-900 uppercase tracking-[0.2em]">Resumo Financeiro</h3></div>
            {resumoAberto ? <ChevronUp size={20} className="text-emerald-600"/> : <ChevronDown size={20} className="text-emerald-600"/>}
          </button>
          {resumoAberto && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top duration-300">
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entradas</p>
                <p className="text-xl font-black text-emerald-600 mt-1">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saídas</p>
                <p className="text-xl font-black text-red-500 mt-1">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pendentes</p>
                <p className="text-xl font-black text-amber-700 mt-1">R$ {totalPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className={`p-5 rounded-2xl shadow-inner text-white ${saldo >= 0 ? 'bg-emerald-950' : 'bg-red-900'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Saldo Mensal</p>
                <p className="text-xl font-black mt-1">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          )}
        </div>

        {/* HISTÓRICO FINANCEIRO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Receipt size={18} className="text-emerald-600"/> Histórico Financeiro
            </h3>
            <span className="text-[10px] font-black bg-white border border-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest">
              {transacoes.length}
            </span>
          </div>
          
          <div className="flex flex-col gap-3">
            {transacoes.map(t => (
              <div key={t.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden hover:border-emerald-100 transition-all">
                <button onClick={() => setItemAberto(itemAberto === t.id ? null : t.id)} className="w-full flex items-center justify-between p-4 md:p-6 bg-transparent border-none cursor-pointer outline-none">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${t.tipo === 'Entrada' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                      <span className={`text-xs font-black ${t.tipo === 'Entrada' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatarDataLocal(t.data).getDate().toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-sm font-black text-gray-700 truncate max-w-[150px] md:max-w-none">
                      {t.tipo === 'Entrada' ? (t.cliente?.nome || "Venda Avulsa") : (t.fornecedor?.nome || "Gasto Geral")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-black tracking-tight ${
                      t.status === 'Pendente' ? 'text-amber-600' : t.tipo === 'Entrada' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {itemAberto === t.id ? <ChevronUp size={20} className="text-gray-300"/> : <ChevronDown size={20} className="text-gray-300"/>}
                  </div>
                </button>

                {itemAberto === t.id && (
                  <div className="px-6 pb-6 pt-2 space-y-5 animate-in slide-in-from-top duration-300">
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 italic text-xs text-gray-600 font-bold">{t.descricao}</div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAlternarStatus(t)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border-none cursor-pointer ${t.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {t.status === 'Pago' ? <CheckCircle2 size={12}/> : <Clock size={12}/>} {t.status}
                        </button>
                        <div className="bg-gray-100 px-4 py-2 rounded-xl flex items-center gap-2">
                          <Tag size={10} className="text-gray-400"/><span className="text-[9px] font-black text-gray-500 uppercase">{t.metodoPagamento}</span>
                        </div>
                      </div>
                      
                      {/* ATALHOS DE NAVEGAÇÃO UNIFICADOS [cite: 2026-03-05, 2026-03-06] */}
                      <div className="flex gap-2">
                        {/* Redirecionamento para Cliente [cite: 2026-03-05] */}
                        {t.clienteId && (
                          <Link 
                            to={`/clientes/${t.clienteId}`} 
                            className="p-3 text-emerald-600 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-colors flex items-center justify-center"
                            title="Ver Cliente"
                          >
                            <User size={18}/>
                          </Link>
                        )}

                        {/* Redirecionamento para Parceiro/Fornecedor [cite: 2026-03-06] */}
                        {t.fornecedorId && (
                          <Link 
                            to={`/fornecedores/${t.fornecedorId}`} 
                            className="p-3 text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center"
                            title="Ver Parceiro"
                          >
                            <User size={18}/> {/* Ícone padronizado conforme solicitado [cite: 2026-03-06] */}
                          </Link>
                        )}
                        
                        <button onClick={() => setEditando({ ...t, clienteId: t.clienteId || null, fornecedorId: t.fornecedorId || null })} className="p-3 text-gray-400 bg-gray-50 rounded-2xl border-none cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                          <Edit3 size={18}/>
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-3 text-red-500 bg-red-50 rounded-2xl border-none cursor-pointer hover:bg-red-100 transition-colors">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO RESPONSIVO */}
      {editando && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-xl h-[95vh] md:h-auto md:max-h-[95vh] rounded-t-[40px] md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-emerald-100 animate-in slide-in-from-bottom md:zoom-in duration-300">
            <div className="bg-gray-50 px-6 md:px-10 py-6 flex justify-between items-center border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2"><Edit3 size={20} className="text-emerald-600"/><h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Ajustar Transação</h3></div>
              <button onClick={() => setEditando(null)} className="text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer p-2"><X size={24}/></button>
            </div>
            <div className="p-6 md:p-10 space-y-8 overflow-y-auto flex-1 pb-20 md:pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase ml-2"><DollarSign size={10}/> Valor R$</label>
                  <input type="number" className="w-full p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl font-black text-emerald-700 outline-none" value={editando.valor} onChange={e => setEditando({...editando, valor: Number(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase ml-2"><HandCoins size={10}/> Método</label>
                  <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={editando.metodoPagamento} onChange={e => setEditando({...editando, metodoPagamento: e.target.value})}>
                    <option value="Pix">Pix</option><option value="A Vista">À Vista</option><option value="Cartão">Cartão</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase ml-2"><CalendarDays size={10}/> Data</label>
                  <input type="date" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={editando.data.split('T')[0]} onChange={e => setEditando({...editando, data: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase ml-2"><CheckCircle2 size={10}/> Status</label>
                  <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={editando.status} onChange={e => setEditando({...editando, status: e.target.value})}>
                    <option value="Pago">✅ Pago</option><option value="Pendente">⏳ Pendente</option>
                  </select>
                </div>
              </div>
              <button onClick={handleUpdateTransacao} className="w-full bg-emerald-950 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-2 border-none cursor-pointer active:scale-95 mb-6">
                Salvar Alterações <Save size={18}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
