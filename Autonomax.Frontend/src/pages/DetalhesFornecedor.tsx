import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  ArrowLeft, Truck, Receipt, Phone, 
  Loader2, History, Tag, 
  Edit3, Trash2, FileDown, Wallet,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { LoadingProgress } from '../components/LoadingProgress';

interface Item { nome: string; quantidade: number; }

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: string;
  status: string;
  metodoPagamento: string;
  itens?: Item[];
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
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [itemAberto, setItemAberto] = useState<number | null>(null);
  const [editando, setEditando] = useState<Transacao | null>(null);

  const formatarDataLocal = (dataISO: string) => {
    const data = new Date(dataISO);
    data.setMinutes(data.getMinutes() + data.getTimezoneOffset());
    return data;
  };

  const carregarDados = useCallback(async () => {
    if (!id || !negocioId || negocioId === "undefined") {
      console.error("Selecione um negócio válido.");
      setCarregando(false);
      return;
    }
    try {
      const response = await api.get(`/Transacoes/por-fornecedor/${id}`, {
        params: { negocioId: Number(negocioId) }
      });
      const transacoesRecebidas = response.data.transacoes || [];
      const ordenadas = {
        fornecedor: response.data.fornecedor,
        transacoes: transacoesRecebidas.sort((a: Transacao, b: Transacao) => 
          new Date(b.data).getTime() - new Date(a.data).getTime()
        )
      };
      setDados(ordenadas);
    } catch (err) {
      console.error("Não foi possível carregar os dados do parceiro.", err);
    } finally {
      setCarregando(false);
    }
  }, [id, negocioId]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleExportPDF = async (fornecedorId: number) => {
    setGerandoPdf(true);
    try {
      const response = await api.get(`/Transacoes/fornecedores/${fornecedorId}/relatorio-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      const nomeArquivo = dados?.fornecedor?.nome ? dados.fornecedor.nome.replace(/\s+/g, '_') : fornecedorId;
      a.download = `Relatorio_${nomeArquivo}.pdf`; 
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) { 
      alert("Erro ao gerar relatório em PDF."); 
    } finally {
      setGerandoPdf(false);
    }
  };

  const abrirEdicao = (t: Transacao) => {
    let itensIniciais = (t.itens || []).map(it => {
      const nomeLimpo = it.nome.replace(/^[\d\s*xX•\-_/]+/, '').trim() || it.nome;
      return {
        nome: nomeLimpo,
        quantidade: Math.max(1, it.quantidade || 1)
      };
    });

    if (itensIniciais.length === 0 && t.descricao) {
      const partes = t.descricao.split(/[,;\n\r+/]/).map(p => p.trim()).filter(Boolean);
      itensIniciais = partes.map(p => {
        const match = p.match(/^\s*(?:(\d+)\s*[xX*•-]\s*|\s*(\d+)\s+)?(.+?)\s*$/);
        const qtd = match ? Math.max(1, Number(match[1] || match[2] || 1)) : 1;
        const nome = match ? match[3].replace(/^[\d\s*xX•\-_/]+/, '').trim() : p;
        return { nome: nome || p, quantidade: qtd };
      });
    }

    setEditando({
      ...t,
      itens: itensIniciais
    });
  };

  async function handleUpdateTransacao() {
    if (!editando) return;
    const dataAjustada = new Date(editando.data.split('T')[0] + 'T12:00:00');
    const itensLimpos = (editando.itens || []).map(it => ({
      ...it,
      nome: it.nome.replace(/^[\d\s*xX•\-_/]+/, '').trim() || it.nome,
      quantidade: Math.max(1, it.quantidade || 1)
    }));

    const payload = {
      ...editando,
      itens: itensLimpos,
      descricao: itensLimpos.length > 0 
        ? itensLimpos.map(it => `${it.quantidade}x ${it.nome}`).join(', ')
        : editando.descricao,
      negocioId: Number(negocioId),
      data: dataAjustada.toISOString()
    };
    try {
      await api.put(`/Transacoes/${editando.id}`, payload);
      setEditando(null);
      carregarDados();
    } catch (err) { 
      alert("Erro ao atualizar transação."); 
    }
  }

  async function handleAlternarStatus(t: Transacao) {
    const nStatus = t.status === 'Pago' ? 'Pendente' : 'Pago';
    try {
      await api.put(`/Transacoes/${t.id}`, { ...t, status: nStatus, negocioId: Number(negocioId) });
      carregarDados();
    } catch (err) { 
      console.error("Erro ao alterar status:", err); 
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este lançamento de despesa?")) return;
    try { 
      await api.delete(`/Transacoes/${id}`); 
      carregarDados(); 
    } catch (err) { 
      alert("Erro ao excluir lançamento."); 
    }
  }

  if (carregando) {
    return (
      <Layout>
        <LoadingProgress message="Carregando histórico do parceiro..." />
      </Layout>
    );
  }

  if (!dados || !dados.fornecedor) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 text-gray-100 flex flex-col items-center justify-center space-y-4">
          <Truck size={48} className="text-gray-600" />
          <p className="text-gray-300 font-black text-lg uppercase">Parceiro não encontrado</p>
          <Link to="/fornecedores" className="text-emerald-400 text-xs font-bold uppercase hover:underline">
            Voltar para a lista de parceiros
          </Link>
        </div>
      </Layout>
    );
  }

  const { fornecedor, transacoes } = dados;
  const totalGasto = transacoes.reduce((acc, t) => acc + t.valor, 0);
  const totalPendente = transacoes.filter(t => t.status === 'Pendente').reduce((acc, t) => acc + t.valor, 0);
  const totalPago = totalGasto - totalPendente;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 text-gray-100 font-sans">
        
        {/* Modal de Edição */}
        {editando && (
          <div className="fixed inset-0 bg-gray-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 w-full max-w-md shadow-2xl">
              <h3 className="text-sm font-black uppercase text-gray-200 mb-4 tracking-wider">Editar Lançamento</h3>
              
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Descrição</label>
                  <input 
                    className="w-full bg-gray-950 border border-gray-800 p-3 rounded-md text-white text-sm outline-none focus:border-emerald-600"
                    value={editando.descricao}
                    onChange={(e) => setEditando({...editando, descricao: e.target.value})}
                    placeholder="Descrição do lançamento"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Valor (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full bg-gray-950 border border-gray-800 p-3 rounded-md text-emerald-400 font-black text-sm outline-none focus:border-emerald-600"
                    value={editando.valor}
                    onChange={(e) => setEditando({...editando, valor: Number(e.target.value)})}
                    placeholder="Valor"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setEditando(null)} 
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-md text-xs font-black uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdateTransacao} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-md text-xs font-black uppercase tracking-wider transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Botão de Voltar */}
          <Link 
            to="/fornecedores" 
            className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 bg-gray-900 px-4 py-2.5 rounded-md border border-gray-800 w-fit hover:text-emerald-400 hover:border-gray-700 transition-all shadow-sm"
          >
            <ArrowLeft size={16} /> Voltar para lista de parceiros
          </Link>

          {/* Banner do Parceiro */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="bg-emerald-950/40 p-4 rounded-xl text-emerald-400 border border-emerald-900/50 flex-shrink-0">
                <Truck size={36} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">{fornecedor.nome}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-gray-950 border border-gray-800 px-3 py-1 rounded-md text-[10px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                    <Phone size={11} className="text-emerald-500"/> {fornecedor.telefone || 'Sem contato'}
                  </span>
                  <span className="bg-gray-950 border border-gray-800 px-3 py-1 rounded-md text-[10px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                    <Tag size={11} className="text-blue-500"/> {fornecedor.categoria || 'Geral'}
                  </span>
                  {fornecedor.observacoes && (
                    <span className="bg-gray-950 border border-gray-800 px-3 py-1 rounded-md text-[10px] font-medium text-gray-400">
                      {fornecedor.observacoes}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-red-950/30 border border-red-900/50 p-5 rounded-xl text-red-400 min-w-[220px] w-full md:w-auto text-left md:text-right">
              <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-red-400/80">Total Acumulado Gasto</p>
              <p className="text-3xl font-black">R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quantidade */}
            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-4 shadow-sm">
              <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-lg text-orange-400">
                <Receipt size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Total de Lançamentos</p>
                <p className="text-xl font-black text-white">{transacoes.length}</p>
              </div>
            </div>

            {/* Total Pago */}
            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-4 shadow-sm">
              <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-lg text-emerald-400">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Total Pago</p>
                <p className="text-xl font-black text-emerald-400">
                  R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Total Pendente */}
            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex items-center gap-4 shadow-sm">
              <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-lg text-amber-400">
                <Wallet size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Despesas Pendentes</p>
                <p className="text-xl font-black text-amber-400">
                  R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Histórico de Gastos / Transações */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-black text-gray-200 text-xs uppercase tracking-wider flex items-center gap-2">
                <History size={16} className="text-emerald-400" /> Histórico de Compras e Gastos
              </h3>
              <button 
                onClick={() => handleExportPDF(fornecedor.id)} 
                disabled={gerandoPdf}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-gray-700 cursor-pointer transition-all disabled:opacity-50"
              >
                {gerandoPdf ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14}/>}
                {gerandoPdf ? "Gerando..." : "Exportar PDF"}
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {transacoes.length === 0 ? (
                <div className="bg-gray-900 p-12 rounded-xl border border-dashed border-gray-800 text-center">
                  <Receipt size={32} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">
                    Nenhuma despesa vinculada a este parceiro até o momento.
                  </p>
                </div>
              ) : (
                transacoes.map(t => {
                  const dataObj = formatarDataLocal(t.data);
                  const dia = dataObj.getDate().toString().padStart(2, '0');
                  const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');
                  const ano = dataObj.getFullYear();

                  return (
                    <div key={t.id} className="bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 overflow-hidden transition-all shadow-sm">
                      <button 
                        onClick={() => setItemAberto(itemAberto === t.id ? null : t.id)} 
                        className="w-full flex items-center justify-between p-4 bg-transparent border-none cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-lg flex flex-col items-center justify-center border bg-red-950/40 border-red-900/60 text-red-400 flex-shrink-0">
                            <span className="text-xs font-black">{dia}</span>
                            <span className="text-[9px] font-bold text-red-500/80">{mes}/{ano.toString().slice(-2)}</span>
                          </div>
                          <div>
                            <span className="text-xs font-black text-gray-200 uppercase block">{t.descricao}</span>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase mt-0.5">
                              <span>{t.metodoPagamento || 'Pix'}</span>
                              <span>•</span>
                              <span className={t.status === 'Pago' ? 'text-emerald-500' : 'text-amber-500'}>
                                {t.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-black text-red-400 whitespace-nowrap">
                          - R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </button>

                      {itemAberto === t.id && (
                        <div className="px-4 pb-4 pt-2 bg-gray-950/50 border-t border-gray-800/80 flex flex-wrap justify-between items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleAlternarStatus(t)} 
                              className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border cursor-pointer transition-colors ${
                                t.status === 'Pago' 
                                  ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400 hover:bg-emerald-900/50' 
                                  : 'bg-amber-950/50 border-amber-900 text-amber-400 hover:bg-amber-900/50'
                              }`}
                            >
                              <CheckCircle2 size={12}/> {t.status}
                            </button>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-900 px-3 py-1.5 rounded-md border border-gray-800 uppercase">
                              {t.metodoPagamento}
                            </span>
                          </div>

                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => abrirEdicao(t)} 
                              className="p-2 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-900/50 rounded-md transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 size={14}/>
                            </button>
                            <button 
                              onClick={() => handleDelete(t.id)} 
                              className="p-2 bg-red-950/40 text-red-400 hover:bg-red-900/50 border border-red-900/50 rounded-md transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 size={14}/>
                            </button>
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
    </Layout>
  );
}