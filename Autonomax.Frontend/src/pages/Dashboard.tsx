import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Plus, Trash2, Wallet, CalendarDays, X, Receipt,
  ArrowUpRight, ArrowDownLeft, ChevronLeft, 
  ChevronRight, PackagePlus, Target, CheckCircle2, 
  Clock, ChevronDown, ChevronUp, Edit3, Save, Tag
} from 'lucide-react';
import api from '../services/api';

interface Item { nome: string; quantidade: number; }
interface Cliente { id: number; nome: string; }
interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  tipo: string;
  status: string;
  metodoPagamento: string;
  data: string;
  cliente?: { id: number, nome: string };
  clienteId?: number | null;
  itens: Item[];
}

export function Dashboard() {
  const { mes, ano } = useParams();
  const navigate = useNavigate();
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  // Sincroniza o estado inicial com os parâmetros da URL
  const [mesAtivo, setMesAtivo] = useState(Number(mes) || new Date().getMonth() + 1);
  const [anoAtivo, setAnoAtivo] = useState(Number(ano) || new Date().getFullYear());
  
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Transacao | null>(null);
  const [novoItemEdicao, setNovoItemEdicao] = useState({ nome: '', qtd: 1 });
  const [itensTemporarios, setItensTemporarios] = useState<{ item: string, qtd: number }[]>([]);
  const [novoItem, setNovoItem] = useState({ nome: '', qtd: 1 });
  const [novaTransacao, setNovaTransacao] = useState({
    valor: '', tipo: 'Entrada', status: 'Pendente', metodoPagamento: 'Pix', clienteId: '',
    data: new Date().toISOString().split('T')[0]
  });

  const mesesNome = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // CORREÇÃO DA NAVEGAÇÃO: Atualiza o estado quando a URL muda
  useEffect(() => {
    if (mes) setMesAtivo(Number(mes));
    if (ano) setAnoAtivo(Number(ano));
  }, [mes, ano]);

  useEffect(() => { carregarDados(); }, [negocioId, mesAtivo, anoAtivo]);

  async function carregarDados() {
    if (!negocioId) return;
    try {
      const [resTrans, resCli] = await Promise.all([
        api.get(`/Transacoes/por-periodo/${negocioId}?mes=${mesAtivo}&ano=${anoAtivo}`),
        api.get(`/Clientes/por-negocio/${negocioId}`)
      ]);
      setTransacoes(resTrans.data);
      setClientes(resCli.data || []);
    } catch (err) { console.error(err); }
  }

  const navegarPeriodo = (direcao: number) => {
    let nMes = mesAtivo + direcao;
    let nAno = anoAtivo;
    if (nMes > 12) { nMes = 1; nAno++; } else if (nMes < 1) { nMes = 12; nAno--; }
    // O useEffect acima cuidará de atualizar o mesAtivo/anoAtivo
    navigate(`/dashboard/${nMes}/${nAno}`);
  };

  const handleAdicionarItem = () => {
    if (!novoItem.nome.trim()) return;
    setItensTemporarios([...itensTemporarios, { item: novoItem.nome, qtd: novoItem.qtd }]);
    setNovoItem({ nome: '', qtd: 1 });
  };

  async function handleAddTransacao() {
    if (itensTemporarios.length === 0 || !novaTransacao.valor) return alert("Preencha itens.");
    const payload = {
      descricao: itensTemporarios.map(it => `${it.qtd}x ${it.item}`).join(', '),
      valor: Number(novaTransacao.valor), tipo: novaTransacao.tipo,
      status: novaTransacao.status, metodoPagamento: novaTransacao.metodoPagamento,
      negocioId: Number(negocioId), clienteId: novaTransacao.clienteId ? Number(novaTransacao.clienteId) : null,
      data: new Date(novaTransacao.data).toISOString(),
      itens: itensTemporarios.map(it => ({ nome: it.item, quantidade: it.qtd }))
    };
    try {
      await api.post('/Transacoes', payload);
      setItensTemporarios([]);
      setNovaTransacao({ ...novaTransacao, valor: '', status: 'Pendente', clienteId: '' });
      setFormAberto(false);
      carregarDados();
    } catch (err) { alert("Erro ao salvar."); }
  }

  async function handleUpdateTransacao() {
    if (!editando) return;
    const payload = {
      ...editando,
      descricao: editando.itens.map(it => `${it.quantidade}x ${it.nome}`).join(', '),
      negocioId: Number(negocioId),
      clienteId: editando.clienteId ? Number(editando.clienteId) : null
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
  const saldo = totalEntradas - totalSaidas;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16 pt-8 px-4">
        
        {/* NAVEGAÇÃO */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-200 shadow-xl shadow-emerald-50/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm"><CalendarDays size={24} /></div>
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
              {mesesNome[mesAtivo - 1]} <span className="text-emerald-600">{anoAtivo}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navegarPeriodo(-1)} className="p-3 hover:bg-emerald-50 rounded-2xl transition-all text-gray-400 hover:text-emerald-600 border-none cursor-pointer bg-transparent"><ChevronLeft size={28} /></button>
            <button onClick={() => navegarPeriodo(1)} className="p-3 hover:bg-emerald-50 rounded-2xl transition-all text-gray-400 hover:text-emerald-600 border-none cursor-pointer bg-transparent"><ChevronRight size={28} /></button>
          </div>
        </div>

        {/* CARDS RESUMO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entradas</p><p className="text-2xl font-black text-emerald-600 mt-1">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><ArrowUpRight size={20} /></div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saídas</p><p className="text-2xl font-black text-red-500 mt-1">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
            <div className="bg-red-50 p-3 rounded-2xl text-red-600"><ArrowDownLeft size={20} /></div>
          </div>
          <div className="bg-emerald-950 p-6 rounded-3xl shadow-xl flex items-center justify-between text-white">
            <div><p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Saldo Mensal</p><p className="text-2xl font-black mt-1 text-emerald-50">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
            <Wallet size={32} className="opacity-40" />
          </div>
        </div>

        {/* FORMULÁRIO COLAPSÁVEL */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden transition-all duration-300">
          <button onClick={() => setFormAberto(!formAberto)} className="w-full bg-emerald-50/50 px-8 py-5 flex items-center justify-between hover:bg-emerald-50 transition-colors border-none outline-none cursor-pointer">
            <div className="flex items-center gap-3"><PackagePlus size={20} className="text-emerald-600"/><h3 className="text-xs font-black text-emerald-900 uppercase tracking-[0.2em]">Novo Lançamento</h3></div>
            {formAberto ? <ChevronUp size={20} className="text-emerald-600"/> : <ChevronDown size={20} className="text-emerald-600"/>}
          </button>
          
          {formAberto && (
            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-top duration-300">
              <div className="space-y-6">
                <div className="flex gap-2">
                  <input placeholder="Produto ou Serviço..." className="flex-1 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none" value={novoItem.nome} onChange={e => setNovoItem({...novoItem, nome: e.target.value})} />
                  <input type="number" className="w-20 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-center font-black" value={novoItem.qtd} onChange={e => setNovoItem({...novoItem, qtd: Number(e.target.value)})} />
                  <button onClick={handleAdicionarItem} className="bg-emerald-600 text-white px-5 rounded-2xl active:scale-90 shadow-lg border-none cursor-pointer"><Plus size={24} /></button>
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
                    <option value="Pix">Pix</option><option value="A Vista">À Vista</option><option value="Cartão">Cartão</option>
                  </select>
                  <select className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={novaTransacao.tipo} onChange={e => setNovaTransacao({...novaTransacao, tipo: e.target.value})}>
                    <option value="Entrada">Receita (+)</option><option value="Saida">Despesa (-)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={novaTransacao.data} onChange={e => setNovaTransacao({...novaTransacao, data: e.target.value})} />
                  <select className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" value={novaTransacao.clienteId} onChange={e => setNovaTransacao({...novaTransacao, clienteId: e.target.value})}>
                    <option value="">Venda Avulsa</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <button onClick={handleAddTransacao} className="w-full bg-emerald-950 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-black transition-all border-none cursor-pointer">Salvar <Target size={16} className="inline ml-1" /></button>
              </div>
            </div>
          )}
        </div>

        {/* HISTÓRICO - NOVO LAYOUT DE 2 LINHAS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2"><Receipt size={18} className="text-emerald-600"/> Histórico Financeiro</h3>
            <span className="text-[10px] font-black bg-white border border-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest">{transacoes.length} Registros</span>
          </div>

          <div className="flex flex-col gap-3">
            {transacoes.map(t => (
              <div key={t.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 hover:border-emerald-100 transition-all">
                
{/* LINHA 1: DATA - CLIENTE - VALOR */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <CalendarDays size={12} className="text-gray-400"/>
                      <span className="text-[10px] font-black text-gray-500 uppercase">{new Date(t.data).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {t.cliente ? (
                        <Link to={`/clientes/${t.cliente.id}`} className="text-sm font-black text-emerald-600 hover:text-emerald-800 transition-colors no-underline">
                          {t.cliente.nome}
                        </Link>
                      ) : (
                        <span className="text-sm font-black text-gray-400 italic">Venda Avulsa</span>
                      )}
                    </div>
                  </div>

                  <div className={`text-xl font-black tracking-tight ${t.tipo === 'Entrada' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.tipo === 'Entrada' ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* LINHA 2: BOTÕES - STATUS - TIPO - DESCRIÇÃO */}
                <div className="flex items-center gap-3">
                  {/* BOTÕES DE AÇÃO AGORA AQUI */}
                  <div className="flex gap-1.5 mr-2">
                    <button onClick={() => setEditando({ ...t, clienteId: t.cliente?.id || null })} className="p-2 text-gray-400 hover:text-emerald-600 bg-emerald-50/50 rounded-xl transition-all border-none cursor-pointer"><Edit3 size={16}/></button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-500 bg-red-50/50 rounded-xl transition-all border-none cursor-pointer"><Trash2 size={16}/></button>
                  </div>

                  <button onClick={() => handleAlternarStatus(t)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border-none cursor-pointer transition-all ${t.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {t.status === 'Pago' ? <CheckCircle2 size={12}/> : <Clock size={12}/>} {t.status}
                  </button>

                  <div className="bg-gray-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <Tag size={10} className="text-gray-400"/>
                    <span className="text-[9px] font-black text-gray-500 uppercase">{t.metodoPagamento}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-500 font-bold truncate m-0 bg-gray-50/50 px-3 py-1.5 rounded-xl border border-gray-100 italic">
                      {t.descricao}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in duration-300">
            <div className="bg-gray-50 px-10 py-6 flex justify-between items-center border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Edit3 size={20} className="text-emerald-600"/>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Ajustar Transação</h3>
              </div>
              <button onClick={() => setEditando(null)} className="text-gray-300 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer"><X size={24}/></button>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Itens</label>
                <div className="flex gap-2">
                  <input placeholder="Nome do item..." className="flex-1 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm" value={novoItemEdicao.nome} onChange={e => setNovoItemEdicao({...novoItemEdicao, nome: e.target.value})} />
                  <input type="number" className="w-20 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-center font-black" value={novoItemEdicao.qtd} onChange={e => setNovoItemEdicao({...novoItemEdicao, qtd: Number(e.target.value)})} />
                  <button onClick={() => { if(novoItemEdicao.nome) { setEditando({...editando, itens: [...editando.itens, {nome: novoItemEdicao.nome, quantidade: novoItemEdicao.qtd}]}); setNovoItemEdicao({nome:'', qtd:1}); }}} className="bg-emerald-600 text-white px-5 rounded-2xl border-none cursor-pointer"><Plus size={20}/></button>
                </div>
                <div className="min-h-[80px] p-4 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 flex flex-wrap gap-2">
                  {editando.itens.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white border border-emerald-100 pl-3 pr-1.5 py-1.5 rounded-xl shadow-sm">
                      <span className="text-emerald-600 font-black text-[10px]">{it.quantidade}x</span>
                      <span className="text-gray-600 text-xs font-bold">{it.nome}</span>
                      <button onClick={() => setEditando({...editando, itens: editando.itens.filter((_, i) => i !== idx)})} className="text-gray-200 hover:text-red-500 bg-transparent border-none cursor-pointer"><X size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <input type="number" className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl font-black text-emerald-700 outline-none" value={editando.valor} onChange={e => setEditando({...editando, valor: Number(e.target.value)})} />
                <select className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={editando.clienteId || ''} onChange={e => setEditando({...editando, clienteId: e.target.value ? Number(e.target.value) : null})}>
                  <option value="">Venda Direta</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                <select className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={editando.status} onChange={e => setEditando({...editando, status: e.target.value})}>
                  <option value="Pago">✅ Pago</option><option value="Pendente">⏳ Pendente</option>
                </select>
                <select className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none" value={editando.metodoPagamento} onChange={e => setEditando({...editando, metodoPagamento: e.target.value})}>
                  <option value="Pix">Pix</option><option value="A Vista">À Vista</option><option value="Cartão">Cartão</option>
                </select>
              </div>

              <button onClick={handleUpdateTransacao} className="w-full bg-emerald-950 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-2 border-none cursor-pointer">
                Concluir Alterações <Save size={18}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}