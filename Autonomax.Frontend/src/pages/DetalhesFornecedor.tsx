import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  ArrowLeft, Truck, Receipt, Phone, 
  Loader2, History, Tag, 
  Edit3, Trash2, FileDown, Wallet,
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
    return diffDays === 0 ? "Hoje" : diffDays === 1 ? "Ontem" : `há ${diffDays} dias`;
  };

  const carregarDados = useCallback(async () => {
    if (!id || !negocioId || negocioId === "undefined") {
      setErro("Selecione um negócio válido.");
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
    } catch (err) {
      setErro("Não foi possível carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }, [id, negocioId]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleExportPDF = async (fornecedorId: number) => {
    try {
      const response = await api.get(`/Transacoes/fornecedores/${fornecedorId}/relatorio-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_Fornecedor_${fornecedorId}.pdf`; 
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) { alert("Erro ao gerar PDF."); }
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
    const proximoIndex = (metodos.indexOf(t.metodoPagamento) + 1) % metodos.length;
    try {
      await api.put(`/Transacoes/${t.id}`, { ...t, metodoPagamento: metodos[proximoIndex], negocioId: Number(negocioId) });
      carregarDados();
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir lançamento de despesa?")) return;
    try { await api.delete(`/Transacoes/${id}`); carregarDados(); } catch (err) { alert("Erro ao excluir"); }
  }

  if (carregando) return <Layout><div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-500" size={40} /></div></Layout>;

  const { fornecedor, transacoes } = dados!;
  const totalGasto = transacoes.reduce((acc, t) => acc + t.valor, 0);
  const totalPendente = transacoes.filter(t => t.status === 'Pendente').reduce((acc, t) => acc + t.valor, 0);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 text-gray-100">
        <div className="max-w-6xl mx-auto space-y-6">
          <Link to="/fornecedores" className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 bg-gray-900 px-4 py-2 rounded-md border border-gray-800 w-fit hover:text-emerald-400">
            <ArrowLeft size={16} /> Voltar para lista
          </Link>

          {/* Header */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="bg-emerald-950/40 p-4 rounded-lg text-emerald-400 border border-emerald-900/50"><Truck size={32} /></div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">{fornecedor.nome}</h2>
                <div className="flex gap-3 mt-2">
                  <span className="bg-gray-950 border border-gray-800 px-3 py-1 rounded-md text-[10px] font-bold uppercase text-gray-300"><Phone size={10} className="inline mr-1 text-emerald-500"/> {fornecedor.telefone || 'Sem telefone'}</span>
                  <span className="bg-gray-950 border border-gray-800 px-3 py-1 rounded-md text-[10px] font-bold uppercase text-gray-300"><Tag size={10} className="inline mr-1 text-emerald-500"/> {fornecedor.categoria || 'Geral'}</span>
                </div>
              </div>
            </div>
            <div className="bg-red-950/30 border border-red-900/50 p-5 rounded-xl text-red-400 min-w-[200px]">
              <p className="text-[9px] font-black uppercase tracking-widest mb-1">Total Acumulado</p>
              <p className="text-3xl font-black">R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Cards Estatísticos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {[{icon: Receipt, label: 'Lançamentos', val: transacoes.length, color: 'text-red-400'}, {icon: Wallet, label: 'Pendentes', val: `R$ ${totalPendente.toLocaleString('pt-BR')}`, color: 'text-amber-400'}, {icon: History, label: 'Total Gasto', val: `R$ ${totalGasto.toLocaleString('pt-BR')}`, color: 'text-emerald-400'}].map((item, i) => (
                <div key={i} className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-4">
                  <div className={`p-3 bg-gray-950 border border-gray-800 rounded-lg ${item.color}`}><item.icon size={20}/></div>
                  <div><p className="text-[9px] font-bold uppercase text-gray-500">{item.label}</p><p className="text-lg font-black">{item.val}</p></div>
                </div>
             ))}
          </div>

          {/* Histórico */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
               <h3 className="font-black text-gray-300 text-xs uppercase">Histórico de Gastos</h3>
               <button onClick={() => handleExportPDF(fornecedor.id)} className="bg-gray-800 text-gray-200 px-4 py-2 rounded-md text-xs font-black uppercase flex items-center gap-2"><FileDown size={14}/> PDF</button>
            </div>
            <div className="flex flex-col gap-2.5">
              {transacoes.map(t => (
                <div key={t.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <button onClick={() => setItemAberto(itemAberto === t.id ? null : t.id)} className="w-full flex items-center justify-between p-4 bg-transparent border-none cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-md flex flex-col items-center justify-center border bg-red-950/40 border-red-900">
                        <span className="text-xs font-black text-red-400">{formatarDataLocal(t.data).getDate().toString().padStart(2, '0')}</span>
                      </div>
                      <span className="text-xs font-black text-gray-200 uppercase">{t.descricao}</span>
                    </div>
                    <span className="text-sm font-black text-red-400">- {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </button>
                  {itemAberto === t.id && (
                     <div className="px-4 pb-4 pt-1 bg-gray-950/50 border-t border-gray-800 flex justify-between items-center">
                        <div className="flex gap-2 mt-2">
                           <button onClick={() => handleAlternarStatus(t)} className="px-3 py-1 rounded-md text-[9px] font-black uppercase bg-gray-800 border border-gray-700 text-gray-300">{t.status}</button>
                           <button onClick={() => setEditando(t)} className="p-2 bg-emerald-950 text-emerald-400 rounded-md"><Edit3 size={12}/></button>
                           <button onClick={() => handleDelete(t.id)} className="p-2 bg-red-950 text-red-400 rounded-md"><Trash2 size={12}/></button>
                        </div>
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}