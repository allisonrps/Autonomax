import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Calendar, Plus, ChevronDown, ChevronUp, 
  TrendingUp, DollarSign, ShoppingBag, 
  CreditCard, QrCode, Banknote, FileText, CheckCircle2, 
  Trash2, X, User, Sparkles, RotateCcw, Edit3, Save, Tag, HandCoins, CalendarDays, Clock
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
  const [itemAberto, setItemAberto] = useState<number | null>(null);

  // Modal de Edição de Transação (igual Tela de Fluxo Mensal)
  const [editando, setEditando] = useState<Transacao | null>(null);
  const [novoItemEdicao, setNovoItemEdicao] = useState<{ nome: string; qtd: number | string }>({ nome: '', qtd: 1 });

  // Modal de Nova Venda (Dividido em 3 Fases / Abas)
  const [modalVendaAberto, setModalVendaAberto] = useState(false);
  const [etapaVenda, setEtapaVenda] = useState<1 | 2 | 3>(1);
  const [salvandoVenda, setSalvandoVenda] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('Pix');
  const [statusPagamento, setStatusPagamento] = useState('Pago');
  const [dataVenda, setDataVenda] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [horaVenda, setHoraVenda] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [valorTotalEditavel, setValorTotalEditavel] = useState('');
  const [valorFoiEditadoManualmente, setValorFoiEditadoManualmente] = useState(false);

  // Ref do datepicker para o botão de calendário do dashboard
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleAbrirCalendario = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = dateInputRef.current;
    if (el) {
      try {
        if ('showPicker' in el) {
          (el as any).showPicker();
        } else {
          (el as HTMLInputElement).click();
        }
      } catch (err) {
        (el as HTMLInputElement).click();
      }
    }
  };

  // Itens da nova venda (permite string vazia "" durante a digitação para a tecla backspace funcionar livremente)
  const [itensVenda, setItensVenda] = useState<ItemTemporario[]>([]);
  const [itemCatalogoId, setItemCatalogoId] = useState('');
  const [itemNome, setItemNome] = useState('');
  const [itemQtd, setItemQtd] = useState<number | string>(1);
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

  const extrairChave = (dataISO: string) => {
    if (!dataISO) return '';
    const d = new Date(dataISO);
    if (!isNaN(d.getTime())) {
      return formatarChaveData(d);
    }
    return dataISO.slice(0, 10);
  };

  // Vendas do dia selecionado (apenas entradas/vendas)
  const vendasDoDia = useMemo(() => {
    return transacoes
      .filter(t => t.tipo === 'Entrada' && extrairChave(t.data) === dataSelecionada)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transacoes, dataSelecionada]);

  // Totais do Dia Selecionado
  const totalVendasDoDia = useMemo(() => vendasDoDia.reduce((acc, t) => acc + t.valor, 0), [vendasDoDia]);
  const qtdVendasDoDia = vendasDoDia.length;
  const ticketMedioDoDia = qtdVendasDoDia > 0 ? totalVendasDoDia / qtdVendasDoDia : 0;

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

  // Manipulação de Itens no Modal de Nova Venda
  const handleSelecionarCatalogo = (idStr: string) => {
    setItemCatalogoId(idStr);
    if (!idStr) return;
    const prod = produtosServicos.find(p => p.id === Number(idStr));
    if (prod) {
      setItemNome(prod.nome);
      setItemPrecoUnitario(String(prod.preco));
      if (!itemQtd || Number(itemQtd) <= 0) setItemQtd(1);
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

  useEffect(() => {
    if (!valorFoiEditadoManualmente) {
      setValorTotalEditavel(valorTotalCalculado > 0 ? valorTotalCalculado.toFixed(2) : '');
    }
  }, [valorTotalCalculado, valorFoiEditadoManualmente]);

  const abrirModalVenda = () => {
    setItensVenda([]);
    setClienteId('');
    setMetodoPagamento('Pix');
    setStatusPagamento('Pago');
    setDataVenda(new Date().toLocaleDateString('en-CA'));
    const d = new Date();
    setHoraVenda(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    setValorTotalEditavel('');
    setValorFoiEditadoManualmente(false);
    setItemQtd(1);
    setEtapaVenda(1);
    setModalVendaAberto(true);
  };

  // Salvar Venda (captura horário real ou informado HH:mm)
  const handleFinalizarVenda = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (itensVenda.length === 0) {
      return alert('Adicione pelo menos um produto ou serviço à venda.');
    }
    if (!negocioId) return;

    try {
      setSalvandoVenda(true);
      const horaFinal = horaVenda || `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
      const dataFormatada = new Date(`${dataVenda}T${horaFinal}:00`);
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
      
      setItensVenda([]);
      setClienteId('');
      setMetodoPagamento('Pix');
      setStatusPagamento('Pago');
      setDataVenda(new Date().toLocaleDateString('en-CA'));
      setValorTotalEditavel('');
      setValorFoiEditadoManualmente(false);
      setItemQtd(1);
      setEtapaVenda(1);
      setModalVendaAberto(false);

      carregarDados();
    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
      alert('Erro ao registrar a venda. Tente novamente.');
    } finally {
      setSalvandoVenda(false);
    }
  };

  // Funções de Edição e Ações no Feed (iguais à tela de Fluxo Mensal)
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
    setNovoItemEdicao({ nome: '', qtd: 1 });
  };

  const handleAdicionarItemEdicao = () => {
    if (!novoItemEdicao.nome.trim() || !editando) return;
    let itemNome = novoItemEdicao.nome.trim();
    let qtdNum = Math.max(1, Number(novoItemEdicao.qtd) || 1);
    
    const matchQtd = itemNome.match(/^\s*(\d{1,4})\s*(?:[xX*•\-]|un|unid|unidade|unidades|peças|pecas|pcs|pc)?\s*(.+)$/i);
    if (matchQtd && matchQtd[2]) {
      const qExtr = parseInt(matchQtd[1], 10);
      if (qExtr > 0) {
        qtdNum = Math.max(qtdNum, qExtr);
        itemNome = matchQtd[2].trim();
      }
    }
    itemNome = itemNome.replace(/^[\d\s*xX•\-_/]+/, '').trim() || itemNome;

    setEditando({
      ...editando,
      itens: [...editando.itens, { nome: itemNome, quantidade: qtdNum }]
    });
    setNovoItemEdicao({ nome: '', qtd: 1 });
  };

  const handleUpdateTransacao = async () => {
    if (!editando || !negocioId) return;
    const dataBase = editando.data.split('T')[0];
    const horaStr = formatarHora(editando.data);
    const horaValida = horaStr !== '--:--' ? horaStr : '12:00';
    const dataAjustada = new Date(`${dataBase}T${horaValida}:00`);

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
      clienteId: editando.clienteId ? Number(editando.clienteId) : null,
      data: dataAjustada.toISOString()
    };
    try {
      await api.put(`/Transacoes/${editando.id}`, payload);
      setEditando(null);
      carregarDados();
    } catch (err) {
      alert("Erro ao atualizar transação.");
    }
  };

  const handleAlternarStatus = async (t: Transacao) => {
    if (!negocioId) return;
    const nStatus = t.status === 'Pago' ? 'Pendente' : 'Pago';
    try {
      await api.put(`/Transacoes/${t.id}`, { ...t, status: nStatus, negocioId: Number(negocioId) });
      carregarDados();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAlternarMetodo = async (t: Transacao) => {
    if (!negocioId) return;
    const metodos = ['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito'];
    const idx = metodos.indexOf(t.metodoPagamento);
    const next = (idx + 1) % metodos.length;
    try {
      await api.put(`/Transacoes/${t.id}`, { ...t, metodoPagamento: metodos[next >= 0 ? next : 0], negocioId: Number(negocioId) });
      carregarDados();
    } catch (err) {
      console.error(err);
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
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2.5">
                <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                  {/* Botão de Ícone de Calendário 100% Clicável em qualquer ponto */}
                  <div
                    onClick={handleAbrirCalendario}
                    className="relative p-2.5 sm:p-3 bg-gray-950 hover:bg-emerald-950/70 text-emerald-400 hover:text-emerald-300 rounded-xl border border-gray-800 hover:border-emerald-500/60 transition-all cursor-pointer flex items-center justify-center group flex-shrink-0 shadow-sm active:scale-95 select-none"
                    title="Clique para alterar a data"
                  >
                    <Calendar size={26} className="group-hover:scale-110 transition-transform flex-shrink-0 pointer-events-none" />
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={dataSelecionada}
                      onChange={e => setDataSelecionada(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-30"
                    />
                  </div>

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

                {/* Relógio exclusivo para mobile */}
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
              <div className="p-4 sm:p-5 border-t border-gray-800/80 bg-gray-900/50 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* 1. Faturamento - Direto com Ícone e Valor Lado a Lado */}
                <div className="bg-gray-950 p-5 sm:p-6 rounded-2xl border border-gray-800 flex items-center gap-4 hover:border-gray-700 transition-all">
                  <div className="p-3.5 bg-emerald-950/70 border border-emerald-900/70 text-emerald-400 rounded-2xl flex-shrink-0">
                    <DollarSign size={28} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider truncate">
                      Faturamento {ehHoje ? 'Hoje' : 'do Dia'}
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight truncate">
                      R$ {totalVendasDoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* 2. Vendas Concluídas - Direto com Ícone e Valor Lado a Lado */}
                <div className="bg-gray-950 p-5 sm:p-6 rounded-2xl border border-gray-800 flex items-center gap-4 hover:border-gray-700 transition-all">
                  <div className="p-3.5 bg-emerald-950/70 border border-emerald-900/70 text-emerald-400 rounded-2xl flex-shrink-0">
                    <ShoppingBag size={28} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider truncate">
                      Vendas Concluídas
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
                      {qtdVendasDoDia} <span className="text-sm font-bold text-gray-400">{qtdVendasDoDia === 1 ? 'pedido' : 'pedidos'}</span>
                    </p>
                  </div>
                </div>

                {/* 3. Ticket Médio - Direto com Ícone e Valor Lado a Lado */}
                <div className="bg-gray-950 p-5 sm:p-6 rounded-2xl border border-gray-800 flex items-center gap-4 hover:border-gray-700 transition-all">
                  <div className="p-3.5 bg-emerald-950/70 border border-emerald-900/70 text-emerald-400 rounded-2xl flex-shrink-0">
                    <TrendingUp size={28} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider truncate">
                      Ticket Médio
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight truncate">
                      R$ {ticketMedioDoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
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
          {/* (MODELO IDÊNTICO AOS CARDS DA TELA DE FLUXO MENSAL)         */}
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
              <div className="p-4 sm:p-5 border-t border-gray-800/80 bg-gray-900/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Lista de Vendas no Modelo do Fluxo Mensal */}
                {vendasDoDia.length === 0 ? (
                  <div className="bg-gray-950 p-8 sm:p-10 rounded-xl border border-dashed border-gray-800 text-center space-y-3">
                    <Sparkles size={32} className="mx-auto text-emerald-400 opacity-60" />
                    <p className="text-xs font-black uppercase tracking-wider text-gray-300">
                      Nenhuma venda registrada para este dia.
                    </p>
                    <p className="text-[11px] text-gray-500 max-w-sm mx-auto font-medium">
                      Clique no botão <strong>Nova Venda</strong> para registrar um pedido e alimentar o feed em tempo real.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vendasDoDia.map(t => {
                      const itensExibicao = (t.itens && t.itens.length > 0)
                        ? t.itens.map(it => ({
                            nome: it.nome.replace(/^[\d\s*xX•\-_/]+/, '').trim() || it.nome,
                            quantidade: Math.max(1, it.quantidade || 1)
                          }))
                        : [];

                      const textoResumoItens = itensExibicao.length > 0
                        ? itensExibicao.map(it => `${it.quantidade}x ${it.nome}`).join(', ')
                        : t.descricao;

                      return (
                        <div key={t.id} className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all">
                          <button
                            type="button"
                            onClick={() => setItemAberto(itemAberto === t.id ? null : t.id)}
                            className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-transparent border-none cursor-pointer outline-none text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Badge de Horário mantido da tela Dashboard */}
                              <div className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {formatarHora(t.data)}
                              </div>
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="text-xs font-black text-gray-200 uppercase tracking-tight truncate">
                                  {t.cliente?.nome || "Consumidor Avulso"}
                                </span>
                                {textoResumoItens && (
                                  <span className="text-[10px] font-bold text-gray-400 truncate mt-0.5">
                                    {textoResumoItens}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-xs sm:text-sm font-black tracking-tight text-emerald-400">
                                R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              {itemAberto === t.id ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
                            </div>
                          </button>

                          {itemAberto === t.id && (
                            <div className="px-4 pb-4 pt-1 space-y-4 animate-in slide-in-from-top duration-200 bg-gray-900/40 border-t border-gray-800/60">
                              <div className="p-3 bg-gray-950/80 rounded-lg border border-gray-800">
                                {itensExibicao.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {itensExibicao.map((it, idx) => (
                                      <span key={idx} className="bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-md text-xs font-bold text-gray-200 flex items-center gap-1.5 shadow-sm">
                                        <span className="font-black text-xs text-emerald-400">{it.quantidade}x</span>
                                        <span>{it.nome}</span>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 font-medium">{t.descricao}</span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleAlternarStatus(t)}
                                    className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border cursor-pointer transition-colors ${
                                      t.status === 'Pago' ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400 hover:bg-emerald-900/50' : 'bg-amber-950/50 border-amber-900 text-amber-400 hover:bg-amber-900/50'
                                    }`}
                                  >
                                    <CheckCircle2 size={10}/> {t.status}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAlternarMetodo(t)}
                                    className="bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer hover:bg-gray-800 transition-colors text-[9px] font-black uppercase text-gray-400"
                                  >
                                    <Tag size={10} className="text-gray-500"/>{t.metodoPagamento}
                                  </button>
                                </div>

                                {/* Botões de Ação do modelo Fluxo Mensal */}
                                <div className="flex gap-1">
                                  {t.clienteId && (
                                    <Link
                                      to={`/clientes/${t.clienteId}`}
                                      className="p-2 rounded-md border border-emerald-900 text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/30 transition-all flex items-center justify-center"
                                      title="Ver Cliente"
                                    >
                                      <User size={14}/>
                                    </Link>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => abrirEdicao(t)}
                                    className="p-2 rounded-md border border-emerald-900 text-emerald-400 bg-emerald-950/40 cursor-pointer flex items-center justify-center hover:bg-emerald-900/30 transition-all"
                                    title="Editar Venda"
                                  >
                                    <Edit3 size={14}/>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleExcluirTransacao(t.id)}
                                    className="p-2 text-red-400 bg-red-950/40 border border-red-900 rounded-md cursor-pointer hover:bg-red-900/30 transition-all flex items-center justify-center"
                                    title="Excluir Venda"
                                  >
                                    <Trash2 size={14}/>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. MODAL DE REGISTRAR NOVA VENDA (3 FASES / ABAS CLEAN)     */}
      {/* ============================================================ */}
      {modalVendaAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gray-900 w-full max-w-lg rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            
            {/* Cabeçalho com Indicador de 3 Fases / Abas */}
            <div className="p-4 border-b border-gray-800 bg-gray-900/90 flex-shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-950/70 border border-emerald-900/60 text-emerald-400 rounded-xl">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Nova Venda
                    </h3>
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

              {/* Barra de Navegação por Abas (1. Cliente & Data | 2. Itens | 3. Pagamento) */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-950 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => setEtapaVenda(1)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none ${
                    etapaVenda === 1
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[9px]">1</span>
                  <span className="truncate">Cliente & Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEtapaVenda(2)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none ${
                    etapaVenda === 2
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[9px]">2</span>
                  <span className="truncate">Itens</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEtapaVenda(3)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none ${
                    etapaVenda === 3
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[9px]">3</span>
                  <span className="truncate">Pagamento</span>
                </button>
              </div>
            </div>

            {/* Conteúdo com Scroll para cada Fase */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">

              {/* FASE 1: CLIENTE, DATA E HORA */}
              {etapaVenda === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Cliente */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                      Selecione o Cliente
                    </label>
                    <select
                      value={clienteId}
                      onChange={e => setClienteId(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-3 text-xs font-bold text-white outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">👤 Consumidor Não Identificado (Venda Avulsa)</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Data e Hora Nativo */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                        <Calendar size={13} className="text-emerald-400" />
                        <span>Data da Venda</span>
                      </label>
                      <input
                        type="date"
                        value={dataVenda}
                        onChange={e => setDataVenda(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-emerald-500 [color-scheme:dark] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                        <Clock size={13} className="text-emerald-400" />
                        <span>Horário da Venda</span>
                      </label>
                      <input
                        type="time"
                        value={horaVenda}
                        onChange={e => setHoraVenda(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-emerald-500 [color-scheme:dark] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* FASE 2: ADICIONAR ITENS */}
              {etapaVenda === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400">
                      Adicionar Produtos ou Serviços
                    </label>

                    {/* Seleção rápida do Catálogo */}
                    {produtosServicos.length > 0 && (
                      <select
                        value={itemCatalogoId}
                        onChange={e => handleSelecionarCatalogo(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="">⚡ Selecionar do Catálogo (Preço automático)...</option>
                        {produtosServicos.map(ps => (
                          <option key={ps.id} value={ps.id}>
                            {ps.ehServico ? '🛠️' : '📦'} {ps.nome} — R$ {Number(ps.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Inputs de Item / Qtd / Preço */}
                    <div className="grid grid-cols-12 gap-1.5">
                      <input
                        type="text"
                        placeholder="Descrição do item..."
                        value={itemNome}
                        onChange={e => setItemNome(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdicionarItemVenda(); } }}
                        className="col-span-6 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white placeholder-gray-600 outline-none focus:border-emerald-500"
                      />
                      <input
                        type="number"
                        placeholder="Qtd"
                        min="1"
                        value={itemQtd}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '') {
                            setItemQtd('');
                          } else {
                            const parsed = parseInt(val, 10);
                            setItemQtd(isNaN(parsed) ? '' : parsed);
                          }
                        }}
                        onBlur={() => {
                          if (itemQtd === '' || Number(itemQtd) < 1) setItemQtd(1);
                        }}
                        className="col-span-2 bg-gray-950 border border-gray-800 rounded-xl px-2 py-2.5 text-xs font-bold text-center text-white outline-none focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder="R$ Unit"
                        value={itemPrecoUnitario}
                        onChange={e => setItemPrecoUnitario(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdicionarItemVenda(); } }}
                        className="col-span-3 bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-2.5 text-xs font-bold text-emerald-400 placeholder-gray-600 outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAdicionarItemVenda}
                        className="col-span-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center cursor-pointer border-none transition-colors"
                        title="Adicionar item"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Pílulas dos Itens Inclusos */}
                    {itensVenda.length === 0 ? (
                      <div className="p-6 bg-gray-950/50 rounded-xl border border-dashed border-gray-800 text-center">
                        <p className="text-xs font-bold text-gray-500">Nenhum item adicionado ainda.</p>
                        <p className="text-[10px] text-gray-600 mt-1">Selecione do catálogo ou digite acima e clique no botão (+).</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {itensVenda.map((it, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold text-gray-200"
                          >
                            <span className="text-emerald-400 font-black">{it.qtd}x</span>
                            <span className="truncate max-w-[140px]">{it.item}</span>
                            <span className="text-gray-400 text-[10px]">
                              (R$ {(it.qtd * it.precoUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoverItemVenda(idx)}
                              className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer p-0.5 ml-0.5"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FASE 3: PAGAMENTO E CONCLUSÃO */}
              {etapaVenda === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Resumo Rápido de Itens */}
                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300">Total de Itens</span>
                    <span className="text-xs font-black text-emerald-400">{itensVenda.length} {itensVenda.length === 1 ? 'item' : 'itens'}</span>
                  </div>

                  {/* Valor Total Direto e Simples */}
                  <div className="flex items-center justify-between py-2 px-1 border-b border-gray-800">
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      TOTAL:
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-black text-emerald-400">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={valorTotalEditavel}
                        onChange={e => {
                          setValorTotalEditavel(e.target.value);
                          setValorFoiEditadoManualmente(true);
                        }}
                        className="w-32 bg-transparent text-right text-lg font-black text-emerald-400 outline-none border-b border-emerald-500/30 focus:border-emerald-400 transition-colors"
                        placeholder={valorTotalCalculado.toFixed(2)}
                      />
                    </div>
                  </div>

                  {/* Meio de Pagamento */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                      Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['Pix', 'Cartão', 'Dinheiro', 'Boleto'].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMetodoPagamento(m)}
                          className={`py-2.5 px-1 rounded-xl border text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            metodoPagamento === m
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
                              : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {getIconePagamento(m)}
                          <span>{m}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status da Venda */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                      Status do Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStatusPagamento('Pago')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          statusPagamento === 'Pago'
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
                            : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <CheckCircle2 size={14} />
                        <span>Pago (Recebido)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatusPagamento('Pendente')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          statusPagamento === 'Pendente'
                            ? 'bg-amber-950/80 border-amber-500 text-amber-400'
                            : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <span>⏳ Pendente</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer com Navegação por Botões de Avançar / Voltar / Concluir */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/90 flex items-center justify-between gap-2 flex-shrink-0">
              {etapaVenda === 1 ? (
                <button
                  type="button"
                  onClick={() => setModalVendaAberto(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-800 text-gray-400 hover:text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer bg-transparent"
                >
                  Cancelar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEtapaVenda(prev => (prev - 1) as 1 | 2 | 3)}
                  className="px-4 py-2.5 rounded-xl border border-gray-800 text-gray-300 hover:text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer bg-gray-950"
                >
                  ⬅ Voltar
                </button>
              )}

              {etapaVenda < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (etapaVenda === 2 && itensVenda.length === 0) {
                      return alert('Adicione pelo menos um item à venda para continuar.');
                    }
                    setEtapaVenda(prev => (prev + 1) as 1 | 2 | 3);
                  }}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer border-none flex items-center gap-1.5"
                >
                  <span>Avançar</span>
                  <span>➔</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalizarVenda}
                  disabled={salvandoVenda || itensVenda.length === 0}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer border-none flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>{salvandoVenda ? 'Salvando...' : 'Concluir Venda (OK)'}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. MODAL DE EDIÇÃO DE TRANSAÇÃO                              */}
      {/* ============================================================ */}
      {editando && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-gray-900 w-full md:max-w-xl h-[95vh] md:h-auto md:max-h-[95vh] rounded-t-xl md:rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-800 animate-in slide-in-from-bottom md:zoom-in duration-250">
            <div className="bg-gray-950 px-6 py-4 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-400"/>
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-widest">Ajustar Transação</h3>
              </div>
              <button onClick={() => setEditando(null)} className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer p-1">
                <X size={20}/>
              </button>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto flex-1 pb-20 md:pb-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Itens da Transação</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      placeholder="Item..."
                      className="flex-1 p-3 bg-gray-950 border border-gray-800 rounded-md outline-none text-xs font-medium focus:border-emerald-600 text-white"
                      value={novoItemEdicao.nome}
                      onChange={e => setNovoItemEdicao({...novoItemEdicao, nome: e.target.value})}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdicionarItemEdicao(); } }}
                    />
                    <input
                      type="number"
                      min="1"
                      className="w-14 p-3 bg-gray-950 border border-gray-800 rounded-md text-center font-black text-xs text-white"
                      value={novoItemEdicao.qtd}
                      onChange={e => {
                        const val = e.target.value;
                        setNovoItemEdicao(prev => ({
                          ...prev,
                          qtd: val === '' ? '' : (parseInt(val, 10) || '')
                        }));
                      }}
                      onBlur={() => {
                        if (novoItemEdicao.qtd === '' || Number(novoItemEdicao.qtd) < 1) {
                          setNovoItemEdicao(prev => ({ ...prev, qtd: 1 }));
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAdicionarItemEdicao}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 rounded-md border border-emerald-800 cursor-pointer transition-colors"
                    >
                      <Plus size={16}/>
                    </button>
                  </div>
                  <div className="min-h-[80px] p-3 bg-gray-950 rounded-md border border-gray-800 flex flex-wrap gap-1.5">
                    {editando.itens.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-md">
                        <span className="text-emerald-400 font-black text-[10px]">{Math.max(1, it.quantidade || 1)}x</span>
                        <span className="text-gray-300 text-[10px] font-bold">{it.nome}</span>
                        <button onClick={() => setEditando({...editando, itens: editando.itens.filter((_, i) => i !== idx)})} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer">
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase ml-1">
                    <DollarSign size={10}/> Valor R$
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md font-black text-emerald-400 outline-none text-sm focus:border-emerald-600"
                    value={editando.valor}
                    onChange={e => setEditando({...editando, valor: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase ml-1">
                    <HandCoins size={10}/> Método
                  </label>
                  <select
                    className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-300 outline-none text-xs focus:border-emerald-600"
                    value={editando.metodoPagamento}
                    onChange={e => setEditando({...editando, metodoPagamento: e.target.value})}
                  >
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase ml-1">
                    <CalendarDays size={10}/> Data
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-300 outline-none text-sm focus:border-emerald-600"
                    value={editando.data.split('T')[0]}
                    onChange={e => setEditando({...editando, data: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase ml-1">
                    <CheckCircle2 size={10}/> Status
                  </label>
                  <select
                    className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-300 outline-none text-xs focus:border-emerald-600"
                    value={editando.status}
                    onChange={e => setEditando({...editando, status: e.target.value})}
                  >
                    <option value="Pago">✅ Pago</option>
                    <option value="Pendente">⏳ Pendente</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleUpdateTransacao}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-md font-black uppercase text-xs tracking-wider border border-emerald-700 cursor-pointer transition-colors active:scale-95 mb-4"
              >
                Salvar Alterações <Save size={14} className="inline ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
