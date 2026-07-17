import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  ArrowLeft, User, Receipt, MapPin, Phone, FileDown,
  AlertCircle, Loader2, TrendingUp, History,
  ChevronDown, ChevronUp, CheckCircle2, Tag,
  CalendarDays, Edit3, Trash2, Save, X, DollarSign, HandCoins, Plus, Wallet
} from 'lucide-react';
import api from '../services/api';

interface Item { nome: string; quantidade: number; }

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: string;
  status: string;
  metodoPagamento: string;
  itens: Item[];
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
  const [itemAberto, setItemAberto] = useState<number | null>(null);

  const [editando, setEditando] = useState<Transacao | null>(null);
  const [novoItemEdicao, setNovoItemEdicao] = useState({ nome: '', qtd: 1 });

  const formatarDataLocal = (dataISO: string) => {
    const data = new Date(dataISO);
    data.setMinutes(data.getMinutes() + data.getTimezoneOffset());
    return data;
  };

  const calcularTempoDesde = (dataISO: string) => {
    const dataPedido = formatarDataLocal(dataISO);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataPedido.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(hoje.getTime() - dataPedido.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    return `há ${diffDays} dias`;
  };

  const carregarDados = useCallback(async () => {
    if (!id || !negocioId || negocioId === "undefined") {
      setErro("Selecione um negócio no menu superior.");
      setCarregando(false);
      return;
    }
    try {
      const response = await api.get(`/Transacoes/por-cliente/${id}`, {
        params: { negocioId: Number(negocioId) }
      });
      const ordenadas = {
        ...response.data,
        transacoes: response.data.transacoes.sort((a: Transacao, b: Transacao) => 
          new Date(b.data).getTime() - new Date(a.data).getTime()
        )
      };
      setDados(ordenadas);
      setErro(null);
    } catch (err: any) {
      setErro("Não foi possível sincronizar os dados.");
    } finally {
      setCarregando(false);
    }
  }, [id, negocioId]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleExportPDF = async (clienteId: number) => {
    try {
      const response = await api.get(`/Transacoes/clientes/${clienteId}/relatorio-pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_Cliente_${clienteId}.pdf`; 
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      alert("O servidor não conseguiu gerar o PDF.");
    }
  };

  async function handleUpdateTransacao() {
    if (!editando) return;
    const dataAjustada = new Date(editando.data.split('T')[0] + 'T12:00:00');
    const payload = {
      ...editando,
      descricao: editando.itens.map(it => `${it.quantidade}x ${it.nome}`).join(', '),
      negocioId: Number(negocioId),
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
    const proximoIndex = (metodos.indexOf(t.metodoPagamento === 'A Vista' ? 'Dinheiro' : t.metodoPagamento) + 1) % metodos.length;
    const novoMetodo = metodos[proximoIndex];
    try {
      await api.put(`/Transacoes/${t.id}`, { ...t, metodoPagamento: novoMetodo, negocioId: Number(negocioId) });
      carregarDados();
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir lançamento?")) return;
    try { await api.delete(`/Transacoes/${id}`); carregarDados(); } catch (err) { alert("Erro ao excluir"); }
  }

  if (carregando && !dados) return (
    <Layout>
      <div className="flex flex-col items-center justify-center p-20 space-y-4 min-h-screen bg-gray-950 -mt-8">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-gray-500 animate-pulse font-black uppercase text-[10px] tracking-widest">Sincronizando...</p>
      </div>
    </Layout>
  );

  if (erro && !dados) return (
    <Layout>
      <div className="min-h-screen bg-gray-950 -mt-8 pt-20 px-4">
        <div className="max-w-xl mx-auto p-8 bg-gray-900 rounded-xl border border-red-900/50 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-black text-gray-100 uppercase tracking-tight">Ops!</h2>
          <p className="text-gray-400 mt-2 font-medium">{erro}</p>
          <Link to="/clientes" className="inline-flex mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-md font-black uppercase tracking-widest text-xs transition-colors">Voltar</Link>
        </div>
      </div>
    </Layout>
  );

  const { cliente, transacoes } = dados!;
  const totalGasto = transacoes.reduce((acc, t) => acc + t.valor, 0);
  const totalPendente = transacoes.filter(t => t.status === 'Pendente').reduce((acc, t) => acc + t.valor, 0);
  const ultimaTransacao = transacoes[0];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 -mt-8 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <Link to="/clientes" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-emerald-400 transition-all w-fit bg-gray-900 px-4 py-2 rounded-md border border-gray-800">
            <ArrowLeft size={16} /> Voltar para Meus Clientes
          </Link>

          {/* 1. HEADER PERFIL - DARK MODE ENTERPRISE */}
          <div className="bg-gray-900 p-6 md:p-8 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="bg-emerald-950/40 p-4 rounded-lg text-emerald-400 border border-emerald-900/50 flex-shrink-0">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-100 tracking-tight uppercase break-words">
                  {cliente.nome}
                </h2>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 text-gray-300 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    <Phone size={12} className="text-emerald-500"/> {cliente.celular || 'Sem celular'}
                  </span>
                  <span className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 text-gray-300 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    <MapPin size={12} className="text-emerald-500"/> {cliente.endereco || 'Sem endereço'}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto bg-emerald-950/30 border border-emerald-900/50 p-5 rounded-xl text-white flex flex-col justify-center min-w-[240px]">
              <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">Faturamento Total</p>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-emerald-400/60">R$</span>
                <span className="text-3xl font-black text-emerald-400">
                  {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* 2. DASHBOARD CARDS - ESTATÍSTICAS DO CLIENTE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-4 transition-colors hover:border-gray-700">
              <div className="p-3 bg-orange-950/40 text-orange-400 border border-orange-900/50 rounded-lg"><Receipt size={24} /></div>
              <div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Registros</p>
                <p className="text-xl font-black text-gray-100">{transacoes.length}</p>
              </div>
            </div>

            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-4 transition-colors hover:border-gray-700">
              <div className="p-3 bg-blue-950/40 text-blue-400 border border-blue-900/50 rounded-lg"><CalendarDays size={24} /></div>
              <div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Último Pedido</p>
                <div className="flex flex-col">
                  <p className="text-xl font-black text-gray-100 leading-tight">
                    {ultimaTransacao ? formatarDataLocal(ultimaTransacao.data).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) : '--/--'}
                  </p>
                  {ultimaTransacao && (
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tight mt-0.5">
                      {calcularTempoDesde(ultimaTransacao.data)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-4 transition-colors hover:border-gray-700">
              <div className="p-3 bg-amber-950/40 text-amber-400 border border-amber-900/50 rounded-lg"><Wallet size={24} /></div>
              <div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Pendentes</p>
                <p className="text-xl font-black text-amber-400">R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-4 transition-colors hover:border-gray-700">
              <div className="p-3 bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 rounded-lg"><TrendingUp size={24} /></div>
              <div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Ticket Médio</p>
                <p className="text-xl font-black text-gray-100">R$ {transacoes.length > 0 ? (totalGasto / transacoes.length).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '0,00'}</p>
              </div>
            </div>
          </div>

          {/* 3. HISTÓRICO DE ATIVIDADES */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-1">
              <h3 className="font-black text-gray-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <History size={16} className="text-emerald-500"/> Histórico de Atividades
              </h3>
              
              <button 
                onClick={() => handleExportPDF(cliente.id)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-black py-2.5 px-4 rounded-md transition-all text-xs border border-gray-700 cursor-pointer"
              >
                <FileDown size={14} />
                Exportar Relatório PDF
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {transacoes.length === 0 ? (
                <div className="bg-gray-900 p-12 rounded-xl border border-dashed border-gray-800 text-center">
                  <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Nenhum lançamento encontrado para este cliente.</p>
                </div>
              ) : (
                transacoes.map(t => {
                  const dataObj = formatarDataLocal(t.data);
                  return (
                    <div key={t.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all">
                      <button onClick={() => setItemAberto(itemAberto === t.id ? null : t.id)} className="w-full flex items-center justify-between p-4 md:p-5 bg-transparent border-none cursor-pointer outline-none">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-md flex flex-col items-center justify-center border bg-emerald-950/40 border-emerald-900 flex-shrink-0">
                            <span className="text-xs font-black text-emerald-400 leading-none">{dataObj.getDate().toString().padStart(2, '0')}</span>
                            <span className="text-[9px] font-bold text-emerald-500/70 uppercase leading-none mt-0.5">{dataObj.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                          </div>
                          <span className="text-xs font-black text-gray-200 truncate max-w-[180px] md:max-w-none text-left uppercase tracking-tight">{t.descricao}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-black tracking-tight ${t.status === 'Pendente' ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {itemAberto === t.id ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
                        </div>
                      </button>

                      {itemAberto === t.id && (
                        <div className="px-4 md:px-5 pb-5 pt-1 space-y-4 animate-in slide-in-from-top duration-200 bg-gray-950/20 border-t border-gray-800/60">
                          <div className="p-3 bg-gray-950/50 rounded-md border border-gray-800 text-xs text-gray-400 font-medium">
                            {t.itens && t.itens.length > 0 ? t.itens.map(it => `${it.quantidade}x ${it.nome}`).join(', ') : t.descricao}
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleAlternarStatus(t)} className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border cursor-pointer transition-colors ${t.status === 'Pago' ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400 hover:bg-emerald-900/50' : 'bg-amber-950/50 border-amber-900 text-amber-400 hover:bg-amber-900/50'}`}>
                                <CheckCircle2 size={10}/> {t.status}
                              </button>
                              <button onClick={() => handleAlternarMetodo(t)} className="bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer hover:bg-gray-800 transition-colors text-[9px] font-black uppercase text-gray-400">
                                <Tag size={10} className="text-gray-500"/><span className="text-[9px] font-black text-gray-400 uppercase">{t.metodoPagamento === 'A Vista' ? 'Dinheiro' : t.metodoPagamento}</span>
                              </button>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={() => setEditando(t)} className="p-2 rounded-md border border-gray-800 transition-all cursor-pointer flex items-center justify-center text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/40"><Edit3 size={14}/></button>
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

      {/* MODAL DE EDIÇÃO ESCURO E TÉCNICO */}
      {editando && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-gray-900 w-full md:max-w-xl h-[95vh] md:h-auto md:max-h-[95vh] rounded-t-lg md:rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-800 animate-in slide-in-from-bottom md:zoom-in duration-200">
            <div className="bg-gray-950 px-6 py-5 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-400"/>
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-widest">Ajustar Transação</h3>
              </div>
              <button onClick={() => setEditando(null)} className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer p-1 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto flex-1 pb-20 md:pb-6">
              
              {/* ITENS DA TRANSAÇÃO */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Itens Adicionados</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input placeholder="Produto ou Serviço..." className="flex-1 p-3.5 bg-gray-950 border border-gray-800 rounded-md outline-none text-xs font-medium text-white focus:border-emerald-600 placeholder-gray-600" value={novoItemEdicao.nome} onChange={e => setNovoItemEdicao({...novoItemEdicao, nome: e.target.value})} />
                    <input type="number" className="w-16 p-3.5 bg-gray-950 border border-gray-800 rounded-md text-center font-black text-xs text-white focus:border-emerald-600" value={novoItemEdicao.qtd} onChange={e => setNovoItemEdicao({...novoItemEdicao, qtd: Number(e.target.value)})} />
                    <button onClick={() => { if(novoItemEdicao.nome && editando) { setEditando({...editando, itens: [...editando.itens, {nome: novoItemEdicao.nome, quantidade: novoItemEdicao.qtd}]}); setNovoItemEdicao({nome:'', qtd:1}); }}} className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 rounded-md border border-emerald-800 cursor-pointer transition-colors"><Plus size={16}/></button>
                  </div>
                  <div className="min-h-[80px] p-3 bg-gray-950 rounded-md border border-gray-800 flex flex-wrap gap-2">
                    {editando.itens.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-md">
                        <span className="text-emerald-400 font-black text-[10px]">{it.quantidade}x</span><span className="text-gray-300 text-[11px] font-medium">{it.nome}</span>
                        <button onClick={() => setEditando({...editando, itens: editando.itens.filter((_, i) => i !== idx)})} className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer ml-1"><X size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* INPUTS GERAIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase ml-1"><DollarSign size={10}/> Valor R$</label>
                  <input type="number" className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md font-black text-emerald-400 outline-none text-sm focus:border-emerald-600" value={editando.valor} onChange={e => setEditando({...editando, valor: Number(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase ml-1"><HandCoins size={10}/> Método</label>
                  <select className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md font-medium text-gray-300 outline-none text-sm focus:border-emerald-600" value={editando.metodoPagamento} onChange={e => setEditando({...editando, metodoPagamento: e.target.value})}>
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão">Cartão</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase ml-1"><CalendarDays size={10}/> Data</label>
                  <input type="date" className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md font-medium text-gray-300 outline-none text-sm focus:border-emerald-600" value={editando.data.split('T')[0]} onChange={e => setEditando({...editando, data: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase ml-1"><CheckCircle2 size={10}/> Status</label>
                  <select className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md font-medium text-gray-300 outline-none text-sm focus:border-emerald-600" value={editando.status} onChange={e => setEditando({...editando, status: e.target.value})}>
                    <option value="Pago">✅ Pago</option>
                    <option value="Pendente">⏳ Pendente</option>
                  </select>
                </div>
              </div>

              <button onClick={handleUpdateTransacao} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 mt-2 rounded-md font-black uppercase text-xs tracking-wider border border-emerald-700 cursor-pointer transition-colors active:scale-95 flex items-center justify-center gap-2">
                Salvar Alterações <Save size={16} />
              </button>

            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}