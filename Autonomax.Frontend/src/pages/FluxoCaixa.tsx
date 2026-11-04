import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Trash2, CalendarDays, X, Receipt, ChevronLeft, 
  ChevronRight, CheckCircle2, FileDown,
  ChevronDown, ChevronUp, Edit3, Save, Tag,
  BarChart3, User, DollarSign, HandCoins, Plus, PackagePlus, Target, Wallet, ArrowUpRight, ArrowDownRight,
  Filter, Coins, QrCode, CreditCard, LineChart as LineChartIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { LoadingProgress } from '../components/LoadingProgress';

interface Item { nome: string; quantidade: number; }
interface Cliente { id: number; nome: string; }
interface Fornecedor { id: number; nome: string; }
interface ProdutoServico { id: number; nome: string; preco: number; ehServico: boolean; }
interface ItemTemporario { item: string; qtd: number; precoUnitario?: number; }

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
  
  const [resumoAberto, setResumoAberto] = useState(false); 
  const [graficoDiarioAberto, setGraficoDiarioAberto] = useState(false);
  const [itemAberto, setItemAberto] = useState<number | null>(null);
  
  const [filtroAtivo, setFiltroAtivo] = useState<'Tudo' | 'Entrada' | 'Saida' | 'Pendente'>('Tudo');

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtosServicos, setProdutosServicos] = useState<ProdutoServico[]>([]);
  
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Transacao | null>(null);
  const [novoItemEdicao, setNovoItemEdicao] = useState<{ nome: string; qtd: number | string }>({ nome: '', qtd: 1 });

  const [itensTemporarios, setItensTemporarios] = useState<ItemTemporario[]>([]);
  const [novoItem, setNovoItem] = useState<{ item: string; qtd: number | string; precoUnitario: string }>({ item: '', qtd: 1, precoUnitario: '' });
  const [itemCatalogoId, setItemCatalogoId] = useState<string>('');
  
  const [novaTransacao, setNovaTransacao] = useState({
    valor: '', desconto: '', tipo: 'Entrada', status: 'Pago', metodoPagamento: 'Pix', clienteId: '', fornecedorId: '',
    data: new Date().toLocaleDateString('en-CA')
  });

  const subtotalItens = useMemo(() => {
    return itensTemporarios.reduce((acc, it) => acc + (it.qtd * (it.precoUnitario || 0)), 0);
  }, [itensTemporarios]);

  const handleValorChange = (valStr: string) => {
    const numValor = parseFloat(valStr);
    let novoDesconto = novaTransacao.desconto;

    if (subtotalItens > 0 && !isNaN(numValor)) {
      if (numValor < subtotalItens) {
        novoDesconto = (subtotalItens - numValor).toFixed(2);
      } else {
        novoDesconto = '0.00';
      }
    }

    setNovaTransacao(prev => ({
      ...prev,
      valor: valStr,
      desconto: novoDesconto
    }));
  };

  const handleDescontoChange = (descStr: string) => {
    const numDesc = parseFloat(descStr);

    if (subtotalItens > 0 && !isNaN(numDesc)) {
      const valorCalculado = Math.max(0, subtotalItens - numDesc);
      setNovaTransacao(prev => ({
        ...prev,
        desconto: descStr,
        valor: valorCalculado.toFixed(2)
      }));
    } else {
      setNovaTransacao(prev => ({
        ...prev,
        desconto: descStr
      }));
    }
  };

  const aplicarDescontoPercentual = (porcentagem: number) => {
    if (subtotalItens <= 0) return;
    const valorDesc = Number(((subtotalItens * porcentagem) / 100).toFixed(2));
    const valorFinal = Math.max(0, subtotalItens - valorDesc);
    setNovaTransacao(prev => ({
      ...prev,
      desconto: valorDesc.toFixed(2),
      valor: valorFinal.toFixed(2)
    }));
  };

  const mesesNome = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

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
      const [resTrans, resCli, resFor, resProd] = await Promise.allSettled([
        api.get(`/Transacoes/por-periodo/${negocioId}?mes=${mesAtivo}&ano=${anoAtivo}`),
        api.get(`/Clientes/por-negocio/${negocioId}`),
        api.get(`/Fornecedores/por-negocio/${negocioId}`),
        api.get(`/ProdutosServicos/por-negocio/${negocioId}`)
      ]);

      if (resTrans.status === 'fulfilled') {
        const transData = resTrans.value.data || [];
        const ordenadas = transData.sort((a: Transacao, b: Transacao) => 
          new Date(b.data).getTime() - new Date(a.data).getTime()
        );
        setTransacoes(ordenadas);
      } else {
        console.error("Erro ao carregar transações:", resTrans.reason);
      }

      if (resCli.status === 'fulfilled') {
        setClientes(resCli.value.data || []);
      }

      if (resFor.status === 'fulfilled') {
        setFornecedores(resFor.value.data || []);
      }

      if (resProd.status === 'fulfilled') {
        setProdutosServicos(resProd.value.data || []);
      }
    } catch (err) { 
      console.error("Erro ao carregar dados do dashboard:", err); 
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

  const handleSelecionarDoCatalogo = (idStr: string) => {
    setItemCatalogoId(idStr);
    if (!idStr) return;
    const prod = produtosServicos.find(p => p.id === Number(idStr));
    if (prod) {
      setNovoItem({
        item: prod.nome,
        qtd: 1,
        precoUnitario: String(prod.preco)
      });
    }
  };

  const handleAdicionarItem = () => {
    if (!novoItem.item.trim()) return;
    let itemNome = novoItem.item.trim();
    let qtdNum = Number(novoItem.qtd) || 1;
    
    // Detecta se usuário digitou prefixo de quantidade no nome (ex: "2x Cartaz" ou "2 Cartazes")
    const matchQtd = itemNome.match(/^\s*(\d{1,4})\s*(?:[xX*•\-]|un|unid|unidade|unidades|peças|pecas|pcs|pc)?\s*(.+)$/i);
    if (matchQtd && matchQtd[2]) {
      const qExtr = parseInt(matchQtd[1], 10);
      if (qExtr > 0) {
        qtdNum = Math.max(qtdNum, qExtr);
        itemNome = matchQtd[2].trim();
      }
    }
    itemNome = itemNome.replace(/^[\d\s*xX•\-_/]+/, '').trim() || itemNome;
    const precoNum = Number(novoItem.precoUnitario) || 0;

    const novosItens = [
      ...itensTemporarios, 
      { item: itemNome, qtd: Math.max(1, qtdNum), precoUnitario: precoNum }
    ];
    setItensTemporarios(novosItens);

    // Se houver preço unitário calculado, recalcula o valor total automaticamente
    const totalItens = novosItens.reduce((acc, it) => acc + (it.qtd * (it.precoUnitario || 0)), 0);
    if (totalItens > 0) {
      const descAtual = parseFloat(novaTransacao.desconto) || 0;
      const valorFinal = Math.max(0, totalItens - descAtual);
      setNovaTransacao(prev => ({ ...prev, valor: valorFinal.toFixed(2) }));
    }

    setNovoItem({ item: '', qtd: 1, precoUnitario: '' });
    setItemCatalogoId('');
  };

  const handleRemoverItem = (idxRemover: number) => {
    const atualizados = itensTemporarios.filter((_, i) => i !== idxRemover);
    setItensTemporarios(atualizados);
    const totalItens = atualizados.reduce((acc, it) => acc + (it.qtd * (it.precoUnitario || 0)), 0);
    if (totalItens > 0) {
      const descAtual = parseFloat(novaTransacao.desconto) || 0;
      const valorFinal = Math.max(0, totalItens - descAtual);
      setNovaTransacao(prev => ({ ...prev, valor: valorFinal.toFixed(2) }));
    } else if (atualizados.length === 0) {
      setNovaTransacao(prev => ({ ...prev, valor: '', desconto: '' }));
    }
  };

  async function handleAddTransacao() {
    if (itensTemporarios.length === 0) return alert("Adicione pelo menos um item.");
    if (!novaTransacao.valor) return alert("Informe o valor.");
    const agora = new Date();
    const horaStr = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}:${String(agora.getSeconds()).padStart(2, '0')}`;
    const dataAjustada = new Date(`${novaTransacao.data}T${horaStr}`);
    const itensFormatados = itensTemporarios.map(it => {
      const nomeLimpo = it.item.replace(/^[\d\s*xX•\-_/]+/, '').trim() || it.item;
      return {
        nome: nomeLimpo,
        quantidade: Math.max(1, it.qtd || 1)
      };
    });

    const payload = {
      descricao: itensFormatados.map(it => `${it.quantidade}x ${it.nome}`).join(', '),
      valor: Number(novaTransacao.valor), 
      desconto: Number(novaTransacao.desconto) || 0,
      tipo: novaTransacao.tipo,
      status: novaTransacao.status, 
      metodoPagamento: novaTransacao.metodoPagamento,
      negocioId: Number(negocioId), 
      clienteId: novaTransacao.tipo === 'Entrada' ? Number(novaTransacao.clienteId) || null : null,
      fornecedorId: novaTransacao.tipo === 'Saida' ? Number(novaTransacao.fornecedorId) || null : null,
      data: dataAjustada.toISOString(),
      itens: itensFormatados
    };
    try {
      await api.post('/Transacoes', payload);
      setItensTemporarios([]);
      setNovaTransacao({ ...novaTransacao, valor: '', desconto: '', clienteId: '', fornecedorId: '' });
      setFormAberto(false);
      carregarDados();
    } catch (err) { alert("Erro ao salvar."); }
  }

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

      return {
        chaveDia,
        diaNum: dd,
        diaSemanaCurto,
        diaSemanaCompleto: diaSemana,
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
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50 hidden md:flex">
                <CalendarDays size={22} />
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black tracking-tight uppercase text-gray-100 whitespace-nowrap">
                  {mesesNome[mesAtivo - 1]} <span className="text-emerald-400">{anoAtivo}</span>
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 w-full lg:w-auto justify-end">
              <button onClick={() => navegarPeriodo(-1)} className="p-2 hover:bg-gray-800 rounded-md transition-all text-gray-300 border border-gray-800 bg-gray-950 cursor-pointer"><ChevronLeft size={18} /></button>
              <button onClick={() => navegarPeriodo(1)} className="p-2 hover:bg-gray-800 rounded-md transition-all text-gray-300 border border-gray-800 bg-gray-950 cursor-pointer"><ChevronRight size={18} /></button>
            </div>
          </div>

          {/* PAINEL DE SALDOS */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <button onClick={() => setResumoAberto(!resumoAberto)} className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-none outline-none cursor-pointer border-b border-gray-800">
              <div className="flex items-center gap-2"><BarChart3 size={18} className="text-emerald-400"/><h3 className="text-xs font-black text-gray-200 uppercase tracking-wider">Painel de Saldos</h3></div>
              {resumoAberto ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
            </button>
            {resumoAberto && (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-in slide-in-from-top duration-200 bg-gray-900">
                <div className="p-4 rounded-md border border-gray-800 flex items-center gap-3.5 bg-gray-950/30">
                  <div className="p-2.5 bg-emerald-950/50 text-emerald-400 rounded-md border border-emerald-900/50"><ArrowUpRight size={20} /></div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Receitas</p>
                    <p className="text-base font-black text-emerald-400">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="p-4 rounded-md border border-gray-800 flex items-center gap-3.5 bg-gray-950/30">
                  <div className="p-2.5 bg-red-950/50 text-red-400 rounded-md border border-red-900/50"><ArrowDownRight size={20} /></div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Despesas</p>
                    <p className="text-base font-black text-red-400">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="p-4 rounded-md border border-gray-800 flex items-center gap-3.5 bg-gray-950/30">
                  <div className="p-2.5 bg-amber-950/50 text-amber-400 rounded-md border border-amber-900/50"><Wallet size={20} /></div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">A Receber</p>
                    <p className="text-base font-black text-amber-400">R$ {totalPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className={`p-4 rounded-md border flex items-center gap-3.5 text-white ${saldo >= 0 ? 'bg-emerald-950 border-emerald-900' : 'bg-red-950 border-red-900'}`}>
                  <div className="p-2.5 bg-white/10 rounded-md text-white border border-white/10"><DollarSign size={20} /></div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Caixa Líquido</p>
                    <p className="text-base font-black">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
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
                  Ganhos por Dia ({mesesNome[mesAtivo - 1]})
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
              <div className="p-5 space-y-4 animate-in slide-in-from-top duration-200 bg-gray-900">
                {/* KPIs resumo rápido no topo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-md border border-gray-800 bg-gray-950/40">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Melhor Dia de Ganhos</p>
                    <p className="text-base font-black text-emerald-400">
                      {resumoGanhosDiarios.melhorDia?.ganhos > 0 ? (
                        <>Dia {resumoGanhosDiarios.melhorDia.dia} <span className="text-xs font-medium text-gray-300">(R$ {resumoGanhosDiarios.melhorDia.ganhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span></>
                      ) : 'Sem vendas no mês'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-md border border-gray-800 bg-gray-950/40">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Média Diária de Ganhos</p>
                    <p className="text-base font-black text-white">
                      R$ {resumoGanhosDiarios.mediaDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / dia
                    </p>
                  </div>

                  <div className="p-3.5 rounded-md border border-gray-800 bg-gray-950/40">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total de Receitas do Mês</p>
                    <p className="text-base font-black text-emerald-400">
                      R$ {resumoGanhosDiarios.totalGanhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Gráfico Recharts de Ganhos Diários */}
                <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosGanhosDiarios} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="dia" stroke="#6b7280" fontSize={10} tickLine={false} />
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

          {/* NOVO LANÇAMENTO */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <button onClick={() => setFormAberto(!formAberto)} className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-none outline-none cursor-pointer border-b border-gray-800">
              <div className="flex items-center gap-2"><PackagePlus size={18} className="text-emerald-400"/><h3 className="text-xs font-black text-gray-200 uppercase tracking-wider">Novo Lançamento</h3></div>
              {formAberto ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
            </button>
            
            {formAberto && (
              <div className="p-5 md:p-6 space-y-4 bg-gray-900">
                
                {/* SELETOR PRINCIPAL DE TIPO: RECEITA VS DESPESA */}
                <div className="bg-gray-950 p-1.5 rounded-lg flex gap-1.5 border border-gray-800">
                  <button 
                    type="button" 
                    onClick={() => setNovaTransacao({ ...novaTransacao, tipo: 'Entrada' })} 
                    className={`flex-1 py-2.5 rounded-md font-black text-xs uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${novaTransacao.tipo === 'Entrada' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}
                  >
                    <ArrowUpRight size={15} /> Receita / Venda
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNovaTransacao({ ...novaTransacao, tipo: 'Saida' })} 
                    className={`flex-1 py-2.5 rounded-md font-black text-xs uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${novaTransacao.tipo === 'Saida' ? 'bg-red-600 text-white shadow-md shadow-red-950' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}
                  >
                    <ArrowDownRight size={15} /> Despesa / Saída
                  </button>
                </div>

                {/* ENTRADA DOS PRODUTOS / SELEÇÃO DO CATÁLOGO */}
                <div className="space-y-2">
                  {novaTransacao.tipo === 'Entrada' && produtosServicos.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select 
                        value={itemCatalogoId} 
                        onChange={e => handleSelecionarDoCatalogo(e.target.value)}
                        className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-300 outline-none text-xs focus:border-emerald-600 cursor-pointer"
                      >
                        <option value="">⚡ Selecionar do Catálogo de Produtos/Serviços (Preço automático)...</option>
                        {produtosServicos.map(ps => (
                          <option key={ps.id} value={ps.id}>
                            {ps.ehServico ? '🛠️ [Serviço]' : '📦 [Produto]'} {ps.nome} — R$ {Number(ps.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-2">
                    <input 
                      placeholder={novaTransacao.tipo === 'Entrada' ? "Descreva o produto ou serviço vendido..." : "Descreva a despesa ou insumo comprado..."} 
                      className={`flex-1 p-3 bg-gray-950 border border-gray-800 rounded-md outline-none text-white font-medium text-sm transition-all placeholder-gray-600 ${novaTransacao.tipo === 'Entrada' ? 'focus:border-emerald-500' : 'focus:border-red-500'}`} 
                      value={novoItem.item} 
                      onChange={e => { setNovoItem({...novoItem, item: e.target.value}); setItemCatalogoId(''); }} 
                    />
                    <div className="flex gap-2 w-full md:w-auto">
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="R$ Unit." 
                        className="w-24 sm:w-28 p-3 bg-gray-950 border border-gray-800 rounded-md text-center font-bold text-sm text-emerald-400 outline-none focus:border-emerald-500 placeholder-gray-600" 
                        value={novoItem.precoUnitario} 
                        onChange={e => setNovoItem({...novoItem, precoUnitario: e.target.value})} 
                        title="Preço unitário (opcional, calcula total automático)"
                      />
                      <input 
                        type="number" 
                        min="1"
                        className="w-16 p-3 bg-gray-950 border border-gray-800 rounded-md text-center font-black text-sm text-white outline-none focus:border-emerald-500" 
                        value={novoItem.qtd} 
                        onChange={e => {
                          const val = e.target.value;
                          setNovoItem(prev => ({
                            ...prev,
                            qtd: val === '' ? '' : (parseInt(val, 10) || '')
                          }));
                        }} 
                        onBlur={() => {
                          if (novoItem.qtd === '' || Number(novoItem.qtd) < 1) {
                            setNovoItem(prev => ({ ...prev, qtd: 1 }));
                          }
                        }}
                        title="Quantidade"
                      />
                      <button 
                        type="button"
                        onClick={handleAdicionarItem} 
                        className={`text-white px-4 rounded-md border cursor-pointer flex items-center justify-center transition-all ${novaTransacao.tipo === 'Entrada' ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-800' : 'bg-red-700 hover:bg-red-600 border-red-800'}`}
                        title="Adicionar item"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ITENS TEMPORÁRIOS COM VALORES */}
                {itensTemporarios.length > 0 && (
                  <div className="p-3 bg-gray-950/50 rounded-md border border-gray-800 flex flex-wrap gap-2 items-center">
                    {itensTemporarios.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1 rounded-md">
                        <span className={`font-black text-xs ${novaTransacao.tipo === 'Entrada' ? 'text-emerald-400' : 'text-red-400'}`}>{it.qtd}x</span>
                        <span className="text-gray-300 text-xs font-medium">{it.item}</span>
                        {Boolean(it.precoUnitario && it.precoUnitario > 0) && (
                          <span className={`text-[10px] font-bold bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800 ${novaTransacao.tipo === 'Entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                            R$ {(it.qtd * it.precoUnitario!).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        <button 
                          type="button"
                          onClick={() => handleRemoverItem(idx)} 
                          className="text-gray-500 hover:text-red-400 border-none bg-transparent cursor-pointer p-0.5"
                          title="Remover item"
                        >
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* RESUMO DE SUBTOTAL E DESCONTOS */}
                {subtotalItens > 0 && (
                  <div className="p-2.5 bg-gray-950/70 border border-gray-800 rounded-md flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-gray-400 font-bold">
                        Subtotal dos Itens: <strong className="text-gray-200 font-black">R$ {subtotalItens.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </span>
                      {Number(novaTransacao.desconto) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <Tag size={11} />
                          Desconto: R$ {Number(novaTransacao.desconto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {' '}({((Number(novaTransacao.desconto) / subtotalItens) * 100).toFixed(1)}% OFF)
                        </span>
                      )}
                    </div>
                    {/* Atalhos de Desconto rápido */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase mr-1">Desconto rápido:</span>
                      {[5, 10, 15, 20].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => aplicarDescontoPercentual(pct)}
                          className="px-2 py-0.5 bg-gray-900 hover:bg-gray-800 border border-gray-700/70 rounded text-[10px] font-black text-amber-300 transition-colors"
                          title={`Aplicar ${pct}% de desconto`}
                        >
                          {pct}%
                        </button>
                      ))}
                      {Number(novaTransacao.desconto) > 0 && (
                        <button
                          type="button"
                          onClick={() => handleDescontoChange('0.00')}
                          className="px-2 py-0.5 bg-gray-900 hover:bg-red-950/40 border border-gray-800 hover:border-red-800 rounded text-[10px] font-black text-gray-400 hover:text-red-400 transition-colors"
                          title="Remover desconto"
                        >
                          Zerar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* CONTROLADORES COMPACTOS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                  
                  <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* Toggle de Status */}
                    <div className="bg-gray-950 p-1 rounded-md flex gap-1 border border-gray-800">
                      <button type="button" onClick={() => setNovaTransacao({ ...novaTransacao, status: 'Pago' })} className={`flex-1 py-2 rounded-md font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${novaTransacao.status === 'Pago' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-500 hover:text-gray-400'}`}>Pago</button>
                      <button type="button" onClick={() => setNovaTransacao({ ...novaTransacao, status: 'Pendente' })} className={`flex-1 py-2 rounded-md font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${novaTransacao.status === 'Pendente' ? 'bg-amber-500 text-white' : 'bg-transparent text-gray-500 hover:text-gray-400'}`}>Pendente</button>
                    </div>

                    {/* Toggle de Métodos */}
                    <div className="bg-gray-950 p-1 rounded-md flex gap-1 border border-gray-800">
                      <button type="button" onClick={() => setNovaTransacao({ ...novaTransacao, metodoPagamento: 'Pix' })} className={`flex-1 py-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${novaTransacao.metodoPagamento === 'Pix' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-transparent text-gray-500'}`}><QrCode size={14} /></button>
                      <button type="button" onClick={() => setNovaTransacao({ ...novaTransacao, metodoPagamento: 'Dinheiro' })} className={`flex-1 py-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${novaTransacao.metodoPagamento === 'Dinheiro' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-transparent text-gray-500'}`}><Coins size={14} /></button>
                      <button type="button" onClick={() => setNovaTransacao({ ...novaTransacao, metodoPagamento: 'Cartão' })} className={`flex-1 py-2 rounded-md transition-all border-none cursor-pointer flex items-center justify-center ${novaTransacao.metodoPagamento === 'Cartão' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-transparent text-gray-500'}`}><CreditCard size={14} /></button>
                    </div>
                  </div>

                  {/* Inputs de Dados */}
                  <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="Valor Final R$" 
                      className={`w-full p-2.5 bg-gray-950 border rounded-md font-black outline-none text-sm text-center placeholder-gray-700 ${novaTransacao.tipo === 'Entrada' ? 'text-emerald-400 border-gray-800 focus:border-emerald-600' : 'text-red-400 border-gray-800 focus:border-red-600'}`} 
                      value={novaTransacao.valor} 
                      onChange={e => handleValorChange(e.target.value)} 
                      title="Valor cobrado do cliente (já com desconto)"
                    />
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="Desconto R$" 
                      className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-md font-bold text-amber-400 outline-none text-sm text-center focus:border-amber-600 placeholder-gray-700" 
                      value={novaTransacao.desconto} 
                      onChange={e => handleDescontoChange(e.target.value)} 
                      title="Desconto concedido (calculado automaticamente ou manual)"
                    />
                    <input type="date" className="p-2.5 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-300 outline-none text-sm text-center focus:border-emerald-600" value={novaTransacao.data} onChange={e => setNovaTransacao({...novaTransacao, data: e.target.value})} />
                    
                    {novaTransacao.tipo === 'Entrada' ? (
                      <select className="p-2.5 bg-gray-950 border border-gray-800 rounded-md font-bold text-gray-400 outline-none text-xs focus:border-emerald-600 truncate" value={novaTransacao.clienteId} onChange={e => setNovaTransacao({...novaTransacao, clienteId: e.target.value})}>
                        <option value="">Sem Cliente</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    ) : (
                      <select className="p-2.5 bg-gray-950 border border-gray-800 text-red-400 rounded-md font-bold outline-none text-xs focus:border-red-600 truncate" value={novaTransacao.fornecedorId} onChange={e => setNovaTransacao({...novaTransacao, fornecedorId: e.target.value})}>
                        <option value="">Sem Fornecedor</option>
                        {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                      </select>
                    )}
                  </div>

                </div>

                <button 
                  onClick={handleAddTransacao} 
                  className={`w-full py-3.5 rounded-md font-black uppercase tracking-wider text-xs border cursor-pointer flex items-center justify-center gap-2 transition-all ${novaTransacao.tipo === 'Entrada' ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700' : 'bg-red-600 hover:bg-red-500 text-white border-red-700'}`}
                >
                  {novaTransacao.tipo === 'Entrada' ? 'Salvar Receita' : 'Salvar Despesa'} <Target size={14} />
                </button>

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
                      <div className="relative bg-gray-900 border border-gray-800/90 rounded-2xl p-3 flex flex-col shadow-md hover:border-gray-700 transition-all overflow-hidden">
                        {/* Linha guia de destaque suave */}
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-emerald-600 to-transparent" />
                        
                        {/* Topo do dia */}
                        <div className="flex items-baseline justify-between pl-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                            {grupo.diaSemanaCurto}
                          </span>
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                            {grupo.mesAno}
                          </span>
                        </div>

                        {/* Número grande do dia */}
                        <div className="flex items-center gap-1.5 my-0.5 pl-1">
                          <span className="text-3xl font-black text-white tracking-tight">
                            {grupo.diaNum}
                          </span>
                        </div>

                        {/* Dados consolidados do dia na régua */}
                        <div className="pt-2 border-t border-gray-800/80 flex flex-col gap-1.5 text-[10px] pl-1">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">Vendas</span>
                            <span className="font-black text-emerald-400 text-xs truncate" title={`Receita do dia: R$ ${grupo.totalReceitaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                              R$ {grupo.totalReceitaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-gray-400 font-bold bg-gray-950/60 px-2 py-1 rounded border border-gray-800/50">
                            <span className="text-[9px] text-gray-400">Pedidos</span>
                            <span className="text-gray-200 font-black text-xs">{grupo.qtdVendas}</span>
                          </div>

                          {grupo.totalDespesaDia > 0 && (
                            <div className="flex flex-col pt-1 border-t border-gray-800/50">
                              <span className="text-[8px] font-bold uppercase tracking-wider text-red-400/80">Saídas</span>
                              <span className="font-black text-red-400 text-xs truncate" title={`Despesas do dia: R$ ${grupo.totalDespesaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                                -R$ {grupo.totalDespesaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RÉGUA GUIA MOBILE (COMPACTA) */}
                    <div className="md:hidden flex items-center justify-between gap-2 p-2.5 bg-gray-900 border border-gray-800 rounded-xl mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-900/60 flex items-center justify-center font-black text-sm text-emerald-400 flex-shrink-0">
                          {grupo.diaNum}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black uppercase text-gray-200 truncate">
                            {grupo.diaSemanaCompleto}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase">
                            {grupo.diaNum}/{grupo.mesAno} • {grupo.qtdVendas} {grupo.qtdVendas === 1 ? 'pedido' : 'pedidos'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 text-[11px] font-black px-2.5 py-1 rounded-lg">
                          R$ {grupo.totalReceitaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {grupo.totalDespesaDia > 0 && (
                          <span className="bg-red-950/60 border border-red-900/60 text-red-400 text-[10px] font-black px-2 py-1 rounded-lg">
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