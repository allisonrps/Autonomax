import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { 
  Clock, Calendar, Plus, ChevronDown, ChevronUp, 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, 
  CreditCard, QrCode, Banknote, FileText, CheckCircle2, 
  Search, Trash2, X, User, Sparkles, Package
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

  // Relógio e Data em tempo real
  const [agora, setAgora] = useState(new Date());

  // Dados
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtosServicos, setProdutosServicos] = useState<ProdutoServico[]>([]);
  const [nomeNegocio, setNomeNegocio] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Cards Expansíveis (FECHADOS POR PADRÃO conforme solicitado)
  const [resumoAberto, setResumoAberto] = useState(false);
  const [pagamentosAberto, setPagamentosAberto] = useState(false);
  const [feedAberto, setFeedAberto] = useState(false);

  // Filtro no feed de vendas do dia
  const [buscaFeed, setBuscaFeed] = useState('');

  // Modal de Nova Venda
  const [modalVendaAberto, setModalVendaAberto] = useState(false);
  const [salvandoVenda, setSalvandoVenda] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('Pix');
  const [statusPagamento, setStatusPagamento] = useState('Pago');
  const [dataVenda, setDataVenda] = useState(() => new Date().toLocaleDateString('en-CA'));

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
      const [resTrans, resCli, resProd, resNeg] = await Promise.allSettled([
        api.get(`/Transacoes/por-negocio/${negocioId}`),
        api.get(`/Clientes/por-negocio/${negocioId}`),
        api.get(`/ProdutosServicos/por-negocio/${negocioId}`),
        api.get('/Negocios')
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
      if (resNeg.status === 'fulfilled' && Array.isArray(resNeg.value.data)) {
        const atual = resNeg.value.data.find((n: any) => n.id === Number(negocioId));
        if (atual) setNomeNegocio(atual.nome);
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
  const chaveOntem = useMemo(() => {
    const ontem = new Date(agora);
    ontem.setDate(agora.getDate() - 1);
    return formatarChaveData(ontem);
  }, [agora]);

  const extrairChave = (dataISO: string) => {
    if (!dataISO) return '';
    const d = new Date(dataISO);
    if (!isNaN(d.getTime())) {
      return formatarChaveData(d);
    }
    return dataISO.slice(0, 10);
  };

  // Vendas do dia e de ontem (apenas entradas/vendas)
  const vendasHoje = useMemo(() => {
    return transacoes
      .filter(t => t.tipo === 'Entrada' && extrairChave(t.data) === chaveHoje)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transacoes, chaveHoje]);

  const vendasOntem = useMemo(() => {
    return transacoes.filter(t => t.tipo === 'Entrada' && extrairChave(t.data) === chaveOntem);
  }, [transacoes, chaveOntem]);

  // Totais do Dia
  const totalVendasHoje = useMemo(() => vendasHoje.reduce((acc, t) => acc + t.valor, 0), [vendasHoje]);
  const qtdVendasHoje = vendasHoje.length;
  const ticketMedioHoje = qtdVendasHoje > 0 ? totalVendasHoje / qtdVendasHoje : 0;

  // Totais de Ontem e Comparativo
  const totalVendasOntem = useMemo(() => vendasOntem.reduce((acc, t) => acc + t.valor, 0), [vendasOntem]);
  const comparativoVendas = useMemo(() => {
    if (totalVendasOntem === 0) {
      if (totalVendasHoje > 0) return { tipo: 'novo', texto: 'Primeiras vendas vs ontem' };
      return { tipo: 'neutro', texto: 'Sem vendas ontem' };
    }
    const diff = totalVendasHoje - totalVendasOntem;
    const perc = (diff / totalVendasOntem) * 100;
    return {
      tipo: diff >= 0 ? 'positivo' : 'negativo',
      diff,
      perc: Math.abs(perc).toFixed(1),
      texto: `${diff >= 0 ? '+' : '-'}${Math.abs(perc).toFixed(0)}% vs ontem`
    };
  }, [totalVendasHoje, totalVendasOntem]);

  // Breakdown por Formas de Pagamento de Hoje
  const pagamentosBreakdown = useMemo(() => {
    const map: Record<string, { total: number; qtd: number }> = {
      'Pix': { total: 0, qtd: 0 },
      'Cartão de Crédito': { total: 0, qtd: 0 },
      'Cartão de Débito': { total: 0, qtd: 0 },
      'Dinheiro': { total: 0, qtd: 0 },
      'Boleto': { total: 0, qtd: 0 },
    };

    vendasHoje.forEach(v => {
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
        porcentagem: totalVendasHoje > 0 ? (dados.total / totalVendasHoje) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [vendasHoje, totalVendasHoje]);

  // Feed Filtrado
  const vendasFeedFiltradas = useMemo(() => {
    if (!buscaFeed.trim()) return vendasHoje;
    const termo = buscaFeed.toLowerCase();
    return vendasHoje.filter(v => {
      const cli = v.cliente?.nome?.toLowerCase() || '';
      const desc = v.descricao?.toLowerCase() || '';
      const met = v.metodoPagamento?.toLowerCase() || '';
      return cli.includes(termo) || desc.includes(termo) || met.includes(termo);
    });
  }, [vendasHoje, buscaFeed]);

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

  // Salvar Venda
  const handleFinalizarVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itensVenda.length === 0) {
      return alert('Adicione pelo menos um produto ou serviço à venda.');
    }
    if (!negocioId) return;

    try {
      setSalvandoVenda(true);
      const dataFormatada = new Date(dataVenda + 'T12:00:00');
      const itensFormatados = itensVenda.map(it => ({
        nome: it.item,
        quantidade: it.qtd
      }));

      const payload = {
        descricao: itensFormatados.map(it => `${it.quantidade}x ${it.nome}`).join(', '),
        valor: valorTotalCalculado,
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
      setMetodoPagamento('Pix');
      setStatusPagamento('Pago');
      setDataVenda(new Date().toLocaleDateString('en-CA'));
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
    if (!window.confirm('Tem certeza que deseja excluir esta venda do dia?')) return;
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

  const getSaudacao = () => {
    const hora = agora.getHours();
    if (hora >= 5 && hora < 12) return 'Bom dia';
    if (hora >= 12 && hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatarDataPorExtenso = (d: Date) => {
    const opcoes: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    const s = d.toLocaleDateString('pt-BR', opcoes);
    return s.charAt(0).toUpperCase() + s.slice(1);
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-6 pb-20 px-4 sm:px-6 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* ============================================================ */}
          {/* 1. HEADER OPERACIONAL: BOM DIA MENOR, DATA EM DESTAQUE,     */}
          {/*    CARD DE HORAS AUMENTADO E BOTÃO NOVA VENDA                */}
          {/* ============================================================ */}
          <div className="bg-gray-900/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-gray-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            {/* Lado Esquerdo: Saudação Menor e Data em Destaque */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-400 tracking-wide">
                  {getSaudacao()}{nomeNegocio ? `, ${nomeNegocio}` : ''}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
                <Calendar size={22} className="text-emerald-400 flex-shrink-0" />
                <span>{formatarDataPorExtenso(agora)}</span>
              </h1>
            </div>

            {/* Lado Direito: Card de Horas Ampliado e Botão Nova Venda */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
              {/* Card de Horas Ampliado com Maior Destaque */}
              <div className="bg-gray-950 px-5 py-3 rounded-xl border border-gray-800 flex items-center gap-3.5 shadow-inner">
                <div className="p-2 bg-emerald-950/60 rounded-lg border border-emerald-900/60 text-emerald-400">
                  <Clock size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Horário Atual</span>
                  <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-emerald-400 leading-none mt-0.5">
                    {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Botão de Destaque Nova Venda */}
              <button
                type="button"
                onClick={() => setModalVendaAberto(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer border-none"
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
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800/40 transition-colors border-none outline-none cursor-pointer text-left"
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
                  R$ {totalVendasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <div className="p-1.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-400">
                  {resumoAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </button>

            {resumoAberto && (
              <div className="p-5 border-t border-gray-800/80 bg-gray-900/50 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* 1. Faturamento Hoje */}
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      Faturamento Hoje
                    </span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-emerald-400 tracking-tight">
                      R$ {totalVendasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-900 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-gray-500">Ontem: R$ {totalVendasOntem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
                    <p className="text-2xl font-black text-white tracking-tight">
                      {qtdVendasHoje} <span className="text-xs text-gray-500 font-bold">{qtdVendasHoje === 1 ? 'pedido' : 'pedidos'}</span>
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-900 flex items-center justify-between text-[10px] font-bold text-gray-500">
                    <span>Média por pedido:</span>
                    <span className="text-gray-300 font-black">
                      R$ {ticketMedioHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
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
                    <p className="text-2xl font-black text-emerald-400 tracking-tight">
                      R$ {ticketMedioHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-900 flex items-center justify-between text-[10px] font-bold text-gray-500">
                    <span>Faturamento ÷ Pedidos</span>
                    <span className="text-emerald-400 font-black">Hoje</span>
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
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800/40 transition-colors border-none outline-none cursor-pointer text-left"
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
              <div className="p-5 border-t border-gray-800/80 bg-gray-900/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {pagamentosBreakdown.length === 0 ? (
                  <div className="py-6 text-center text-gray-500 text-xs font-semibold">
                    Nenhuma venda realizada hoje ainda para calcular a distribuição de pagamentos.
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
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800/40 transition-colors border-none outline-none cursor-pointer text-left"
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
                  {vendasHoje.length} {vendasHoje.length === 1 ? 'Venda' : 'Vendas'}
                </span>
                <div className="p-1.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-400">
                  {feedAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </button>

            {feedAberto && (
              <div className="p-5 border-t border-gray-800/80 bg-gray-900/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Barra de Busca nas Vendas de Hoje */}
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
                    Mostrando {vendasFeedFiltradas.length} de {vendasHoje.length} registros de hoje
                  </span>
                </div>

                {/* Lista do Feed */}
                {vendasFeedFiltradas.length === 0 ? (
                  <div className="bg-gray-950 p-10 rounded-xl border border-dashed border-gray-800 text-center space-y-3">
                    <Sparkles size={32} className="mx-auto text-emerald-400 opacity-60" />
                    <p className="text-xs font-black uppercase tracking-wider text-gray-300">
                      {buscaFeed ? 'Nenhuma venda corresponde aos termos da pesquisa.' : 'Nenhuma venda registrada hoje ainda.'}
                    </p>
                    <p className="text-[11px] text-gray-500 max-w-sm mx-auto font-medium">
                      Clique no botão <strong>Nova Venda</strong> no topo para registrar o primeiro pedido e alimentar o feed em tempo real.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {vendasFeedFiltradas.map(venda => (
                      <div
                        key={venda.id}
                        className="bg-gray-950 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                      >
                        {/* Lado Esquerdo: Hora + Cliente + Itens */}
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          {/* Badge de Horário */}
                          <div className="flex items-center gap-1 bg-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-800 font-mono text-[11px] font-bold text-gray-400 flex-shrink-0">
                            <Clock size={11} className="text-gray-500" />
                            {formatarHora(venda.data)}
                          </div>

                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 flex items-center justify-center font-black text-xs flex-shrink-0">
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
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-gray-900 pt-2 sm:pt-0">
                          {/* Tag Forma de Pagamento */}
                          <div className="flex items-center gap-1.5 bg-gray-900 px-2.5 py-1 rounded-md border border-gray-800 text-[10px] font-black uppercase text-gray-300">
                            {getIconePagamento(venda.metodoPagamento)}
                            <span>{venda.metodoPagamento}</span>
                          </div>

                          {/* Status Pago */}
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            venda.status === 'Pago' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' : 'bg-amber-950/60 text-amber-400 border border-amber-900/50'
                          }`}>
                            {venda.status}
                          </span>

                          {/* Valor */}
                          <span className="text-sm font-black text-emerald-400 min-w-[90px] text-right">
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
      {/* 5. MODAL DE REGISTRAR NOVA VENDA                             */}
      {/* ============================================================ */}
      {modalVendaAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-xl rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 rounded-xl">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Registrar Nova Venda
                  </h3>
                  <p className="text-[10px] font-bold text-gray-500">
                    Preencha os itens vendidos para atualizar o faturamento do dia
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

            {/* Conteúdo Form com Scroll */}
            <form onSubmit={handleFinalizarVenda} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* Cliente */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                  Cliente (Opcional)
                </label>
                <select
                  value={clienteId}
                  onChange={e => setClienteId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">Consumidor Não Identificado / Venda Avulsa</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bloco de Adicionar Item */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Package size={13} /> Adicionar Produtos / Serviços à Venda
                  </span>
                </div>

                {/* Seleção rápida do catálogo */}
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
                  className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  + Incluir Item no Pedido
                </button>
              </div>

              {/* Lista de Itens Inclusos */}
              {itensVenda.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    Itens Inclusos ({itensVenda.length}):
                  </span>
                  <div className="bg-gray-950 rounded-xl border border-gray-800 p-2 divide-y divide-gray-900 max-h-36 overflow-y-auto">
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
                </div>
              )}

              {/* Total da Venda */}
              <div className="bg-emerald-950/30 border border-emerald-900/60 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    Valor Total da Venda
                  </span>
                  <p className="text-[11px] text-gray-400">Calculado automaticamente pelos itens</p>
                </div>
                <span className="text-2xl font-black text-emerald-400">
                  R$ {valorTotalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodoPagamento(m)}
                      className={`p-2.5 rounded-xl border text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        metodoPagamento === m
                          ? 'bg-emerald-950/70 border-emerald-600 text-emerald-400 shadow-sm'
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

              {/* Ações do Modal */}
              <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalVendaAberto(false)}
                  className="px-5 py-3 rounded-xl border border-gray-800 text-gray-400 hover:text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer bg-transparent"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvandoVenda || itensVenda.length === 0}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer border-none flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>{salvandoVenda ? 'Gravando...' : 'Finalizar Venda'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </Layout>
  );
}
