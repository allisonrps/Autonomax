import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Trash2, CalendarDays, X, Receipt, ChevronLeft, 
  ChevronRight, CheckCircle2, FileDown,
  ChevronDown, ChevronUp, Edit3, Save, Tag,
  BarChart3, User, DollarSign, HandCoins, Plus, Wallet, ArrowUpRight, ArrowDownRight, TrendingUp,
  Filter, Coins, QrCode, CreditCard, LineChart as LineChartIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { LoadingProgress } from '../components/LoadingProgress';

interface Item { nome: string; quantidade: number; }

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  desconto?: number;
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

export function FluxoCaixa() {
  const { mes, ano } = useParams();
  const navigate = useNavigate();
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  const [mesAtivo, setMesAtivo] = useState(Number(mes) || new Date().getMonth() + 1);
  const [anoAtivo, setAnoAtivo] = useState(Number(ano) || new Date().getFullYear());
  
  const monthInputRef = useRef<HTMLInputElement>(null);

  const handleAbrirCalendario = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = monthInputRef.current;
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
  
  const [resumoAberto, setResumoAberto] = useState(false); 
  const [graficoDiarioAberto, setGraficoDiarioAberto] = useState(false);
  const [itemAberto, setItemAberto] = useState<number | null>(null);
  
  const [filtroAtivo, setFiltroAtivo] = useState<'Tudo' | 'Entrada' | 'Saida' | 'Pendente'>('Tudo');

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  
  const [editando, setEditando] = useState<Transacao | null>(null);
  const [novoItemEdicao, setNovoItemEdicao] = useState<{ nome: string; qtd: number | string }>({ nome: '', qtd: 1 });

  const mesesNome = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const anosDisponiveis = useMemo(() => {
    const anoAtual = new Date().getFullYear();
    const lista = [];
    const minAno = Math.min(2023, anoAtivo);
    const maxAno = Math.max(anoAtual + 2, anoAtivo + 1);
    for (let y = minAno; y <= maxAno; y++) {
      lista.push(y);
    }
    return lista;
  }, [anoAtivo]);

  const formatarDataLocal = (dataISO: string) => {
    const data = new Date(dataISO);
    data.setMinutes(data.getMinutes() + data.getTimezoneOffset());
    return data;
  };

  const formatarHora = (dataISO: string) => {
    try {
      const data = new Date(dataISO);
      return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  const carregarDados = useCallback(async () => {
    if (!negocioId) return;
    setCarregando(true);
    try {
      const resTrans = await api.get(`/Transacoes/por-periodo/${negocioId}?mes=${mesAtivo}&ano=${anoAtivo}`);
      const transData = (resTrans.data || []).map((t: Transacao) => ({
        ...t,
        metodoPagamento: t.metodoPagamento === 'A Vista' ? 'Dinheiro' : t.metodoPagamento
      }));
      const ordenadas = transData.sort((a: Transacao, b: Transacao) => 
        new Date(b.data).getTime() - new Date(a.data).getTime()
      );
      setTransacoes(ordenadas);
    } catch (err) { 
      console.error("Erro ao carregar transações do período:", err); 
    } finally {
      setCarregando(false);
    }
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
    navigate(`/fluxo-caixa/${nMes}/${nAno}`);
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

  async function handleUpdateTransacao() {
    if (!editando) return;
    const dataBase = editando.data.split('T')[0];
    const dataAjustada = new Date(dataBase + 'T12:00:00');
    const itensLimpos = (editando.itens || []).map(it => ({
      ...it,
      nome: it.nome.replace(/^[\d\s*xX•\-_/]+/, '').trim() || it.nome,
      quantidade: Math.max(1, it.quantidade || 1)
    }));

    const payload = {
      ...editando,
      desconto: Number(editando.desconto) || 0,
      itens: itensLimpos,
      descricao: itensLimpos.length > 0
        ? itensLimpos.map(it => `${it.quantidade}x ${it.nome}`).join(', ')
        : editando.descricao,
      negocioId: Number(negocioId),
      clienteId: editando.tipo === 'Entrada' ? Number(editando.clienteId) || null : null,
      fornecedorId: editando.tipo === 'Saida' ? Number(editando.fornecedorId) || null : null,
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
    // Atualização otimista imediata sem recarregar a tela
    setTransacoes(prev => prev.map(item => item.id === t.id ? { ...item, status: nStatus } : item));
    try {
      await api.put(`/Transacoes/${t.id}`, { ...t, status: nStatus, negocioId: Number(negocioId) });
    } catch (err) {
      console.error(err);
      // Reverter se falhar
      setTransacoes(prev => prev.map(item => item.id === t.id ? { ...item, status: t.status } : item));
      alert("Erro ao alterar status.");
    }
  }

  async function handleAlternarMetodo(t: Transacao) {
    const metodos = ['Pix', 'Dinheiro', 'Cartão'];
    const metodoAtual = t.metodoPagamento === 'A Vista' ? 'Dinheiro' : t.metodoPagamento;
    const idx = metodos.indexOf(metodoAtual);
    const next = (idx + 1) % metodos.length;
    const novoMetodo = metodos[next >= 0 ? next : 0];

    // Atualização otimista imediata sem recarregar a tela
    setTransacoes(prev => prev.map(item => item.id === t.id ? { ...item, metodoPagamento: novoMetodo } : item));
    try {
      await api.put(`/Transacoes/${t.id}`, { ...t, metodoPagamento: novoMetodo, negocioId: Number(negocioId) });
    } catch (err) {
      console.error(err);
      // Reverter se falhar
      setTransacoes(prev => prev.map(item => item.id === t.id ? { ...item, metodoPagamento: t.metodoPagamento } : item));
      alert("Erro ao alterar método de pagamento.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir lançamento?")) return;
    try { await api.delete(`/Transacoes/${id}`); carregarDados(); } catch (err) { alert("Erro ao excluir"); }
  }

  const totalEntradas = transacoes.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoes.filter(t => t.tipo === 'Saida').reduce((acc, t) => acc + t.valor, 0);
  const totalPendentes = transacoes.filter(t => t.status === 'Pendente').reduce((acc, t) => acc + t.valor, 0);
  const totalDescontos = transacoes.reduce((acc, t) => acc + (t.desconto || 0), 0);
  const saldo = totalEntradas - totalSaidas;

  // Gráfico de Ganhos Diários no Mês (Linha do tempo diária)
  const dadosGanhosDiarios = useMemo(() => {
    const diasNoMes = new Date(anoAtivo, mesAtivo, 0).getDate();
    const lista = [];

    for (let d = 1; d <= diasNoMes; d++) {
      const transacoesDia = transacoes.filter(t => {
        const dateObj = new Date(t.data);
        dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
        return dateObj.getDate() === d;
      });

      const ganhos = transacoesDia.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
      const despesas = transacoesDia.filter(t => t.tipo === 'Saida').reduce((acc, t) => acc + t.valor, 0);
      const qtdVendas = transacoesDia.filter(t => t.tipo === 'Entrada').length;

      lista.push({
        dia: d,
        rotulo: `Dia ${d}`,
        ganhos,
        despesas,
        liquido: ganhos - despesas,
        qtdVendas
      });
    }

    return lista;
  }, [transacoes, mesAtivo, anoAtivo]);

  const resumoGanhosDiarios = useMemo(() => {
    const totalGanhos = dadosGanhosDiarios.reduce((acc, d) => acc + d.ganhos, 0);
    const mediaDiaria = dadosGanhosDiarios.length > 0 ? totalGanhos / dadosGanhosDiarios.length : 0;

    let melhorDia = dadosGanhosDiarios[0];
    dadosGanhosDiarios.forEach(d => {
      if (d.ganhos > (melhorDia?.ganhos || 0)) melhorDia = d;
    });

    return { totalGanhos, mediaDiaria, melhorDia };
  }, [dadosGanhosDiarios]);

  const transacoesFiltradas = transacoes.filter(t => {
    if (filtroAtivo === 'Tudo') return true;
    if (filtroAtivo === 'Pendente') return t.status === 'Pendente';
    return t.tipo === filtroAtivo;
  });

  // Custom tick para o eixo X do gráfico (números com cor diferenciada em sábado e domingo)
  const renderCustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const diaNum = Number(payload.value);
    const dataObj = new Date(anoAtivo, mesAtivo - 1, diaNum);
    const ehFimDeSemana = dataObj.getDay() === 0 || dataObj.getDay() === 6;

    return (
      <text
        x={x}
        y={y + 11}
        textAnchor="middle"
        fill={ehFimDeSemana ? '#fbbf24' : '#9ca3af'}
        fontSize={10}
        fontWeight={ehFimDeSemana ? 800 : 500}
      >
        {payload.value}
      </text>
    );
  };

  // Agrupamento de transações filtradas por dia para o separador com pílulas
  const transacoesAgrupadasPorDia = useMemo(() => {
    const gruposMap = new Map<string, Transacao[]>();

    transacoesFiltradas.forEach(t => {
      const dataObj = formatarDataLocal(t.data);
      const ano = dataObj.getFullYear();
      const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
      const dia = String(dataObj.getDate()).padStart(2, '0');
      const chaveDia = `${ano}-${mes}-${dia}`;

      if (!gruposMap.has(chaveDia)) {
        gruposMap.set(chaveDia, []);
      }
      gruposMap.get(chaveDia)!.push(t);
    });

    // Ordena do dia mais recente para o mais antigo
    const gruposOrdenados = Array.from(gruposMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));

    return gruposOrdenados.map(([chaveDia, itens]) => {
      const dataObj = new Date(chaveDia + 'T12:00:00');
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const diaSemana = diasSemana[dataObj.getDay()];
      const diasCurto = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
      const diaSemanaCurto = diasCurto[dataObj.getDay()];
      const dd = String(dataObj.getDate()).padStart(2, '0');
      const mm = String(dataObj.getMonth() + 1).padStart(2, '0');
      const aa = String(dataObj.getFullYear()).slice(-2);

      const qtdVendas = itens.filter(t => t.tipo === 'Entrada').length;
      const totalReceitaDia = itens.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
      const totalDespesaDia = itens.filter(t => t.tipo === 'Saida').reduce((acc, t) => acc + t.valor, 0);
      const ehFimDeSemana = dataObj.getDay() === 0 || dataObj.getDay() === 6;

      return {
        chaveDia,
        diaNum: dd,
        diaSemanaCurto,
        diaSemanaCompleto: diaSemana,
        ehFimDeSemana,
        mesAno: `${mm}/${aa}`,
        rotuloData: `${diaSemana}, ${dd}/${mm}/${aa}`,
        itens,
        qtdVendas,
        totalReceitaDia,
        totalDespesaDia
      };
    });
  }, [transacoesFiltradas]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-5">
          
          {/* NAVEGAÇÃO / CONTROLE DE PERÍODO PADRÃO CLIENTES */}
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div 
                onClick={handleAbrirCalendario}
                className="relative p-3 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-900/50 hover:border-emerald-500/60 transition-all flex items-center justify-center cursor-pointer group shadow-sm active:scale-95 select-none"
                title="Clique para escolher o mês"
              >
                <CalendarDays size={22} className="group-hover:scale-110 transition-transform pointer-events-none" />
                <input
                  ref={monthInputRef}
                  type="month"
                  value={`${anoAtivo}-${String(mesAtivo).padStart(2, '0')}`}
                  onChange={e => {
                    if (!e.target.value) return;
                    const [anoStr, mesStr] = e.target.value.split('-');
                    if (anoStr && mesStr) {
                      setAnoAtivo(Number(anoStr));
                      setMesAtivo(Number(mesStr));
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-30"
                />
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 
                  onClick={handleAbrirCalendario}
                  className="text-lg font-black tracking-tight uppercase text-gray-100 whitespace-nowrap cursor-pointer hover:text-emerald-300 transition-colors select-none"
                  title="Clique para escolher o mês no calendário"
                >
                  {mesesNome[mesAtivo - 1]}
                </h2>
                {/* Seletor de Ano Rápido */}
                <select
                  value={anoAtivo}
                  onChange={e => setAnoAtivo(Number(e.target.value))}
                  className="bg-gray-950/80 border border-gray-800 hover:border-emerald-500/60 text-emerald-400 font-black text-sm sm:text-base rounded-lg px-2.5 py-1 outline-none cursor-pointer transition-all hover:bg-gray-900 shadow-sm"
                  title="Selecionar ano"
                >
                  {anosDisponiveis.map(y => (
                    <option key={y} value={y} className="bg-gray-950 text-gray-100 font-bold">
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 w-full lg:w-auto justify-end">
              <button onClick={() => navegarPeriodo(-1)} className="p-2 hover:bg-gray-800 rounded-md transition-all text-gray-300 border border-gray-800 bg-gray-950 cursor-pointer" title="Mês anterior"><ChevronLeft size={18} /></button>
              <button onClick={() => navegarPeriodo(1)} className="p-2 hover:bg-gray-800 rounded-md transition-all text-gray-300 border border-gray-800 bg-gray-950 cursor-pointer" title="Próximo mês"><ChevronRight size={18} /></button>
            </div>
          </div>

          {/* PAINEL DE SALDOS */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <button onClick={() => setResumoAberto(!resumoAberto)} className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-none outline-none cursor-pointer border-b border-gray-800">
              <div className="flex items-center gap-2"><BarChart3 size={18} className="text-emerald-400"/><h3 className="text-xs font-black text-gray-200 uppercase tracking-wider">Painel de Saldos</h3></div>
              {resumoAberto ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
            </button>
            {resumoAberto && (
              <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3 animate-in slide-in-from-top duration-200 bg-gray-900">
                {/* 1. Receitas */}
                <div className="p-3 sm:p-3.5 rounded-xl border border-gray-800 bg-gray-950/40 flex flex-col justify-between gap-1.5 hover:border-gray-700 transition-all shadow-sm min-w-0">
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Receitas</span>
                    <div className="p-1 bg-emerald-950/60 text-emerald-400 rounded-lg border border-emerald-900/60 flex-shrink-0">
                      <ArrowUpRight size={13} />
                    </div>
                  </div>
                  <p className="text-sm sm:text-base font-black text-emerald-400 tracking-tight truncate" title={`Receitas: R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                    R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* 2. Despesas */}
                <div className="p-3 sm:p-3.5 rounded-xl border border-gray-800 bg-gray-950/40 flex flex-col justify-between gap-1.5 hover:border-gray-700 transition-all shadow-sm min-w-0">
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Despesas</span>
                    <div className="p-1 bg-red-950/60 text-red-400 rounded-lg border border-red-900/60 flex-shrink-0">
                      <ArrowDownRight size={13} />
                    </div>
                  </div>
                  <p className="text-sm sm:text-base font-black text-red-400 tracking-tight truncate" title={`Despesas: R$ ${totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                    R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* 3. Descontos */}
                <div className="p-3 sm:p-3.5 rounded-xl border border-purple-900/40 bg-purple-950/20 flex flex-col justify-between gap-1.5 hover:border-purple-800/60 transition-all shadow-sm min-w-0">
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider truncate">Descontos</span>
                    <div className="p-1 bg-purple-950/60 text-purple-400 rounded-lg border border-purple-900/60 flex-shrink-0">
                      <Tag size={13} />
                    </div>
                  </div>
                  <p className="text-sm sm:text-base font-black text-purple-400 tracking-tight truncate" title={`Descontos: R$ ${totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                    R$ {totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* 4. Média Diária */}
                <div className="p-3 sm:p-3.5 rounded-xl border border-blue-900/40 bg-blue-950/20 flex flex-col justify-between gap-1.5 hover:border-blue-800/60 transition-all shadow-sm min-w-0">
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider truncate">Média Diária</span>
                    <div className="p-1 bg-blue-950/60 text-blue-400 rounded-lg border border-blue-900/60 flex-shrink-0">
                      <TrendingUp size={13} />
                    </div>
                  </div>
                  <p className="text-sm sm:text-base font-black text-blue-400 tracking-tight truncate" title={`Média Diária: R$ ${resumoGanhosDiarios.mediaDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                    R$ {resumoGanhosDiarios.mediaDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* 5. A Receber */}
                <div className="p-3 sm:p-3.5 rounded-xl border border-gray-800 bg-gray-950/40 flex flex-col justify-between gap-1.5 hover:border-gray-700 transition-all shadow-sm min-w-0">
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">A Receber</span>
                    <div className="p-1 bg-amber-950/60 text-amber-400 rounded-lg border border-amber-900/60 flex-shrink-0">
                      <Wallet size={13} />
                    </div>
                  </div>
                  <p className="text-sm sm:text-base font-black text-amber-400 tracking-tight truncate" title={`A Receber: R$ ${totalPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                    R$ {totalPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* 6. Caixa Líquido */}
                <div className={`p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-all shadow-sm min-w-0 ${saldo >= 0 ? 'bg-emerald-950/60 border-emerald-900' : 'bg-red-950/60 border-red-900'}`}>
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider truncate">Caixa Líquido</span>
                    <div className="p-1 bg-white/10 rounded-lg text-white border border-white/15 flex-shrink-0">
                      <DollarSign size={13} />
                    </div>
                  </div>
                  <p className="text-sm sm:text-base font-black text-white tracking-tight truncate" title={`Caixa Líquido: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                    R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ESTATÍSTICA DE GANHOS POR DIA DO MÊS (FECHADO POR PADRÃO) */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <button 
              type="button"
              onClick={() => setGraficoDiarioAberto(!graficoDiarioAberto)} 
              className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-none outline-none cursor-pointer border-b border-gray-800"
            >
              <div className="flex items-center gap-2">
                <LineChartIcon size={18} className="text-emerald-400"/>
                <h3 className="text-xs font-black text-gray-200 uppercase tracking-wider">
                  Gráfico
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-emerald-400 hidden sm:inline">
                  R$ {resumoGanhosDiarios.totalGanhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {graficoDiarioAberto ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
              </div>
            </button>

            {graficoDiarioAberto && (
              <div className="p-4 sm:p-5 animate-in slide-in-from-top duration-200 bg-gray-900">
                {/* Gráfico Recharts de Ganhos Diários */}
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosGanhosDiarios} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="dia" stroke="#4b5563" tick={renderCustomXAxisTick} tickLine={false} interval={0} />
                      <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `R$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                                <p className="font-black text-white uppercase border-b border-gray-800 pb-1 mb-1">
                                  Dia {data.dia} de {mesesNome[mesAtivo - 1]}
                                </p>
                                <p className="text-emerald-400 font-bold">
                                  Ganhos (Receita): R$ {data.ganhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                {data.despesas > 0 && (
                                  <p className="text-red-400 font-bold">
                                    Despesas: R$ {data.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                )}
                                <p className="text-gray-400 text-[10px]">
                                  {data.qtdVendas} {data.qtdVendas === 1 ? 'venda realizada' : 'vendas realizadas'}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="ganhos" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* HISTÓRICO FINANCEIRO */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
              <h3 className="font-black text-gray-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <Receipt size={16} className="text-emerald-400"/> Lançamentos do Período
              </h3>
              
              <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end gap-2">
                {/* Filtros em linha */}
                <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-md border border-gray-800">
                   <button onClick={() => setFiltroAtivo('Tudo')} className={`p-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${filtroAtivo === 'Tudo' ? 'bg-gray-800 text-white' : 'bg-transparent text-gray-500 hover:text-gray-400'}`} title="Todos"><Filter size={16} /></button>
                   <button onClick={() => setFiltroAtivo('Entrada')} className={`p-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${filtroAtivo === 'Entrada' ? 'bg-emerald-600 text-white' : 'bg-transparent text-emerald-500 hover:text-emerald-400'}`} title="Receitas"><ArrowUpRight size={16} /></button>
                   <button onClick={() => setFiltroAtivo('Saida')} className={`p-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${filtroAtivo === 'Saida' ? 'bg-red-600 text-white' : 'bg-transparent text-red-500 hover:text-red-400'}`} title="Despesas"><ArrowDownRight size={16} /></button>
                   <button onClick={() => setFiltroAtivo('Pendente')} className={`p-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${filtroAtivo === 'Pendente' ? 'bg-amber-500 text-white' : 'bg-transparent text-amber-500 hover:text-amber-400'}`} title="Pendentes"><Wallet size={16} /></button>
                </div>

                {/* Botão Exportar PDF ao lado no mobile e com texto no desktop */}
                <button onClick={handleExportarMensalPDF} className="flex-shrink-0 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-black p-2 md:py-2 md:px-4 rounded-md transition-all text-xs border border-gray-700 cursor-pointer" title="Exportar PDF">
                  <FileDown size={18} />
                  <span className="hidden md:inline">Exportar PDF</span>
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {carregando ? (
                <LoadingProgress message="Carregando lançamentos..." compact />
              ) : transacoesAgrupadasPorDia.length === 0 ? (
                <div className="bg-gray-900 p-12 rounded-lg border border-dashed border-gray-800 text-center">
                  <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Nenhum lançamento encontrado.</p>
                </div>
              ) : (
                transacoesAgrupadasPorDia.map(grupo => (
                  <div key={grupo.chaveDia} className="relative md:grid md:grid-cols-[135px_1fr] gap-4 lg:gap-5 items-start pt-2">
                    
                    {/* RÉGUA GUIA VERTICAL (DESKTOP) */}
                    <div className="hidden md:flex flex-col sticky top-20 select-none">
                      <div className="relative bg-gray-900 border border-gray-800/90 rounded-2xl p-3 flex flex-col items-center shadow-md hover:border-gray-700 transition-all overflow-hidden text-center gap-1.5">
                        {/* Linha guia de destaque suave */}
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-emerald-600 to-transparent" />
                        
                        {/* TERÇA */}
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                          {grupo.diaSemanaCompleto}
                        </span>

                        {/* 03 */}
                        <span className="text-3xl font-black text-white tracking-tight leading-none my-0.5">
                          {grupo.diaNum}
                        </span>

                        {/* PILULA TOTAL DE PEDIDOS */}
                        <div className="w-full bg-gray-800/80 border border-gray-700/70 text-gray-200 text-[11px] font-black py-1 px-2 rounded-lg flex items-center justify-center gap-1 shadow-sm">
                          <span>{grupo.qtdVendas}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{grupo.qtdVendas === 1 ? 'pedido' : 'pedidos'}</span>
                        </div>

                        {/* PILULA DO TOTAL DE ENTRADA */}
                        <div className="w-full bg-emerald-950/70 border border-emerald-900/80 text-emerald-400 text-[11px] font-black py-1.5 px-2 rounded-lg shadow-sm truncate" title={`Total de Entradas: R$ ${grupo.totalReceitaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                          R$ {grupo.totalReceitaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>

                        {/* PILULA DO TOTAL DE SAIDA */}
                        <div className={`w-full text-[11px] font-black py-1.5 px-2 rounded-lg shadow-sm truncate ${grupo.totalDespesaDia > 0 ? 'bg-red-950/60 border border-red-900/60 text-red-400' : 'bg-gray-950/60 border border-gray-800/60 text-gray-500'}`} title={`Total de Saídas: R$ ${grupo.totalDespesaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                          {grupo.totalDespesaDia > 0 ? `-R$ ${grupo.totalDespesaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                        </div>
                      </div>
                    </div>

                    {/* RÉGUA GUIA MOBILE (COMPACTA) */}
                    <div className="md:hidden flex items-center justify-between gap-2 p-2.5 bg-gray-900 border border-gray-800 rounded-xl mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Card com o dia destacado em tom mais claro */}
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 flex items-center justify-center font-black text-base flex-shrink-0 shadow-sm">
                          {grupo.diaNum}
                        </div>
                        <span className="text-xs font-black uppercase text-gray-100 tracking-tight truncate">
                          {grupo.diaSemanaCompleto}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Pílula com o número de pedidos antes dos valores */}
                        <span className="bg-gray-800 border border-gray-700 text-gray-300 text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm" title={`${grupo.qtdVendas} pedidos`}>
                          <span>{grupo.qtdVendas}</span>
                          <span className="text-[9px] text-gray-400 font-bold">{grupo.qtdVendas === 1 ? 'ped' : 'peds'}</span>
                        </span>

                        {/* Valor das vendas do dia */}
                        <span className="bg-emerald-950/70 border border-emerald-900/70 text-emerald-400 text-[11px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                          R$ {grupo.totalReceitaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>

                        {/* Saídas do dia se houver */}
                        {grupo.totalDespesaDia > 0 && (
                          <span className="bg-red-950/60 border border-red-900/60 text-red-400 text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">
                            -R$ {grupo.totalDespesaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* LANÇAMENTOS DO DIA */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {grupo.itens.map(t => {
                        const isEntrada = t.tipo === 'Entrada';
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
                          <div key={t.id} className="bg-gray-900 rounded-xl border border-gray-800/90 overflow-hidden hover:border-gray-700 transition-all shadow-sm">
                            <button onClick={() => setItemAberto(itemAberto === t.id ? null : t.id)} className="w-full flex items-center justify-between p-3.5 bg-transparent border-none cursor-pointer outline-none text-left">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${isEntrada ? 'bg-emerald-950/40 border-emerald-900 text-emerald-400' : 'bg-red-950/40 border-red-900 text-red-400'}`} title={t.metodoPagamento}>
                                  {t.metodoPagamento === 'Pix' ? <QrCode size={15} /> : t.metodoPagamento === 'Cartão' ? <CreditCard size={15} /> : <Coins size={15} />}
                                </div>
                                <div className="flex flex-col min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-black text-gray-200 uppercase tracking-tight truncate">
                                      {isEntrada ? (t.cliente?.nome || "Venda Avulsa") : (t.fornecedor?.nome || "Gasto Geral")}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400">
                                      • {formatarHora(t.data)}
                                    </span>
                                  </div>
                                  {textoResumoItens && (
                                    <span className="text-[10px] font-bold text-gray-400 truncate mt-0.5">
                                      {textoResumoItens}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                {Boolean(t.desconto && t.desconto > 0) && (
                                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded" title="Desconto concedido">
                                    Desc: -R$ {(t.desconto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                                <span className={`text-sm font-black tracking-tight ${t.status === 'Pendente' ? 'text-amber-400' : isEntrada ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                {itemAberto === t.id ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
                              </div>
                            </button>

                            {itemAberto === t.id && (
                              <div className="px-4 pb-4 pt-1 space-y-4 animate-in slide-in-from-top duration-200 bg-gray-950/20 border-t border-gray-800/60">
                                {Boolean(t.desconto && t.desconto > 0) && (
                                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-gray-950/60 rounded-md border border-amber-900/40 text-xs">
                                    <span className="text-gray-400 font-medium">
                                      Subtotal Bruto: <strong className="text-gray-200 font-bold">R$ {(t.valor + (t.desconto || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </span>
                                    <span className="text-amber-400 font-black">
                                      Desconto: -R$ {(t.desconto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-emerald-400 font-black">
                                      Total Cobrado: R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                                <div className="p-3 bg-gray-950/50 rounded-md border border-gray-800">
                                  {itensExibicao.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {itensExibicao.map((it, idx) => (
                                        <span key={idx} className="bg-gray-900 border border-gray-800 px-2.5 py-1 rounded text-xs font-bold text-gray-200 flex items-center gap-1.5 shadow-sm">
                                          <span className={`font-black text-xs ${isEntrada ? 'text-emerald-400' : 'text-red-400'}`}>{it.quantidade}x</span>
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
                                    <button onClick={() => handleAlternarStatus(t)} className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border cursor-pointer transition-colors ${t.status === 'Pago' ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400 hover:bg-emerald-900/50' : 'bg-amber-950/50 border-amber-900 text-amber-400 hover:bg-amber-900/50'}`}>
                                      <CheckCircle2 size={10}/> {t.status}
                                    </button>
                                    <button onClick={() => handleAlternarMetodo(t)} className="bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer hover:bg-gray-800 transition-colors text-[9px] font-black uppercase text-gray-400">
                                      <Tag size={10} className="text-gray-500"/>{t.metodoPagamento}
                                    </button>
                                  </div>
                                  <div className="flex gap-1">
                                    {(t.clienteId || t.fornecedorId) && (
                                      <Link to={isEntrada ? `/clientes/${t.clienteId}` : `/fornecedores/${t.fornecedorId}`} className={`p-2 rounded-md border transition-all flex items-center justify-center ${isEntrada ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900 hover:bg-emerald-900/30' : 'text-red-400 bg-red-950/40 border-red-900 hover:bg-red-900/30'}`}>
                                        <User size={14}/>
                                      </Link>
                                    )}
                                    <button onClick={() => abrirEdicao(t)} className={`p-2 rounded-md border border-gray-800 transition-all cursor-pointer flex items-center justify-center ${isEntrada ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900' : 'text-red-400 bg-red-950/40 border-red-900'}`}><Edit3 size={14}/></button>
                                    <button onClick={() => handleDelete(t.id)} className="p-2 text-red-400 bg-red-950/40 border border-red-900 rounded-md cursor-pointer hover:bg-red-900/30 transition-all flex items-center justify-center"><Trash2 size={14}/></button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-gray-900 w-full md:max-w-xl h-[95vh] md:h-auto md:max-h-[95vh] rounded-t-lg md:rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-800 animate-in slide-in-from-bottom md:zoom-in duration-250">
            <div className="bg-gray-950 px-6 py-4 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2"><Edit3 size={18} className="text-emerald-400"/><h3 className="text-xs font-black text-gray-200 uppercase tracking-widest">Ajustar Transação</h3></div>
              <button onClick={() => setEditando(null)} className="text-gray-500 hover:text-red-400 bg-transparent border-none cursor-pointer p-1"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-6 overflow-y-auto flex-1 pb-20 md:pb-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Itens da Transação</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input placeholder="Item..." className="flex-1 p-3 bg-gray-950 border border-gray-800 rounded-md outline-none text-xs font-medium focus:border-emerald-600 text-white" value={novoItemEdicao.nome} onChange={e => setNovoItemEdicao({...novoItemEdicao, nome: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdicionarItemEdicao(); } }} />
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
                    <button type="button" onClick={handleAdicionarItemEdicao} className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 rounded-md border border-emerald-800 cursor-pointer transition-colors"><Plus size={16}/></button>
                  </div>
                  <div className="min-h-[80px] p-3 bg-gray-950 rounded-md border border-gray-800 flex flex-wrap gap-1.5">
                    {editando.itens.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-md">
                        <span className="text-emerald-400 font-black text-[10px]">{Math.max(1, it.quantidade || 1)}x</span><span className="text-gray-300 text-[10px] font-bold">{it.nome}</span>
                        <button onClick={() => setEditando({...editando, itens: editando.itens.filter((_, i) => i !== idx)})} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"><X size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1"><label className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase ml-1"><DollarSign size={10}/> Valor Final R$</label><input type="number" step="0.01" className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md font-black text-emerald-400 outline-none text-sm focus:border-emerald-600" value={editando.valor} onChange={e => setEditando({...editando, valor: Number(e.target.value)})} /></div>
                <div className="space-y-1"><label className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase ml-1"><Tag size={10}/> Desconto R$</label><input type="number" step="0.01" placeholder="0,00" className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md font-black text-amber-400 outline-none text-sm focus:border-amber-600" value={editando.desconto ?? ''} onChange={e => setEditando({...editando, desconto: e.target.value === '' ? 0 : Number(e.target.value)})} /></div>
                <div className="space-y-1"><label className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase ml-1"><HandCoins size={10}/> Método</label><select className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-300 outline-none text-xs focus:border-emerald-600" value={editando.metodoPagamento} onChange={e => setEditando({...editando, metodoPagamento: e.target.value})}><option value="Pix">Pix</option><option value="Dinheiro">Dinheiro</option><option value="Cartão">Cartão</option></select></div>
                <div className="space-y-1"><label className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase ml-1"><CalendarDays size={10}/> Data</label><input type="date" className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-300 outline-none text-sm focus:border-emerald-600" value={editando.data.split('T')[0]} onChange={e => setEditando({...editando, data: e.target.value})} /></div>
                <div className="space-y-1"><label className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase ml-1"><CheckCircle2 size={10}/> Status</label><select className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-300 outline-none text-xs focus:border-emerald-600" value={editando.status} onChange={e => setEditando({...editando, status: e.target.value})}><option value="Pago">✅ Pago</option><option value="Pendente">⏳ Pendente</option></select></div>
              </div>
              <button onClick={handleUpdateTransacao} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-md font-black uppercase text-xs tracking-wider border border-emerald-700 cursor-pointer transition-colors active:scale-95 mb-4">Salvar Alterações <Save size={14} className="inline ml-1" /></button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}