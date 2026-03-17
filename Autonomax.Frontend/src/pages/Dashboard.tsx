import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Trash2, CalendarDays, X, Receipt, ChevronLeft, 
  ChevronRight, CheckCircle2, FileDown,
  ChevronDown, ChevronUp, Edit3, Save, Tag,
  BarChart3, User, DollarSign, HandCoins, Plus, PackagePlus, Target, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight
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
  
  const [resumoAberto, setResumoAberto] = useState(true); // Deixei aberto por padrão para facilitar a visão
  const [itemAberto, setItemAberto] = useState<number | null>(null);
  
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
      itens: itensTemporarios.map(it => ({ nome: it.item, quantidade: it.qtd }))
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-16 pt-8 px-4 font-sans text-gray-800">
        
        {/* NAVEGAÇÃO */}
        <div className="flex items-center justify-between bg-white p-6 rounded-[32px] border border-gray-200 shadow-xl shadow-emerald-50/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm"><CalendarDays size={24} /></div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
              {mesesNome[mesAtivo - 1]} <span className="text-emerald-600">{anoAtivo}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navegarPeriodo(-1)} className="p-3 hover:bg-emerald-50 rounded-2xl transition-all text-gray-400 border-none bg-transparent cursor-pointer"><ChevronLeft size={28} /></button>
            <button onClick={() => navegarPeriodo(1)} className="p-3 hover:bg-emerald-50 rounded-2xl transition-all text-gray-400 border-none bg-transparent cursor-pointer"><ChevronRight size={28} /></button>
          </div>
        </div>

        {/* RESUMO COM ÍCONES */}
        <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl overflow-hidden">
          <button onClick={() => setResumoAberto(!resumoAberto)} className="w-full bg-emerald-50/30 px-8 py-5 flex items-center justify-between hover:bg-emerald-50 transition-colors border-none outline-none cursor-pointer">
            <div className="flex items-center gap-3"><BarChart3 size={20} className="text-emerald-600"/><h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Resumo Financeiro</h3></div>
            {resumoAberto ? <ChevronUp size={20} className="text-emerald-600"/> : <ChevronDown size={20} className="text-emerald-600"/>}
          </button>
          {resumoAberto && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top duration-300">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowUpRight size={24} /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entradas</p>
                  <p className="text-xl font-black text-emerald-600">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-500 rounded-xl"><ArrowDownRight size={24} /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saídas</p>
                  <p className="text-xl font-black text-red-500">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Wallet size={24} /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendentes</p>
                  <p className="text-xl font-black text-amber-700">R$ {totalPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className={`p-5 rounded-2xl shadow-inner text-white flex items-center gap-4 ${saldo >= 0 ? 'bg-emerald-950' : 'bg-red-900'}`}>
                <div className="p-3 bg-white/10 rounded-xl text-white"><DollarSign size={24} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Saldo Mensal</p>
                  <p className="text-xl font-black">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NOVO LANÇAMENTO */}
        <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl overflow-hidden transition-all duration-300">
          <button onClick={() => setFormAberto(!formAberto)} className="w-full bg-emerald-50/50 px-8 py-5 flex items-center justify-between hover:bg-emerald-50 transition-colors border-none outline-none cursor-pointer">
            <div className="flex items-center gap-3"><PackagePlus size={20} className="text-emerald-600"/><h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Novo Lançamento</h3></div>
            {formAberto ? <ChevronUp size={20} className="text-emerald-600"/> : <ChevronDown size={20} className="text-emerald-600"/>}
          </button>
          {formAberto && (
            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-top duration-300">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <input placeholder="Produto ou Serviço..." className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-emerald-500 transition-all font-bold" value={novoItem.item} onChange={e => setNovoItem({...novoItem, item: e.target.value})} />
                  <div className="flex gap-2 w-full md:w-auto">
                    <input type="number" className="flex-1 md:w-20 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-center font-black" value={novoItem.qtd} onChange={e => setNovoItem({...novoItem, qtd: Number(e.target.value)})} />
                    <button onClick={handleAdicionarItem} className="flex-1 md:flex-none bg-emerald-600 text-white px-6 rounded-2xl active:scale-95 shadow-lg border-none cursor-pointer flex items-center justify-center transition-all"><Plus size={24} /></button>
                  </div>
                </div>
                <div className="min-h-[100px] p-5 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-wrap gap-2">
                  {itensTemporarios.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white border border-emerald-100 pl-4 pr-2 py-2 rounded-xl shadow-sm">
                      <span className="text-emerald-600 font-black text-xs">{it.qtd}x</span><span className="text-gray-600 text-xs font-bold">{it.item}</span>
                      <button onClick={() => setItensTemporarios(itensTemporarios.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500 border-none bg-transparent cursor-pointer"><X size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Valor R$" className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl font-black text-emerald-700 outline-none" value={novaTransacao.valor} onChange={e => setNovaTransacao({...novaTransacao, valor: e.target.value})} />
                  <select className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={novaTransacao.status} onChange={e => setNovaTransacao({...novaTransacao, status: e.target.value})}>
                    <option value="Pago">✅ Pago</option><option value="Pendente">⏳ Pendente</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={novaTransacao.metodoPagamento} onChange={e => setNovaTransacao({...novaTransacao, metodoPagamento: e.target.value})}>
                    <option value="Pix">Pix</option><option value="Dinheiro">Dinheiro</option><option value="Cartão">Cartão</option>
                  </select>
                  <select className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={novaTransacao.tipo} onChange={e => setNovaTransacao({...novaTransacao, tipo: e.target.value})}>
                    <option value="Entrada">Receita (+)</option><option value="Saida">Despesa (-)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={novaTransacao.data} onChange={e => setNovaTransacao({...novaTransacao, data: e.target.value})} />
                  {novaTransacao.tipo === 'Entrada' ? (
                    <select className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={novaTransacao.clienteId} onChange={e => setNovaTransacao({...novaTransacao, clienteId: e.target.value})}>
                      <option value="">Venda Avulsa</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  ) : (
                    <select className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl font-bold outline-none" value={novaTransacao.fornecedorId} onChange={e => setNovaTransacao({...novaTransacao, fornecedorId: e.target.value})}>
                      <option value="">Gasto Geral</option>
                      {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                  )}
                </div>
                <button onClick={handleAddTransacao} className="w-full bg-emerald-950 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-black transition-all border-none cursor-pointer">Salvar Lançamento <Target size={16} className="inline ml-1" /></button>
              </div>
            </div>
          )}
        </div>

        {/* HISTÓRICO + BOTÃO PDF */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <Receipt size={18} className="text-emerald-600"/> Histórico Financeiro
              </h3>
              <span className="text-[10px] font-black bg-white border border-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest">
                {transacoes.length}
              </span>
            </div>
            
            <button 
              onClick={handleExportarMensalPDF}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-5 rounded-2xl transition-all shadow-lg active:scale-95 text-[10px] uppercase tracking-widest"
            >
              <FileDown size={16} />
              Exportar Fluxo PDF
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {transacoes.map(t => {
              const isEntrada = t.tipo === 'Entrada';
              const dataObj = formatarDataLocal(t.data);
              return (
                <div key={t.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden hover:border-emerald-100 transition-all">
                  <button onClick={() => setItemAberto(itemAberto === t.id ? null : t.id)} className="w-full flex items-center justify-between p-4 md:p-6 bg-transparent border-none cursor-pointer outline-none">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isEntrada ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <span className={`text-xs font-black ${isEntrada ? 'text-emerald-700' : 'text-red-700'}`}>
                          {dataObj.getDate().toString().padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-sm font-black text-gray-700 truncate max-w-[150px] md:max-w-none text-left">
                        {isEntrada ? (t.cliente?.nome || "Venda Avulsa") : (t.fornecedor?.nome || "Gasto Geral")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-black tracking-tight ${t.status === 'Pendente' ? 'text-amber-600' : isEntrada ? 'text-emerald-600' : 'text-red-500'}`}>
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
                          <button onClick={() => handleAlternarStatus(t)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border-none cursor-pointer transition-colors ${t.status === 'Pago' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>
                            <CheckCircle2 size={12}/> {t.status}
                          </button>
                          <button onClick={() => handleAlternarMetodo(t)} className="bg-gray-100 px-4 py-2 rounded-xl flex items-center gap-2 border-none cursor-pointer hover:bg-gray-200 transition-colors">
                            <Tag size={10} className="text-gray-400"/><span className="text-[9px] font-black text-gray-500 uppercase">{t.metodoPagamento}</span>
                          </button>
                        </div>
                        <div className="flex gap-2">
                          {(t.clienteId || t.fornecedorId) && (
                            <Link to={isEntrada ? `/clientes/${t.clienteId}` : `/fornecedores/${t.fornecedorId}`} className={`p-3 rounded-2xl transition-all flex items-center justify-center ${isEntrada ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}>
                              <User size={18}/>
                            </Link>
                          )}
                          <button onClick={() => setEditando(t)} className={`p-3 rounded-2xl transition-all border-none cursor-pointer flex items-center justify-center ${isEntrada ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-red-600 bg-red-50 hover:bg-red-100'}`}><Edit3 size={18}/></button>
                          <button onClick={() => handleDelete(t.id)} className="p-3 text-red-500 bg-red-50 rounded-2xl border-none cursor-pointer hover:bg-red-100 transition-all flex items-center justify-center"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-xl h-[95vh] md:h-auto md:max-h-[95vh] rounded-t-[40px] md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-emerald-100 animate-in slide-in-from-bottom md:zoom-in duration-300">
            <div className="bg-gray-50 px-6 md:px-10 py-6 flex justify-between items-center border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2"><Edit3 size={20} className="text-emerald-600"/><h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Ajustar Transação</h3></div>
              <button onClick={() => setEditando(null)} className="text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer p-2"><X size={24}/></button>
            </div>
            <div className="p-6 md:p-10 space-y-8 overflow-y-auto flex-1 pb-20 md:pb-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Itens da Transação</label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input placeholder="Item..." className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold" value={novoItemEdicao.nome} onChange={e => setNovoItemEdicao({...novoItemEdicao, nome: e.target.value})} />
                    <input type="number" className="w-16 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-center font-black" value={novoItemEdicao.qtd} onChange={e => setNovoItemEdicao({...novoItemEdicao, qtd: Number(e.target.value)})} />
                    <button onClick={() => { if(novoItemEdicao.nome && editando) { setEditando({...editando, itens: [...editando.itens, {nome: novoItemEdicao.nome, quantidade: novoItemEdicao.qtd}]}); setNovoItemEdicao({nome:'', qtd:1}); }}} className="bg-emerald-600 text-white px-5 rounded-2xl border-none cursor-pointer"><Plus size={20}/></button>
                  </div>
                  <div className="min-h-[80px] p-4 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 flex flex-wrap gap-2">
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
                <div className="space-y-1.5"><label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase ml-2"><DollarSign size={10}/> Valor R$</label><input type="number" className="w-full p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl font-black text-emerald-700 outline-none" value={editando.valor} onChange={e => setEditando({...editando, valor: Number(e.target.value)})} /></div>
                <div className="space-y-1.5"><label className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase ml-2"><HandCoins size={10}/> Método</label><select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={editando.metodoPagamento} onChange={e => setEditando({...editando, metodoPagamento: e.target.value})}><option value="Pix">Pix</option><option value="Dinheiro">Dinheiro</option><option value="Cartão">Cartão</option></select></div>
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