import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  ArrowLeft, Truck, Receipt, Phone, AlertCircle, 
  Loader2, History, Tag, ChevronDown, ChevronUp, 
  CheckCircle2, Clock, CalendarDays, Edit3, Trash2, 
  Save, X, DollarSign, HandCoins, Plus, Wallet, FileText
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

interface Fornecedor {
  id: number;
  nome: string;
  telefone: string;
  categoria: string;
  observacoes: string;
}

interface DadosFornecedor {
  fornecedor: Fornecedor;
  transacoes: Transacao[];
}

export function DetalhesFornecedor() {
  const { id } = useParams<{ id: string }>(); 
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');
  
  const [dados, setDados] = useState<DadosFornecedor | null>(null);
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
      const response = await api.get(`/Transacoes/por-fornecedor/${id}`, {
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
      setErro("Não foi possível sincronizar os dados do parceiro.");
    } finally {
      setCarregando(false);
    }
  }, [id, negocioId]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

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
    const proximoIndex = (metodos.indexOf(t.metodoPagamento) + 1) % metodos.length;
    const novoMetodo = metodos[proximoIndex];
    try {
      await api.put(`/Transacoes/${t.id}`, { ...t, metodoPagamento: novoMetodo, negocioId: Number(negocioId) });
      carregarDados();
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir lançamento de despesa?")) return;
    try { await api.delete(`/Transacoes/${id}`); carregarDados(); } catch (err) { alert("Erro ao excluir"); }
  }

  if (carregando && !dados) return <Layout><div className="flex flex-col items-center justify-center p-20 space-y-4"><Loader2 className="animate-spin text-emerald-600" size={40} /><p className="text-gray-500 animate-pulse font-black uppercase text-[10px] tracking-widest">Sincronizando parceiro...</p></div></Layout>;

  if (erro && !dados) return <Layout><div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-3xl border border-red-100 shadow-xl text-center"><AlertCircle className="mx-auto text-red-500 mb-4" size={48} /><h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Ops!</h2><p className="text-gray-500 mt-2 font-medium">{erro}</p><Link to="/fornecedores" className="inline-block mt-6 bg-emerald-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg">Voltar</Link></div></Layout>;

  const { fornecedor, transacoes } = dados!;
  const totalGasto = transacoes.reduce((acc, t) => acc + t.valor, 0);
  const totalPendente = transacoes.filter(t => t.status === 'Pendente').reduce((acc, t) => acc + t.valor, 0);
  const ultimaTransacao = transacoes[0];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16 pt-8 px-4 font-sans">
        
        <Link to="/fornecedores" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 transition-all w-fit">
          <ArrowLeft size={16} /> Voltar para a lista
        </Link>

        {/* HEADER PERFIL */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-200 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-emerald-600 p-5 rounded-3xl text-white shadow-xl shadow-emerald-100">
              <Truck size={36} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-gray-800 tracking-tight uppercase">{fornecedor.nome}</h2>
              <div className="flex flex-wrap gap-4 mt-3">
                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter">
                  <Phone size={12}/> {fornecedor.telefone || 'Sem telefone'}
                </span>
                <span className="flex items-center gap-1.5 bg-gray-50 text-gray-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter border border-gray-100">
                  <Tag size={12} className="text-emerald-300"/> {fornecedor.categoria || 'Geral'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-auto bg-red-600 p-6 rounded-3xl text-white shadow-2xl shadow-red-900/20">
            <p className="text-[10px] text-red-100 font-black uppercase tracking-widest mb-1">Gasto Total Acumulado</p>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold opacity-60">R$</span>
              <span className="text-4xl font-black">{totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* INDICADORES EM 3 COLUNAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-red-50 text-red-500 rounded-2xl"><Receipt size={28} /></div>
            <div><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Lançamentos</p><p className="text-2xl font-black text-gray-800">{transacoes.length}</p></div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><CalendarDays size={28} /></div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Última Despesa</p>
              <p className="text-2xl font-black text-gray-800">{ultimaTransacao ? formatarDataLocal(ultimaTransacao.data).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) : '--/--'}</p>
              {ultimaTransacao && <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">{calcularTempoDesde(ultimaTransacao.data)}</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Wallet size={28} /></div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Pendentes</p>
              <p className="text-2xl font-black text-amber-700">R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* NOTAS DO PARCEIRO */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-start gap-6">
          <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl flex-shrink-0"><FileText size={28} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Observações Adicionais</p>
            <p className="text-sm font-bold text-gray-600 italic mt-2 leading-relaxed">{fornecedor.observacoes || 'Nenhuma nota registrada para este parceiro.'}</p>
          </div>
        </div>

        {/* HISTÓRICO DE GASTOS */}
        <div className="space-y-4">
          <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2 ml-2">
            <History size={18} className="text-emerald-600"/> Histórico de Gastos
          </h3>
          <div className="flex flex-col gap-3">
            {transacoes.length === 0 ? (
              <div className="bg-white p-20 rounded-[32px] border border-dashed border-gray-200 text-center"><p className="text-gray-300 font-black uppercase text-xs tracking-widest italic">Nenhuma despesa registrada.</p></div>
            ) : (
              transacoes.map(t => {
                const dataObj = formatarDataLocal(t.data);
                return (
                  <div key={t.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden hover:border-red-100 transition-all">
                    <button onClick={() => setItemAberto(itemAberto === t.id ? null : t.id)} className="w-full flex items-center justify-between p-4 md:p-6 bg-transparent border-none cursor-pointer outline-none">
                      <div className="flex items-center gap-4">
                        {/* DATA CIRCULAR NO PADRÃO VERMELHO (SAÍDA) */}
                        <div className="w-12 h-12 rounded-full flex flex-col items-center justify-center border bg-red-50 border-red-100 flex-shrink-0">
                          <span className="text-[11px] font-black text-red-700 leading-none">{dataObj.getDate().toString().padStart(2, '0')}</span>
                          <span className="text-[8px] font-bold text-red-500 uppercase leading-none mt-0.5">{dataObj.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                        </div>
                        <span className="text-sm font-black text-gray-700 truncate max-w-[180px] md:max-w-none text-left">{t.descricao}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-black tracking-tight ${t.status === 'Pendente' ? 'text-amber-600' : 'text-red-600'}`}>
                          - {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {itemAberto === t.id ? <ChevronUp size={20} className="text-gray-300"/> : <ChevronDown size={20} className="text-gray-300"/>}
                      </div>
                    </button>

                    {itemAberto === t.id && (
                      <div className="px-6 pb-6 pt-2 space-y-5 animate-in slide-in-from-top duration-300">
                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 italic text-xs text-gray-600 font-bold">
                          {t.itens && t.itens.length > 0 ? t.itens.map(it => `${it.quantidade}x ${it.nome}`).join(', ') : t.descricao}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleAlternarStatus(t)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border-none cursor-pointer transition-colors ${t.status === 'Pago' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}><CheckCircle2 size={12}/> {t.status}</button>
                            <button onClick={() => handleAlternarMetodo(t)} className="bg-gray-100 px-4 py-2 rounded-xl flex items-center gap-2 border-none cursor-pointer hover:bg-gray-200 transition-colors"><Tag size={10} className="text-gray-400"/><span className="text-[9px] font-black text-gray-500 uppercase">{t.metodoPagamento === 'A Vista' ? 'Dinheiro' : t.metodoPagamento}</span></button>
                          </div>
                          
                          <div className="flex gap-2">
                            <button onClick={() => setEditando(t)} className="p-3 text-red-600 bg-red-50 rounded-2xl border-none cursor-pointer hover:bg-red-100 transition-all flex items-center justify-center"><Edit3 size={18}/></button>
                            <button onClick={() => handleDelete(t.id)} className="p-3 text-red-500 bg-red-50 rounded-2xl border-none cursor-pointer hover:bg-red-100 transition-all flex items-center justify-center"><Trash2 size={18}/></button>
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

      {/* MODAL DE EDIÇÃO INTEGRAL */}
      {editando && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-xl h-[95vh] md:h-auto md:max-h-[95vh] rounded-t-[40px] md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-emerald-100 animate-in slide-in-from-bottom md:zoom-in duration-300">
            <div className="bg-gray-50 px-6 md:px-10 py-6 flex justify-between items-center border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2"><Edit3 size={20} className="text-emerald-600"/><h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Ajustar Despesa</h3></div>
              <button onClick={() => setEditando(null)} className="text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer p-2"><X size={24}/></button>
            </div>
            <div className="p-6 md:p-10 space-y-8 overflow-y-auto flex-1 pb-20 md:pb-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Itens da Despesa</label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input placeholder="Item..." className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold" value={novoItemEdicao.nome} onChange={e => setNovoItemEdicao({...novoItemEdicao, nome: e.target.value})} />
                    <input type="number" className="w-16 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-center font-black" value={novoItemEdicao.qtd} onChange={e => setNovoItemEdicao({...novoItemEdicao, qtd: Number(e.target.value)})} />
                    <button onClick={() => { if(novoItemEdicao.nome) { setEditando({...editando, itens: [...editando.itens, {nome: novoItemEdicao.nome, quantidade: novoItemEdicao.qtd}]}); setNovoItemEdicao({nome:'', qtd:1}); }}} className="bg-emerald-600 text-white px-5 rounded-2xl border-none cursor-pointer"><Plus size={20}/></button>
                  </div>
                  <div className="min-h-[80px] p-4 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-wrap gap-2">
                    {editando.itens.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white border border-emerald-100 pl-3 pr-1.5 py-1.5 rounded-xl shadow-sm">
                        <span className="text-emerald-600 font-black text-[10px]">{it.quantidade}x</span><span className="text-gray-600 text-[11px] font-bold">{it.nome}</span>
                        <button onClick={() => setEditando({...editando, itens: editando.itens.filter((_, i) => i !== idx)})} className="text-gray-200 hover:text-red-500 bg-transparent border-none cursor-pointer"><X size={14}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5"><label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase ml-2"><DollarSign size={10}/> Valor R$</label><input type="number" className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl font-black text-red-700 outline-none" value={editando.valor} onChange={e => setEditando({...editando, valor: Number(e.target.value)})} /></div>
                <div className="space-y-1.5"><label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase ml-2"><HandCoins size={10}/> Método</label><select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={editando.metodoPagamento} onChange={e => setEditando({...editando, metodoPagamento: e.target.value})}><option value="Pix">Pix</option><option value="A Vista">Dinheiro</option><option value="Cartão">Cartão</option></select></div>
                <div className="space-y-1.5"><label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase ml-2"><CalendarDays size={10}/> Data</label><input type="date" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={editando.data.split('T')[0]} onChange={e => setEditando({...editando, data: e.target.value})} /></div>
                <div className="space-y-1.5"><label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase ml-2"><CheckCircle2 size={10}/> Status</label><select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={editando.status} onChange={e => setEditando({...editando, status: e.target.value})}><option value="Pago">✅ Pago</option><option value="Pendente">⏳ Pendente</option></select></div>
              </div>
              <button onClick={handleUpdateTransacao} className="w-full bg-emerald-950 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-2 border-none cursor-pointer active:scale-95 mb-6">Salvar Alterações <Save size={18}/></button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}