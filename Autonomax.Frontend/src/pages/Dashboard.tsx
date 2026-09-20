import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { 
  Calendar, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, 
  CreditCard, QrCode, Banknote, FileText, CheckCircle2, 
  Search, Trash2, X, User, Sparkles, Package, RotateCcw
} from 'lucide-react';
import api from '../services/api';
import { LoadingProgress } from '../components/LoadingProgress';

interface Item {
  nome: string;
  quantidade: number;
}

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  tipo: string;
  status: string;
  metodoPagamento: string;
  data: string;
  cliente?: { id: number; nome: string };
  clienteId?: number | null;
  itens: Item[];
}

interface Cliente {
  id: number;
  nome: string;
}

interface ProdutoServico {
  id: number;
  nome: string;
  preco: number;
  ehServico: boolean;
}

interface ItemTemporario {
  item: string;
  qtd: number;
  precoUnitario: number;
}

export function Dashboard() {
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  // Relógio em tempo real
  const [agora, setAgora] = useState(new Date());

  // Data Selecionada no Dashboard (padrão: hoje em formato YYYY-MM-DD)
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  });

  // Dados
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtosServicos, setProdutosServicos] = useState<ProdutoServico[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Cards Expansíveis (FECHADOS POR PADRÃO conforme solicitado)
  const [resumoAberto, setResumoAberto] = useState(false);
  const [pagamentosAberto, setPagamentosAberto] = useState(false);
  const [feedAberto, setFeedAberto] = useState(false);

  // Filtro no feed de vendas do dia
  const [buscaFeed, setBuscaFeed] = useState('');

  // Modal de Nova Venda por Etapas (Wizard)
  const [modalVendaAberto, setModalVendaAberto] = useState(false);
  const [salvandoVenda, setSalvandoVenda] = useState(false);
  const [etapaModal, setEtapaModal] = useState<1 | 2 | 3>(1);
  const [buscaClienteModal, setBuscaClienteModal] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('Pix');
  const [statusPagamento, setStatusPagamento] = useState('Pago');
  const [dataVenda, setDataVenda] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [valorTotalEditavel, setValorTotalEditavel] = useState('');
  const [valorFoiEditadoManualmente, setValorFoiEditadoManualmente] = useState(false);

  // Itens da nova venda
  const [itensVenda, setItensVenda] = useState<ItemTemporario[]>([]);
  const [itemCatalogoId, setItemCatalogoId] = useState('');
  const [itemNome, setItemNome] = useState('');
  const [itemQtd, setItemQtd] = useState(1);
  const [itemPrecoUnitario, setItemPrecoUnitario] = useState('');

  // Atualização contínua do relógio
  useEffect(() => {
    const timer = setInterval(() => {
      setAgora(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carregar dados gerais
  const carregarDados = useCallback(async () => {
    if (!negocioId) return;
    try {
      setCarregando(true);
      const [resTrans, resCli, resProd] = await Promise.allSettled([
        api.get(`/Transacoes/por-negocio/${negocioId}`),
        api.get(`/Clientes/por-negocio/${negocioId}`),
        api.get(`/ProdutosServicos/por-negocio/${negocioId}`)
      ]);

      if (resTrans.status === 'fulfilled') {
        setTransacoes(resTrans.value.data || []);
      }
      if (resCli.status === 'fulfilled') {
        setClientes(resCli.value.data || []);
      }
      if (resProd.status === 'fulfilled') {
        setProdutosServicos(resProd.value.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setCarregando(false);
    }
  }, [negocioId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Formatação de data local YYYY-MM-DD
  const formatarChaveData = (d: Date) => {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const chaveHoje = useMemo(() => formatarChaveData(agora), [agora]);
  const ehHoje = dataSelecionada === chaveHoje;

  // Chave do dia anterior à data selecionada (para cálculo de comparativo)
  const chaveDiaAnterior = useMemo(() => {
    if (!dataSelecionada) return '';
    const partes = dataSelecionada.split('-');
    if (partes.length !== 3) return '';
    const d = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    d.setDate(d.getDate() - 1);
    return formatarChaveData(d);
  }, [dataSelecionada]);

  const extrairChave = (dataISO: string) => {
    if (!dataISO) return '';
    const d = new Date(dataISO);
    if (!isNaN(d.getTime())) {
      return formatarChaveData(d);
    }
    return dataISO.slice(0, 10);
  };

  // Vendas do dia selecionado e do dia anterior (apenas entradas/vendas)
  const vendasDoDia = useMemo(() => {
    return transacoes
      .filter(t => t.tipo === 'Entrada' && extrairChave(t.data) === dataSelecionada)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transacoes, dataSelecionada]);

  const vendasDiaAnterior = useMemo(() => {
    return transacoes.filter(t => t.tipo === 'Entrada' && extrairChave(t.data) === chaveDiaAnterior);
  }, [transacoes, chaveDiaAnterior]);

  // Totais do Dia Selecionado
  const totalVendasDoDia = useMemo(() => vendasDoDia.reduce((acc, t) => acc + t.valor, 0), [vendasDoDia]);
  const qtdVendasDoDia = vendasDoDia.length;
  const ticketMedioDoDia = qtdVendasDoDia > 0 ? totalVendasDoDia / qtdVendasDoDia : 0;

  // Totais do Dia Anterior e Comparativo
  const totalVendasDiaAnterior = useMemo(() => vendasDiaAnterior.reduce((acc, t) => acc + t.valor, 0), [vendasDiaAnterior]);
  const comparativoVendas = useMemo(() => {
    if (totalVendasDiaAnterior === 0) {
      if (totalVendasDoDia > 0) return { tipo: 'novo', texto: ehHoje ? 'Primeiras vendas vs ontem' : 'Sem vendas no dia anterior' };
      return { tipo: 'neutro', texto: ehHoje ? 'Sem vendas ontem' : 'Sem vendas no dia anterior' };
    }
    const diff = totalVendasDoDia - totalVendasDiaAnterior;
    const perc = (diff / totalVendasDiaAnterior) * 100;
    const rotuloComparativo = ehHoje ? 'ontem' : 'dia anterior';
    return {
      tipo: diff >= 0 ? 'positivo' : 'negativo',
      diff,
      perc: Math.abs(perc).toFixed(1),
      texto: `${diff >= 0 ? '+' : '-'}${Math.abs(perc).toFixed(0)}% vs ${rotuloComparativo}`
    };
  }, [totalVendasDoDia, totalVendasDiaAnterior, ehHoje]);

  // Breakdown por Formas de Pagamento do Dia Selecionado
  const pagamentosBreakdown = useMemo(() => {
    const map: Record<string, { total: number; qtd: number }> = {
      'Pix': { total: 0, qtd: 0 },
      'Cartão de Crédito': { total: 0, qtd: 0 },
      'Cartão de Débito': { total: 0, qtd: 0 },
      'Dinheiro': { total: 0, qtd: 0 },
      'Boleto': { total: 0, qtd: 0 },
    };

    vendasDoDia.forEach(v => {
      const metodo = v.metodoPagamento || 'Outro';
      if (!map[metodo]) {
        map[metodo] = { total: 0, qtd: 0 };
      }
      map[metodo].total += v.valor;
      map[metodo].qtd += 1;
    });

    return Object.entries(map)
      .filter(([_, dados]) => dados.qtd > 0 || dados.total > 0)
      .map(([nome, dados]) => ({
        nome,
        total: dados.total,
        qtd: dados.qtd,
        porcentagem: totalVendasDoDia > 0 ? (dados.total / totalVendasDoDia) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [vendasDoDia, totalVendasDoDia]);

  // Feed Filtrado
  const vendasFeedFiltradas = useMemo(() => {
    if (!buscaFeed.trim()) return vendasDoDia;
    const termo = buscaFeed.toLowerCase();
    return vendasDoDia.filter(v => {
      const cli = v.cliente?.nome?.toLowerCase() || '';
      const desc = v.descricao?.toLowerCase() || '';
      const met = v.metodoPagamento?.toLowerCase() || '';
      return cli.includes(termo) || desc.includes(termo) || met.includes(termo);
    });
  }, [vendasDoDia, buscaFeed]);

  // Manipulação de Itens no Modal de Nova Venda
  const handleSelecionarCatalogo = (idStr: string) => {
    setItemCatalogoId(idStr);
    if (!idStr) return;
    const prod = produtosServicos.find(p => p.id === Number(idStr));
    if (prod) {
      setItemNome(prod.nome);
      setItemPrecoUnitario(String(prod.preco));
      if (itemQtd <= 0) setItemQtd(1);
    }
  };

  const handleAdicionarItemVenda = () => {
    if (!itemNome.trim()) return alert('Informe o nome do produto ou serviço.');
    const preco = parseFloat(itemPrecoUnitario.replace(',', '.')) || 0;
    if (preco < 0) return alert('O preço não pode ser negativo.');
    const qtd = Math.max(1, Number(itemQtd) || 1);

    setItensVenda(prev => [
      ...prev,
      {
        item: itemNome.trim(),
        qtd,
        precoUnitario: preco
      }
    ]);

    setItemNome('');
    setItemPrecoUnitario('');
    setItemQtd(1);
    setItemCatalogoId('');
  };

  const handleRemoverItemVenda = (index: number) => {
    setItensVenda(prev => prev.filter((_, i) => i !== index));
  };

  const valorTotalCalculado = useMemo(() => {
    return itensVenda.reduce((acc, it) => acc + (it.qtd * it.precoUnitario), 0);
  }, [itensVenda]);

  // Sincroniza o valor total editável com o valor calculado, a menos que o usuário tenha digitado um valor manual
  useEffect(() => {
    if (!valorFoiEditadoManualmente) {
      setValorTotalEditavel(valorTotalCalculado > 0 ? valorTotalCalculado.toFixed(2) : '');
    }
  }, [valorTotalCalculado, valorFoiEditadoManualmente]);

  const abrirModalVenda = () => {
    setEtapaModal(1);
    setItensVenda([]);
    setClienteId('');
    setBuscaClienteModal('');
    setMetodoPagamento('Pix');
    setStatusPagamento('Pago');
    setDataVenda(new Date().toLocaleDateString('en-CA'));
    setValorTotalEditavel('');
    setValorFoiEditadoManualmente(false);
    setModalVendaAberto(true);
  };

  // Salvar Venda (captura horário real HH:mm:ss)
  const handleFinalizarVenda = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (itensVenda.length === 0) {
      return alert('Adicione pelo menos um produto ou serviço à venda.');
    }
    if (!negocioId) return;

    try {
      setSalvandoVenda(true);
      const agora = new Date();
      const horaStr = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}:${String(agora.getSeconds()).padStart(2, '0')}`;
      const dataFormatada = new Date(`${dataVenda}T${horaStr}`);
      const itensFormatados = itensVenda.map(it => ({
        nome: it.item,
        quantidade: it.qtd
      }));

      const valorFinal = Number(valorTotalEditavel) > 0 ? Number(valorTotalEditavel) : valorTotalCalculado;

      const payload = {
        descricao: itensFormatados.map(it => `${it.quantidade}x ${it.nome}`).join(', '),
        valor: valorFinal,
        tipo: 'Entrada',
        status: statusPagamento,
        metodoPagamento,
        negocioId: Number(negocioId),
        clienteId: clienteId ? Number(clienteId) : null,
        fornecedorId: null,
        data: dataFormatada.toISOString(),
        itens: itensFormatados
      };

      await api.post('/Transacoes', payload);
      
      // Limpeza
      setItensVenda([]);
      setClienteId('');
      setBuscaClienteModal('');
      setMetodoPagamento('Pix');
      setStatusPagamento('Pago');
      setDataVenda(new Date().toLocaleDateString('en-CA'));
      setValorTotalEditavel('');
      setValorFoiEditadoManualmente(false);
      setEtapaModal(1);
      setModalVendaAberto(false);

      // Recarrega
      carregarDados();
    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
      alert('Erro ao registrar a venda. Tente novamente.');
    } finally {
      setSalvandoVenda(false);
    }
  };

  const handleExcluirTransacao = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta venda?')) return;
    try {
      await api.delete(`/Transacoes/${id}`);
      carregarDados();
    } catch (err) {
      alert('Erro ao excluir venda.');
    }
  };

  // Funções Auxiliares de Visual
  const formatarHora = (dataISO: string) => {
    const d = new Date(dataISO);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return '--:--';
  };

  const formatarDataResumida = (chaveString: string) => {
    if (!chaveString) return '';
    const partes = chaveString.split('-');
    if (partes.length !== 3) return chaveString;
    const d = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    
    // Dia da semana abreviado ou formatado: "Quinta"
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diaSemana = diasSemana[d.getDay()];

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const aa = String(d.getFullYear()).slice(-2);

    return `${diaSemana}, ${dd}/${mm}/${aa}`;
  };

  const getIconePagamento = (metodo: string) => {
    const m = metodo?.toLowerCase() || '';
    if (m.includes('pix')) return <QrCode size={15} className="text-emerald-400" />;
    if (m.includes('cart') || m.includes('crédito') || m.includes('débito')) return <CreditCard size={15} className="text-emerald-400" />;
    if (m.includes('dinheiro')) return <Banknote size={15} className="text-emerald-400" />;
    if (m.includes('boleto')) return <FileText size={15} className="text-emerald-400" />;
    return <DollarSign size={15} className="text-emerald-400" />;
  };

  if (carregando && transacoes.length === 0) {
    return (
      <Layout>
        <LoadingProgress message="Iniciando painel operacional do dia..." />
      </Layout>
    );
  }

  const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-4 sm:pt-6 pb-20 px-3 sm:px-6 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5">

          {/* ============================================================ */}
          {/* 1. HEADER OPERACIONAL: DATA, SELETOR, RELÓGIO E NOVA VENDA   */}
          {/* ============================================================ */}
          <div className="bg-gray-900/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-gray-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Lado Esquerdo: Data e Relógio */}
            <div className="flex-1">
              {/* No desktop fica tudo na mesma linha: "Quinta, DD/MM/AA - HH:MM:SS" */}
              {/* No mobile fica a data e abaixo o horário centralizado */}
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2.5">
                <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                  {/* Botão de Ícone de Calendário clicável (apenas o ícone altera a data) */}
                  <label
                    className="relative p-2 sm:p-2.5 bg-gray-950 hover:bg-emerald-950/60 text-emerald-400 hover:text-emerald-300 rounded-xl border border-gray-800 hover:border-emerald-500/50 transition-all cursor-pointer flex items-center justify-center group flex-shrink-0 shadow-sm"
                    title="Clique para alterar a data"
                  >
                    <Calendar size={26} className="group-hover:scale-110 transition-transform" />
                    <input
                      type="date"
                      value={dataSelecionada}
                      onChange={e => setDataSelecionada(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                  </label>

                  {/* Texto da Data (somente leitura) */}
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">
                    {formatarDataResumida(dataSelecionada)}
                  </h1>

                  <span className="hidden md:inline text-gray-500 font-light text-lg sm:text-2xl lg:text-3xl">-</span>
                  <span className="hidden md:inline text-lg sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-emerald-400">
                    {horaFormatada}
                  </span>

                  {!ehHoje && (
                    <button
                      type="button"
                      onClick={() => setDataSelecionada(chaveHoje)}
                      className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-gray-950 hover:bg-gray-800 border border-gray-800 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ml-1"
                      title="Voltar para a data de hoje"
                    >
                      <RotateCcw size={13} />
                      <span>Hoje</span>
                    </button>
                  )}
                </div>

                {/* Relógio exclusivo para mobile, centralizado na sua linha */}
                <div className="flex md:hidden items-center justify-center pt-1">
                  <span className="text-xl font-black uppercase tracking-tight text-emerald-400">
                    {horaFormatada}
                  </span>
                </div>
              </div>
            </div>

            {/* Lado Direito: Botão Nova Venda */}
            <div className="flex items-center justify-stretch md:justify-end">
              <button
                type="button"
                onClick={abrirModalVenda}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer border-none"
              >
                <Plus size={18} strokeWidth={3} />
                <span>Nova Venda</span>
              </button>
            </div>

          </div>

          {/* ============================================================ */}
          {/* 2. CARD EXPANSÍVEL 1: RESUMO FINANCEIRO (FECHADO POR PADRÃO) */}
          {/* ============================================================ */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-md overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setResumoAberto(!resumoAberto)}
              className="w-full px-4 sm:px-5 py-4 flex items-center justify-between hover:bg-gray-800/40 transition-colors border-none outline-none cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 rounded-lg">
                  <DollarSign size={18} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-200">
                  Resumo Financeiro
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-emerald-400 hidden sm:inline">
                  R$ {totalVendasDoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <div className="p-1.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-400">
                  {resumoAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </button>

            {resumoAberto && (
              <div className="p-4 sm:p-5 border-t border-gray-800/80 bg-gray-900/50 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* 1. Faturamento */}
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      Faturamento {ehHoje ? 'Hoje' : 'do Dia'}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                      R$ {totalVendasDoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-900 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-gray-500">
                      {ehHoje ? 'Ontem' : 'Dia ant.'}: R$ {totalVendasDiaAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {comparativoVendas.tipo === 'positivo' && (
                      <span className="text-emerald-400 flex items-center gap-0.5 font-black">
                        <TrendingUp size={12} /> {comparativoVendas.texto}
                      </span>
                    )}
                    {comparativoVendas.tipo === 'negativo' && (
                      <span className="text-amber-400 flex items-center gap-0.5 font-black">
                        <TrendingDown size={12} /> {comparativoVendas.texto}
                      </span>
                    )}
                    {(comparativoVendas.tipo === 'neutro' || comparativoVendas.tipo === 'novo') && (
                      <span className="text-gray-500">{comparativoVendas.texto}</span>
                    )}
                  </div>
                </div>

                {/* 2. Vendas Concluídas */}
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      Vendas Concluídas
                    </span>
                    <ShoppingBag size={14} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {qtdVendasDoDia} <span className="text-xs text-gray-500 font-bold">{qtdVendasDoDia === 1 ? 'pedido' : 'pedidos'}</span>
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-900 flex items-center justify-between text-[10px] font-bold text-gray-500">
                    <span>Status</span>
                    <span className="text-emerald-400 font-black">Finalizadas</span>
                  </div>
                </div>

                {/* 3. Ticket Médio */}
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      Ticket Médio
                    </span>
                    <DollarSign size={14} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                      R$ {ticketMedioDoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-900 flex items-center justify-between text-[10px] font-bold text-gray-500">
                    <span>Faturamento ÷ Pedidos</span>
                    <span className="text-emerald-400 font-black">{ehHoje ? 'Hoje' : 'No dia'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 3. CARD EXPANSÍVEL 2: FORMAS DE PAGAMENTO                    */}
          {/* ============================================================ */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-md overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setPagamentosAberto(!pagamentosAberto)}
              className="w-full px-4 sm:px-5 py-4 flex items-center justify-between hover:bg-gray-800/40 transition-colors border-none outline-none cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 rounded-lg">
                  <CreditCard size={18} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-200">
                  Formas de pagamento
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-gray-400 hidden sm:inline">
                  {pagamentosBreakdown.length} {pagamentosBreakdown.length === 1 ? 'modalidade' : 'modalidades'}
                </span>
                <div className="p-1.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-400">
                  {pagamentosAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </button>

            {pagamentosAberto && (
              <div className="p-4 sm:p-5 border-t border-gray-800/80 bg-gray-900/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {pagamentosBreakdown.length === 0 ? (
                  <div className="py-6 text-center text-gray-500 text-xs font-semibold">
                    Nenhuma venda registrada para calcular a distribuição de pagamentos neste dia.
                  </div>
                ) : (
                  <>
                    {/* Barra de Distribuição Visual */}
                    <div className="h-3 w-full bg-gray-950 rounded-full overflow-hidden flex border border-gray-800">
                      {pagamentosBreakdown.map((item, idx) => {
                        const cores = ['bg-emerald-500', 'bg-emerald-400', 'bg-emerald-600', 'bg-emerald-700', 'bg-emerald-800'];
                        const cor = cores[idx % cores.length];
                        return (
                          <div
                            key={item.nome}
                            style={{ width: `${item.porcentagem}%` }}
                            className={`${cor} h-full transition-all duration-500`}
                            title={`${item.nome}: ${item.porcentagem.toFixed(1)}%`}
                          />
                        );
                      })}
                    </div>

                    {/* Grade com os Métodos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                      {pagamentosBreakdown.map((item) => {
                        return (
                          <div
                            key={item.nome}
                            className="bg-gray-950 p-3.5 rounded-xl border border-emerald-900/40 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-950/50 rounded-lg border border-emerald-900/50">
                                {getIconePagamento(item.nome)}
                              </div>
                              <div>
                                <p className="text-xs font-black text-gray-200">{item.nome}</p>
                                <p className="text-[10px] font-bold text-gray-500">{item.qtd} {item.qtd === 1 ? 'venda' : 'vendas'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-white">
                                R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <span className="text-[10px] font-extrabold text-emerald-400">
                                {item.porcentagem.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 4. CARD EXPANSÍVEL 3: FEED DE VENDAS                         */}
          {/* ============================================================ */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-md overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setFeedAberto(!feedAberto)}
              className="w-full px-4 sm:px-5 py-4 flex items-center justify-between hover:bg-gray-800/40 transition-colors border-none outline-none cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 rounded-lg">
                  <ShoppingBag size={18} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-200">
                  Feed de vendas
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-900/60 rounded-md text-[10px] font-black text-emerald-400 uppercase">
                  {vendasDoDia.length} {vendasDoDia.length === 1 ? 'Venda' : 'Vendas'}
                </span>
                <div className="p-1.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-400">
                  {feedAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </button>

            {feedAberto && (
              <div className="p-4 sm:p-5 border-t border-gray-800/80 bg-gray-900/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Barra de Busca nas Vendas */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Pesquisar por cliente, produto ou forma de pagamento..."
                      value={buscaFeed}
                      onChange={e => setBuscaFeed(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
                    />
                    {buscaFeed && (
                      <button
                        onClick={() => setBuscaFeed('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white bg-transparent border-none cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-gray-500 self-end sm:self-center">
                    Mostrando {vendasFeedFiltradas.length} de {vendasDoDia.length} registros
                  </span>
                </div>

                {/* Lista do Feed */}
                {vendasFeedFiltradas.length === 0 ? (
                  <div className="bg-gray-950 p-8 sm:p-10 rounded-xl border border-dashed border-gray-800 text-center space-y-3">
                    <Sparkles size={32} className="mx-auto text-emerald-400 opacity-60" />
                    <p className="text-xs font-black uppercase tracking-wider text-gray-300">
                      {buscaFeed ? 'Nenhuma venda corresponde aos termos da pesquisa.' : 'Nenhuma venda registrada para este dia.'}
                    </p>
                    <p className="text-[11px] text-gray-500 max-w-sm mx-auto font-medium">
                      Clique no botão <strong>Nova Venda</strong> para registrar um pedido e alimentar o feed em tempo real.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {vendasFeedFiltradas.map(venda => (
                      <div
                        key={venda.id}
                        className="bg-gray-950 p-3.5 sm:p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                      >
                        {/* Lado Esquerdo: Hora + Cliente + Itens */}
                        <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                          {/* Badge de Horário */}
                          <div className="bg-gray-900 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-gray-800 text-[11px] font-bold text-gray-400 flex-shrink-0">
                            {formatarHora(venda.data)}
                          </div>

                          {/* Avatar */}
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 flex items-center justify-center font-black text-xs flex-shrink-0">
                            {venda.cliente?.nome ? venda.cliente.nome.charAt(0).toUpperCase() : <User size={14} />}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black uppercase text-gray-200 truncate">
                              {venda.cliente?.nome || 'Consumidor Avulso'}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5" title={venda.descricao}>
                              {venda.descricao || 'Venda sem itens discriminados'}
                            </p>
                          </div>
                        </div>

                        {/* Lado Direito: Método de Pagamento + Valor + Ações */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto border-t sm:border-t-0 border-gray-900 pt-2 sm:pt-0">
                          {/* Tag Forma de Pagamento */}
                          <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded-md border border-gray-800 text-[10px] font-black uppercase text-gray-300">
                            {getIconePagamento(venda.metodoPagamento)}
                            <span className="truncate max-w-[80px] sm:max-w-none">{venda.metodoPagamento}</span>
                          </div>

                          {/* Status Pago */}
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            venda.status === 'Pago' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' : 'bg-amber-950/60 text-amber-400 border border-amber-900/50'
                          }`}>
                            {venda.status}
                          </span>

                          {/* Valor */}
                          <span className="text-xs sm:text-sm font-black text-emerald-400 min-w-[80px] sm:min-w-[90px] text-right">
                            R$ {venda.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>

                          {/* Excluir */}
                          <button
                            type="button"
                            onClick={() => handleExcluirTransacao(venda.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors bg-transparent border-none cursor-pointer"
                            title="Excluir venda"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. MODAL DE REGISTRAR NOVA VENDA POR ETAPAS (WIZARD)        */}
      {/* ============================================================ */}
      {modalVendaAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gray-900 w-full max-w-xl rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Header Modal com Stepper */}
            <div className="p-4 sm:p-5 border-b border-gray-800 bg-gray-900/90 space-y-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 rounded-xl">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                      Registrar Nova Venda
                    </h3>
                    <p className="text-[10px] font-bold text-gray-500">
                      Etapa {etapaModal} de 3 — {etapaModal === 1 ? 'Seleção do Cliente' : etapaModal === 2 ? 'Inclusão de Itens' : 'Forma de Pagamento'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalVendaAberto(false)}
                  className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors bg-transparent border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Stepper progress indicator */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEtapaModal(1)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border-none cursor-pointer ${
                    etapaModal === 1
                      ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20'
                      : etapaModal > 1
                      ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-900/60'
                      : 'bg-gray-950 text-gray-500 border border-gray-800'
                  }`}
                >
                  <span>1. Cliente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEtapaModal(2)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border-none cursor-pointer ${
                    etapaModal === 2
                      ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20'
                      : etapaModal > 2
                      ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-900/60'
                      : 'bg-gray-950 text-gray-500 border border-gray-800'
                  }`}
                >
                  <span>2. Itens ({itensVenda.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => { if (itensVenda.length > 0) setEtapaModal(3); }}
                  disabled={itensVenda.length === 0}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    etapaModal === 3
                      ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20'
                      : 'bg-gray-950 text-gray-500 border border-gray-800'
                  }`}
                >
                  <span>3. Pagamento</span>
                </button>
              </div>
            </div>

            {/* CONTEÚDO DAS ETAPAS */}
            {etapaModal === 1 && (
              <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
                    <User size={16} className="text-emerald-400" /> Quem é o cliente desta venda?
                  </h4>
                  <p className="text-xs text-gray-400">
                    Selecione um cliente cadastrado ou prossiga com Venda Avulsa
                  </p>
                </div>

                {/* Opção Venda Avulsa / Consumidor Não Identificado */}
                <div
                  onClick={() => setClienteId('')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    clienteId === ''
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                      : 'bg-gray-950 border-gray-800 hover:border-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${clienteId === '' ? 'bg-emerald-500 text-gray-950' : 'bg-gray-900 text-gray-400'}`}>
                      <User size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wide block">
                        Venda Avulsa / Consumidor Não Identificado
                      </span>
                      <span className="text-[10px] text-gray-400">Sem vínculo com cadastro de cliente</span>
                    </div>
                  </div>
                  {clienteId === '' && <CheckCircle2 size={18} className="text-emerald-400" />}
                </div>

                {/* Lista de Clientes com busca */}
                {clientes.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-3 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={buscaClienteModal}
                        onChange={e => setBuscaClienteModal(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-white placeholder-gray-600 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                      {clientes
                        .filter(c => c.nome.toLowerCase().includes(buscaClienteModal.toLowerCase()))
                        .map(c => (
                          <div
                            key={c.id}
                            onClick={() => setClienteId(String(c.id))}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                              clienteId === String(c.id)
                                ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 shadow-sm'
                                : 'bg-gray-950 border-gray-800 hover:border-gray-700 text-gray-300'
                            }`}
                          >
                            <span className="truncate">{c.nome}</span>
                            {clienteId === String(c.id) && <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Footer Etapa 1 */}
                <div className="pt-4 border-t border-gray-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setEtapaModal(2)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer border-none flex items-center gap-2"
                  >
                    <span>Avançar para Itens</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {etapaModal === 2 && (
              <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
                    <Package size={16} className="text-emerald-400" /> Adicionar Itens ao Pedido
                  </h4>
                  <p className="text-xs text-gray-400">
                    Selecione itens do catálogo ou digite produtos/serviços customizados
                  </p>
                </div>

                {/* Form Adicionar Item */}
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-3">
                  {produtosServicos.length > 0 && (
                    <select
                      value={itemCatalogoId}
                      onChange={e => handleSelecionarCatalogo(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-xs font-bold text-gray-300 outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">⚡ Selecionar do Catálogo (Preço automático)...</option>
                      {produtosServicos.map(ps => (
                        <option key={ps.id} value={ps.id}>
                          {ps.ehServico ? '🛠️ [Serviço]' : '📦 [Produto]'} {ps.nome} — R$ {Number(ps.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        placeholder="Descrição do item..."
                        value={itemNome}
                        onChange={e => setItemNome(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs font-bold text-white placeholder-gray-600 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        placeholder="Qtd"
                        min="1"
                        value={itemQtd}
                        onChange={e => setItemQtd(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Unitário R$"
                        value={itemPrecoUnitario}
                        onChange={e => setItemPrecoUnitario(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs font-bold text-white placeholder-gray-600 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAdicionarItemVenda}
                    className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-emerald-400 border border-gray-800 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus size={15} /> Incluir Item no Pedido
                  </button>
                </div>

                {/* Lista dos itens inclusos */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    Itens do Pedido ({itensVenda.length}):
                  </span>
                  {itensVenda.length === 0 ? (
                    <div className="bg-gray-950 p-6 rounded-xl border border-dashed border-gray-800 text-center">
                      <p className="text-gray-500 text-xs font-bold">Nenhum item adicionado ainda.</p>
                    </div>
                  ) : (
                    <div className="bg-gray-950 rounded-xl border border-gray-800 p-2 divide-y divide-gray-900 max-h-44 overflow-y-auto">
                      {itensVenda.map((it, idx) => (
                        <div key={idx} className="p-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-black text-emerald-400">{it.qtd}x</span>
                            <span className="font-bold text-gray-200 truncate">{it.item}</span>
                            <span className="text-gray-500 text-[10px]">
                              (R$ {it.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} un)
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-white">
                              R$ {(it.qtd * it.precoUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoverItemVenda(idx)}
                              className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer p-0.5"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview do total da venda */}
                {itensVenda.length > 0 && (
                  <div className="bg-emerald-950/30 border border-emerald-900/60 p-3.5 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      Subtotal dos Itens
                    </span>
                    <span className="text-xl font-black text-emerald-400">
                      R$ {valorTotalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Footer Etapa 2 */}
                <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setEtapaModal(1)}
                    className="px-4 py-2.5 rounded-xl border border-gray-800 text-gray-400 hover:text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer bg-transparent flex items-center gap-1.5"
                  >
                    <ChevronLeft size={16} />
                    <span>Voltar</span>
                  </button>

                  <button
                    type="button"
                    disabled={itensVenda.length === 0}
                    onClick={() => setEtapaModal(3)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer border-none flex items-center gap-2"
                  >
                    <span>Avançar para Pagamento</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {etapaModal === 3 && (
              <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
                    <CreditCard size={16} className="text-emerald-400" /> Forma de Pagamento & Confirmação
                  </h4>
                  <p className="text-xs text-gray-400">
                    Confira o resumo, ajuste o valor total se necessário e escolha como o cliente pagou
                  </p>
                </div>

                {/* Resumo do pedido */}
                <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-emerald-400" />
                    <span className="font-bold text-gray-300">
                      {clienteId ? clientes.find(c => String(c.id) === clienteId)?.nome : 'Venda Avulsa'}
                    </span>
                  </div>
                  <span className="text-gray-400 font-bold">
                    {itensVenda.length} {itensVenda.length === 1 ? 'item' : 'itens'} no pedido
                  </span>
                </div>

                {/* Valor Total Editável */}
                <div className="bg-emerald-950/40 border border-emerald-900/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <DollarSign size={15} /> Valor Total Final (R$)
                    </label>
                    <span className="text-[10px] text-gray-400 font-bold">Editável para descontos</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-lg font-black text-emerald-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={valorTotalEditavel}
                      onChange={e => {
                        setValorTotalEditavel(e.target.value);
                        setValorFoiEditadoManualmente(true);
                      }}
                      className="w-full bg-gray-950 border border-emerald-500/50 rounded-xl pl-11 pr-4 py-2.5 text-xl font-black text-emerald-400 outline-none focus:border-emerald-400"
                      placeholder={valorTotalCalculado.toFixed(2)}
                    />
                  </div>
                  {valorFoiEditadoManualmente && (
                    <p className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      * Valor alterado manualmente (Subtotal calculado: R$ {valorTotalCalculado.toFixed(2)})
                    </p>
                  )}
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                    Selecione a Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMetodoPagamento(m)}
                        className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          metodoPagamento === m
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md scale-[1.02]'
                            : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {getIconePagamento(m)}
                        <span className="truncate">{m}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status e Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                      Status do Pagamento
                    </label>
                    <select
                      value={statusPagamento}
                      onChange={e => setStatusPagamento(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Pago">Pago (Recebido)</option>
                      <option value="Pendente">Pendente (A Receber)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                      Data da Venda
                    </label>
                    <input
                      type="date"
                      value={dataVenda}
                      onChange={e => setDataVenda(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Footer Etapa 3 */}
                <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setEtapaModal(2)}
                    className="px-4 py-2.5 rounded-xl border border-gray-800 text-gray-400 hover:text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer bg-transparent flex items-center gap-1.5"
                  >
                    <ChevronLeft size={16} />
                    <span>Voltar</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalizarVenda}
                    disabled={salvandoVenda || itensVenda.length === 0}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer border-none flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>{salvandoVenda ? 'Concluindo...' : 'Concluir Venda (OK)'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </Layout>
  );
}
