import { useState, useMemo, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { 
  Target, Search, MapPin, Phone, MessageSquare, 
  CheckCircle2, Download, ExternalLink, Star, 
  Sparkles, RefreshCw, AlertCircle, X,
  CheckSquare, Square, KeyRound, Globe2,
  ListFilter, UserCheck, Trash2, Image as ImageIcon, Upload
} from 'lucide-react';
import api from '../services/api';

export interface LeadComercio {
  id: string;
  nome: string;
  telefone: string;
  celularFormatado?: string;
  endereco: string;
  bairro?: string;
  cidade: string;
  estado: string;
  avaliacao?: number;
  totalAvaliacoes?: number;
  categoria?: string;
  site?: string;
  googleMapsUrl?: string;
  origem?: string;
  salvoTriagem?: boolean;
}

export interface LeadTriagemItem {
  id: number;
  nome: string;
  telefone?: string;
  endereco?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  categoria?: string;
  googleMapsUrl?: string;
  site?: string;
  origem: string;
  avaliacao?: number;
  totalAvaliacoes?: number;
  status: 'Novo' | 'Contatado' | 'Negociando' | 'SemInteresse' | 'Convertido';
  observacoes?: string;
  dataCaptura: string;
  dataUltimoContato?: string;
  negocioId: number;
}

export function RadarClientes() {
  const currentNegocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  // Controle de Abas
  const [abaAtiva, setAbaAtiva] = useState<'busca' | 'triagem'>('busca');

  // Estados da Busca
  const [cidade, setCidade] = useState('');
  const [segmento, setSegmento] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [leads, setLeads] = useState<LeadComercio[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  // Estados de Notificação
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Chave Google Places API (opcional)
  const [googleApiKey, setGoogleApiKey] = useState(() => {
    return localStorage.getItem('@Autonomax:googlePlacesApiKey') || '';
  });
  const [modalChaveGoogleAberto, setModalChaveGoogleAberto] = useState(false);
  const [chaveInput, setChaveInput] = useState('');

  // Estados da Triagem
  const [leadsTriagem, setLeadsTriagem] = useState<LeadTriagemItem[]>([]);
  const [carregandoTriagem, setCarregandoTriagem] = useState(false);
  const [filtroStatusTriagem, setFiltroStatusTriagem] = useState<string>('Todos');
  const [termoBuscaTriagem, setTermoBuscaTriagem] = useState('');

  // Template da Mensagem e Imagem do WhatsApp
  const [modalMensagemAberto, setModalMensagemAberto] = useState(false);
  const [templateMensagem, setTemplateMensagem] = useState(
    'Olá! Localizei seu comércio e gostaria de apresentar como podemos colaborar com soluções para o seu negócio.'
  );
  const [imagemWhatsapp, setImagemWhatsapp] = useState<string | null>(() => {
    return localStorage.getItem('@Autonomax:radarWhatsappImage') || null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregarTriagem();
  }, [currentNegocioId]);

  async function carregarTriagem() {
    if (!currentNegocioId) return;
    try {
      setCarregandoTriagem(true);
      const res = await api.get(`/Prospeccao/triagem/${currentNegocioId}`);
      setLeadsTriagem(res.data || []);
    } catch (err) {
      console.error("Erro ao carregar triagem:", err);
    } finally {
      setCarregandoTriagem(false);
    }
  }

  const leadsFiltrados = useMemo(() => leads, [leads]);

  const totalComTelefone = useMemo(() => {
    return leads.filter(l => l.telefone && l.telefone.trim().length > 7).length;
  }, [leads]);

  const mediaAvaliacoes = useMemo(() => {
    const comNota = leads.filter(l => l.avaliacao && l.avaliacao > 0);
    if (!comNota.length) return 0;
    const soma = comNota.reduce((acc, curr) => acc + (curr.avaliacao || 0), 0);
    return Number((soma / comNota.length).toFixed(1));
  }, [leads]);

  const leadsTriagemFiltrados = useMemo(() => {
    return leadsTriagem.filter(item => {
      const matchStatus = filtroStatusTriagem === 'Todos' || item.status === filtroStatusTriagem;
      const matchTexto = !termoBuscaTriagem.trim() || 
        item.nome.toLowerCase().includes(termoBuscaTriagem.toLowerCase()) ||
        (item.telefone && item.telefone.includes(termoBuscaTriagem)) ||
        item.cidade.toLowerCase().includes(termoBuscaTriagem.toLowerCase()) ||
        (item.categoria && item.categoria.toLowerCase().includes(termoBuscaTriagem.toLowerCase()));
      return matchStatus && matchTexto;
    });
  }, [leadsTriagem, filtroStatusTriagem, termoBuscaTriagem]);

  // Contagem de leads em triagem ativos (não convertidos)
  const totalLeadsAtivos = useMemo(() => {
    return leadsTriagem.filter(l => l.status !== 'Convertido').length;
  }, [leadsTriagem]);

  async function handleBuscar(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!cidade.trim() || !segmento.trim()) {
      setMensagemErro('Preencha a cidade e o segmento para realizar a busca.');
      return;
    }

    setBuscando(true);
    setMensagemErro(null);
    setMensagemSucesso(null);
    setSelecionados([]);

    try {
      const response = await api.get('/Prospeccao/buscar', {
        params: {
          cidade: cidade.trim(),
          termo: segmento.trim()
        },
        headers: googleApiKey.trim() ? {
          'X-Google-Key': googleApiKey.trim()
        } : undefined
      });

      const resultados: LeadComercio[] = response.data || [];
      
      // Marca os que já estão na triagem
      const telsTriagem = new Set(leadsTriagem.map(lt => (lt.telefone || '').replace(/\D/g, '')).filter(Boolean));
      const nomesTriagem = new Set(leadsTriagem.map(lt => lt.nome.trim().toLowerCase()));

      const formatados = resultados.map(r => {
        const telLimpo = (r.telefone || '').replace(/\D/g, '');
        const jaSalvo = (telLimpo && telsTriagem.has(telLimpo)) || nomesTriagem.has(r.nome.trim().toLowerCase());
        return { ...r, salvoTriagem: jaSalvo };
      });

      setLeads(formatados);
      setBuscaRealizada(true);

      if (resultados.length === 0) {
        setMensagemErro(`Nenhum comércio real encontrado para "${segmento}" em "${cidade}". Tente uma palavra-chave mais ampla.`);
      }
    } catch (err: any) {
      console.error("Erro na busca de prospecção:", err);
      setMensagemErro(err.response?.data?.mensagem || 'Erro ao conectar à base de dados. Verifique sua conexão e tente novamente.');
    } finally {
      setBuscando(false);
    }
  }

  function handleSalvarChaveGoogle() {
    const cleanKey = chaveInput.trim();
    if (cleanKey) {
      localStorage.setItem('@Autonomax:googlePlacesApiKey', cleanKey);
      setGoogleApiKey(cleanKey);
      setMensagemSucesso('Chave do Google Places salva com sucesso! O Radar agora utilizará os dados do Google Maps.');
    } else {
      localStorage.removeItem('@Autonomax:googlePlacesApiKey');
      setGoogleApiKey('');
      setMensagemSucesso('Chave removida. O Radar voltou a utilizar a base aberta gratuita do OpenStreetMap.');
    }
    setModalChaveGoogleAberto(false);
    setTimeout(() => setMensagemSucesso(null), 4000);
  }

  function toggleSelecionarTodos() {
    if (selecionados.length === leads.length) {
      setSelecionados([]);
    } else {
      setSelecionados(leads.map(l => l.id));
    }
  }

  function toggleSelecionarLead(id: string) {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  // Salvar 1 Lead na Triagem
  async function handleSalvarLeadNaTriagem(lead: LeadComercio) {
    if (!currentNegocioId) {
      setMensagemErro('Selecione um negócio no topo da tela antes de salvar.');
      return;
    }

    try {
      await api.post('/Prospeccao/salvar-triagem', {
        negocioId: Number(currentNegocioId),
        leads: [lead]
      });

      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, salvoTriagem: true } : l));
      setMensagemSucesso(`"${lead.nome}" salvo na Triagem com sucesso!`);
      setTimeout(() => setMensagemSucesso(null), 4000);
      carregarTriagem();
    } catch {
      setMensagemErro(`Erro ao salvar "${lead.nome}" na triagem.`);
    }
  }

  // Salvar Selecionados na Triagem
  async function handleSalvarSelecionadosNaTriagem() {
    if (!selecionados.length) return;
    if (!currentNegocioId) {
      setMensagemErro('Selecione um negócio no topo da tela antes de salvar.');
      return;
    }

    const leadsParaSalvar = leads.filter(l => selecionados.includes(l.id));
    try {
      const res = await api.post('/Prospeccao/salvar-triagem', {
        negocioId: Number(currentNegocioId),
        leads: leadsParaSalvar
      });
      const { salvos, mensagem } = res.data;
      setLeads(prev => prev.map(l => selecionados.includes(l.id) ? { ...l, salvoTriagem: true } : l));
      setSelecionados([]);
      setMensagemSucesso(mensagem || `${salvos} comércios salvos na Triagem!`);
      setTimeout(() => setMensagemSucesso(null), 4000);
      carregarTriagem();
    } catch {
      setMensagemErro('Erro ao salvar os comércios selecionados na triagem.');
    }
  }

  // Atualizar Status do Lead na Triagem
  async function handleAtualizarStatusTriagem(id: number, status: LeadTriagemItem['status']) {
    try {
      await api.patch(`/Prospeccao/triagem/${id}/status`, { status });
      setLeadsTriagem(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  }

  // Converter Lead da Triagem em Cliente Oficial
  async function handleConverterLead(lead: LeadTriagemItem) {
    const confirmou = window.confirm(`Deseja converter "${lead.nome}" em Cliente Oficial da sua carteira definitiva?`);
    if (!confirmou) return;

    try {
      const res = await api.post(`/Prospeccao/triagem/${lead.id}/converter`);
      setLeadsTriagem(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'Convertido' } : l));
      setMensagemSucesso(res.data?.mensagem || `"${lead.nome}" convertido em cliente oficial com sucesso!`);
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch {
      setMensagemErro(`Erro ao converter "${lead.nome}".`);
    }
  }

  // Excluir Lead da Triagem
  async function handleExcluirLeadTriagem(id: number, nome: string) {
    if (!window.confirm(`Remover "${nome}" da sua triagem?`)) return;

    try {
      await api.delete(`/Prospeccao/triagem/${id}`);
      setLeadsTriagem(prev => prev.filter(l => l.id !== id));
      setMensagemSucesso('Lead removido da triagem.');
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch {
      setMensagemErro('Erro ao remover lead da triagem.');
    }
  }

  // Copiar imagem para a área de transferência
  async function copiarImagemClipboard(base64: string): Promise<boolean> {
    try {
      const res = await fetch(base64);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      return true;
    } catch (err) {
      console.warn("Clipboard API:", err);
      return false;
    }
  }

  // Upload de Imagem no WhatsApp
  function handleUploadImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setImagemWhatsapp(base64);
      localStorage.setItem('@Autonomax:radarWhatsappImage', base64);
      setMensagemSucesso('Imagem anexada! Ela será copiada automaticamente ao disparar mensagens.');
      setTimeout(() => setMensagemSucesso(null), 4000);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoverImagem() {
    setImagemWhatsapp(null);
    localStorage.removeItem('@Autonomax:radarWhatsappImage');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMensagemSucesso('Imagem removida do modelo.');
    setTimeout(() => setMensagemSucesso(null), 3000);
  }

  // Disparo do WhatsApp (com imagem na área de transferência)
  async function handleAbrirWhatsApp(nome: string, telefone?: string, idTriagem?: number) {
    const rawNumber = (telefone || '').replace(/\D/g, '');
    if (!rawNumber) {
      alert('Telefone não informado neste registro.');
      return;
    }

    let copiou = false;
    if (imagemWhatsapp) {
      copiou = await copiarImagemClipboard(imagemWhatsapp);
    }

    const ddiNumber = rawNumber.length <= 11 ? `55${rawNumber}` : rawNumber;
    const msg = encodeURIComponent(`Olá, ${nome}! ${templateMensagem}`);
    const whatsappUrl = `https://wa.me/${ddiNumber}?text=${msg}`;
    window.open(whatsappUrl, '_blank');

    if (copiou) {
      setMensagemSucesso('📋 Imagem copiada! No WhatsApp, basta pressionar Ctrl + V para colar junto com o texto.');
      setTimeout(() => setMensagemSucesso(null), 5000);
    }

    if (idTriagem) {
      handleAtualizarStatusTriagem(idTriagem, 'Contatado');
    }
  }

  function handleExportarCSV() {
    if (!leads.length) return;
    const cabecalho = 'Nome;Telefone;Endereço;Cidade;Avaliação;Total Avaliações;Categoria;Fonte;Link Maps\n';
    const linhas = leads.map(l => 
      `"${l.nome}";"${l.telefone || ''}";"${l.endereco}";"${l.cidade}";"${l.avaliacao || ''}";"${l.totalAvaliacoes || ''}";"${l.categoria || ''}";"${l.origem || ''}";"${l.googleMapsUrl || ''}"`
    ).join('\n');

    const blob = new Blob([cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_${cidade}_${segmento}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 sm:px-6 lg:px-8 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header Principal */}
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-950/50 text-cyan-400 rounded-xl border border-cyan-800/50 shadow-inner">
                <Target size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black uppercase tracking-tight text-white">
                    Radar de Clientes
                  </h1>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 flex items-center gap-1">
                    <Sparkles size={11} /> Prospecção B2B
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Localize novos estabelecimentos, faça a triagem e transforme prospectos em clientes reais.
                </p>
              </div>
            </div>

            {/* Ações do Topo */}
            <div className="self-start md:self-auto flex items-center gap-2 flex-wrap">
              
              {/* Botão Chave Google */}
              <button
                type="button"
                onClick={() => {
                  setChaveInput(googleApiKey);
                  setModalChaveGoogleAberto(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  googleApiKey 
                    ? 'bg-blue-950/40 text-blue-400 border-blue-900/60 hover:bg-blue-900/40'
                    : 'bg-gray-950 hover:bg-gray-800 text-gray-300 hover:text-white border-gray-800'
                }`}
                title="Configurar chave opcional do Google Places"
              >
                <KeyRound size={14} className={googleApiKey ? 'text-blue-400' : 'text-gray-400'} />
                <span>{googleApiKey ? 'Google Maps (Ativo)' : 'Chave Google (Opcional)'}</span>
              </button>

              {/* Botão Personalizar Mensagem & Imagem */}
              <button
                type="button"
                onClick={() => setModalMensagemAberto(true)}
                className="flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Personalizar mensagem padrão e foto do WhatsApp"
              >
                <MessageSquare size={14} className="text-emerald-400" />
                <span>Mensagem WhatsApp</span>
                {imagemWhatsapp && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" title="Imagem anexada" />
                )}
              </button>

              {/* Indicador de Modo */}
              <div className="flex items-center gap-1.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 px-3 py-1.5 rounded-lg text-xs font-bold">
                <Globe2 size={14} />
                <span>{googleApiKey ? 'Google Places API' : 'OpenStreetMap'}</span>
              </div>
            </div>
          </div>

          {/* SELETOR DE ABAS: BUSCAR COMÉRCIOS vs TRIAGEM DE LEADS */}
          <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
            <button
              type="button"
              onClick={() => setAbaAtiva('busca')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer border ${
                abaAtiva === 'busca'
                  ? 'bg-cyan-950/50 text-cyan-300 border-cyan-800 shadow-md'
                  : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Search size={15} />
              <span>Escanear Comércios</span>
            </button>

            <button
              type="button"
              onClick={() => { setAbaAtiva('triagem'); carregarTriagem(); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer border relative ${
                abaAtiva === 'triagem'
                  ? 'bg-amber-950/50 text-amber-300 border-amber-800 shadow-md'
                  : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
              }`}
            >
              <ListFilter size={15} />
              <span>Leads em Triagem</span>
              {totalLeadsAtivos > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-gray-950">
                  {totalLeadsAtivos}
                </span>
              )}
            </button>
          </div>

          {/* Avisos Flutuantes */}
          {mensagemSucesso && (
            <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-bold animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {mensagemErro && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-200 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-bold animate-in fade-in">
              <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
              <span>{mensagemErro}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* ABA 1: ESCANEAR / BUSCAR COMÉRCIOS                             */}
          {/* ============================================================== */}
          {abaAtiva === 'busca' && (
            <div className="space-y-6">
              
              {/* Card de Busca (Sem Sugestões e Sem Placeholders) */}
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4 shadow-xl">
                <form onSubmit={handleBuscar} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Campo Cidade */}
                  <div className="md:col-span-5 space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <MapPin size={14} className="text-cyan-400" /> Cidade
                    </label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-cyan-500 transition-colors"
                      required
                    />
                  </div>

                  {/* Campo Palavra-chave / Segmento */}
                  <div className="md:col-span-5 space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Search size={14} className="text-cyan-400" /> Nicho ou Tipo de Comércio
                    </label>
                    <input
                      type="text"
                      value={segmento}
                      onChange={(e) => setSegmento(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-cyan-500 transition-colors"
                      required
                    />
                  </div>

                  {/* Botão Escanear */}
                  <div className="md:col-span-2 flex items-end">
                    <button
                      type="submit"
                      disabled={buscando}
                      className="w-full h-[46px] bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900/50 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 cursor-pointer border-none"
                    >
                      {buscando ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Buscando...</span>
                        </>
                      ) : (
                        <>
                          <Target size={16} />
                          <span>Escanear</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Painel de Resultados da Busca */}
              {buscaRealizada && (
                <div className="space-y-4">
                  
                  {/* KPIs da Busca */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Comércios Encontrados</p>
                      <p className="text-2xl font-black text-cyan-400 mt-1">{leads.length}</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Com Telefone Direto</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">{totalComTelefone}</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Avaliação Média</p>
                      <p className="text-2xl font-black text-yellow-400 mt-1 flex items-center gap-1.5">
                        <Star size={18} className="fill-yellow-400 text-yellow-400" />
                        <span>{mediaAvaliacoes > 0 ? mediaAvaliacoes : '—'}</span>
                      </p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Selecionados</p>
                      <p className="text-2xl font-black text-cyan-400 mt-1">{selecionados.length}</p>
                    </div>
                  </div>

                  {/* Barra de Ações em Massa */}
                  <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={toggleSelecionarTodos}
                        className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white cursor-pointer bg-transparent border-none"
                      >
                        {selecionados.length === leads.length && leads.length > 0 ? (
                          <CheckSquare size={18} className="text-cyan-400" />
                        ) : (
                          <Square size={18} className="text-gray-500" />
                        )}
                        <span>{selecionados.length === leads.length && leads.length > 0 ? 'Desmarcar Todos' : 'Marcar Todos'}</span>
                      </button>
                      <span className="text-xs text-gray-500">|</span>
                      <span className="text-xs font-bold text-gray-400">
                        {selecionados.length} de {leads.length} selecionados
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportarCSV}
                        className="px-3 py-2 bg-gray-950 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg border border-gray-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download size={14} />
                        <span>Exportar CSV</span>
                      </button>

                      {/* Botão Salvar Selecionados na Triagem */}
                      <button
                        type="button"
                        onClick={handleSalvarSelecionadosNaTriagem}
                        disabled={selecionados.length === 0}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-800 disabled:text-gray-600 text-gray-950 font-black rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer border-none"
                      >
                        <Sparkles size={15} />
                        <span>Salvar na Triagem ({selecionados.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Dica de Prospecção */}
                  {googleApiKey && (
                    <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-xl p-3 px-4 flex items-center justify-between gap-3 text-xs text-cyan-200/90">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">💡</span>
                        <span>
                          <strong>Dica de Prospecção:</strong> O Google Maps limita até 60 resultados por consulta de texto. Para mapear centenas de comércios na cidade, faça buscas com variações (ex: <em>"Açougue"</em>, <em>"Casa de Carnes"</em>, <em>"Boutique de Carnes"</em> ou <em>"Açougue Centro"</em>) e salve na <strong>Triagem</strong> — os já existentes são filtrados automaticamente!
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lista dos Comércios Encontrados */}
                  <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                    <div className="divide-y divide-gray-800/60">
                      {leadsFiltrados.map((lead) => {
                        const isSelected = selecionados.includes(lead.id);

                        return (
                          <div 
                            key={lead.id} 
                            className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                              isSelected ? 'bg-cyan-950/20' : 'hover:bg-gray-800/40'
                            }`}
                          >
                            {/* Checkbox + Detalhes */}
                            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => toggleSelecionarLead(lead.id)}
                                className="mt-1 text-gray-400 hover:text-cyan-400 cursor-pointer bg-transparent border-none"
                              >
                                {isSelected ? (
                                  <CheckSquare size={18} className="text-cyan-400" />
                                ) : (
                                  <Square size={18} className="text-gray-600" />
                                )}
                              </button>

                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-sm font-bold text-white truncate max-w-md">
                                    {lead.nome}
                                  </h3>

                                  {lead.origem && (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-gray-950 border border-gray-800 text-gray-400">
                                      {lead.origem}
                                    </span>
                                  )}

                                  {lead.googleMapsUrl && (
                                    <a 
                                      href={lead.googleMapsUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      title="Ver no Google Maps"
                                      className="text-gray-500 hover:text-cyan-400 transition-colors"
                                    >
                                      <ExternalLink size={13} />
                                    </a>
                                  )}

                                  {lead.salvoTriagem && (
                                    <span className="bg-amber-950/80 text-amber-400 border border-amber-800/80 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <CheckCircle2 size={10} /> Na Triagem
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-gray-400 flex items-center gap-1.5 truncate">
                                  <MapPin size={13} className="text-gray-500 flex-shrink-0" />
                                  <span className="truncate">{lead.endereco}</span>
                                </p>

                                <div className="flex items-center gap-4 text-xs pt-0.5 flex-wrap">
                                  {lead.telefone ? (
                                    <span className="text-gray-300 font-mono font-bold flex items-center gap-1">
                                      <Phone size={12} className="text-emerald-400" />
                                      {lead.telefone}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 italic text-[11px]">
                                      Telefone não listado
                                    </span>
                                  )}

                                  {lead.avaliacao ? (
                                    <span className="flex items-center gap-1 text-yellow-400 font-bold">
                                      <Star size={12} className="fill-yellow-400" />
                                      <span>{lead.avaliacao}</span>
                                      <span className="text-gray-500 text-[10px]">({lead.totalAvaliacoes || 0} avaliações)</span>
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {/* Ações Rápidas */}
                            <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                              {lead.telefone && (
                                <button
                                  type="button"
                                  onClick={() => handleAbrirWhatsApp(lead.nome, lead.telefone)}
                                  className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Iniciar conversa no WhatsApp com mensagem de apresentação e foto anexada"
                                >
                                  <MessageSquare size={14} />
                                  <span>WhatsApp</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleSalvarLeadNaTriagem(lead)}
                                disabled={lead.salvoTriagem}
                                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border-none ${
                                  lead.salvoTriagem 
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-amber-600 hover:bg-amber-500 text-gray-950 font-black shadow-md cursor-pointer'
                                }`}
                              >
                                <Sparkles size={14} />
                                <span>{lead.salvoTriagem ? 'Salvo' : 'Salvar Triagem'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* Estado Inicial Vazio */}
              {!buscaRealizada && !buscando && (
                <div className="bg-gray-900/60 rounded-2xl border border-gray-800/80 p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-cyan-950/50 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto border border-cyan-800/40 shadow-inner">
                    <Target size={32} />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="text-base font-bold text-white">Nenhum comércio escaneado ainda</h3>
                    <p className="text-xs text-gray-400">
                      Digite o nome da cidade e o segmento desejado para encontrar clientes potenciais para o seu negócio.
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ============================================================== */}
          {/* ABA 2: LEADS EM TRIAGEM (PRÉ-FUNIL ANTES DE VIRAR CLIENTE)     */}
          {/* ============================================================== */}
          {abaAtiva === 'triagem' && (
            <div className="space-y-6">

              {/* Barra de Filtros e Busca na Triagem */}
              <div className="bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                
                {/* Seletor de Status */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'Todos', label: 'Todos' },
                    { id: 'Novo', label: 'Novos' },
                    { id: 'Contatado', label: 'Contatados' },
                    { id: 'Negociando', label: 'Em Negociação' },
                    { id: 'SemInteresse', label: 'Sem Interesse' },
                    { id: 'Convertido', label: 'Convertidos' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFiltroStatusTriagem(st.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        filtroStatusTriagem === st.id
                          ? 'bg-amber-500 text-gray-950 border-amber-400 font-black shadow'
                          : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Busca Rápida por Texto */}
                <div className="w-full md:w-64">
                  <input
                    type="text"
                    value={termoBuscaTriagem}
                    onChange={(e) => setTermoBuscaTriagem(e.target.value)}
                    placeholder="Filtrar por nome ou telefone..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Lista dos Leads em Triagem */}
              {carregandoTriagem ? (
                <div className="p-12 text-center text-gray-400 space-y-2">
                  <RefreshCw size={24} className="animate-spin mx-auto text-amber-400" />
                  <p className="text-xs font-bold uppercase tracking-wider">Carregando leads da triagem...</p>
                </div>
              ) : leadsTriagemFiltrados.length === 0 ? (
                <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-12 text-center space-y-3">
                  <ListFilter size={32} className="mx-auto text-gray-600" />
                  <h3 className="text-sm font-bold text-white">Nenhum lead encontrado neste filtro</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Vá até a aba "Escanear Comércios", pesquise estabelecimentos e clique em "Salvar na Triagem" para montar sua lista de prospecção.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-xl divide-y divide-gray-800/60">
                  {leadsTriagemFiltrados.map((lead) => {
                    return (
                      <div key={lead.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-800/30 transition-colors">
                        
                        {/* Informações do Lead */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-white truncate max-w-md">
                              {lead.nome}
                            </h3>

                            {/* Badge do Status Atual */}
                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                              lead.status === 'Novo'
                                ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                                : lead.status === 'Contatado'
                                ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                                : lead.status === 'Negociando'
                                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                                : lead.status === 'Convertido'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                : 'bg-gray-950 text-gray-400 border-gray-800'
                            }`}>
                              {lead.status === 'SemInteresse' ? 'Sem Interesse' : lead.status}
                            </span>

                            {lead.googleMapsUrl && (
                              <a 
                                href={lead.googleMapsUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                title="Ver no Google Maps"
                                className="text-gray-500 hover:text-cyan-400 transition-colors"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>

                          <p className="text-xs text-gray-400 flex items-center gap-1.5 truncate">
                            <MapPin size={13} className="text-gray-500 flex-shrink-0" />
                            <span className="truncate">{lead.endereco || `${lead.cidade} - ${lead.estado}`}</span>
                          </p>

                          <div className="flex items-center gap-4 text-xs pt-0.5 flex-wrap">
                            {lead.telefone ? (
                              <span className="text-gray-300 font-mono font-bold flex items-center gap-1">
                                <Phone size={12} className="text-emerald-400" />
                                {lead.telefone}
                              </span>
                            ) : (
                              <span className="text-gray-500 italic text-[11px]">Sem telefone</span>
                            )}

                            {lead.categoria && (
                              <span className="text-gray-400 text-[11px] bg-gray-950 px-2 py-0.5 rounded border border-gray-800">
                                {lead.categoria}
                              </span>
                            )}

                            {lead.avaliacao ? (
                              <span className="flex items-center gap-1 text-yellow-400 font-bold">
                                <Star size={12} className="fill-yellow-400" />
                                <span>{lead.avaliacao}</span>
                                <span className="text-gray-500 text-[10px]">({lead.totalAvaliacoes || 0})</span>
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Ações da Triagem: Mudar Status + WhatsApp + Converter Cliente */}
                        <div className="flex items-center gap-2 flex-wrap self-end md:self-center flex-shrink-0">
                          
                          {/* Seletor Rápido de Status */}
                          <select
                            value={lead.status}
                            onChange={(e) => handleAtualizarStatusTriagem(lead.id, e.target.value as any)}
                            className="bg-gray-950 border border-gray-800 text-xs text-gray-300 rounded-xl px-2.5 py-2 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="Novo">Novo</option>
                            <option value="Contatado">Contatado</option>
                            <option value="Negociando">Negociando</option>
                            <option value="SemInteresse">Sem Interesse</option>
                            <option value="Convertido">Convertido</option>
                          </select>

                          {/* Botão WhatsApp com Cópia de Imagem */}
                          {lead.telefone && (
                            <button
                              type="button"
                              onClick={() => handleAbrirWhatsApp(lead.nome, lead.telefone, lead.id)}
                              className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Chamar no WhatsApp (copia a foto do modelo automaticamente se configurada)"
                            >
                              <MessageSquare size={14} />
                              <span>WhatsApp</span>
                            </button>
                          )}

                          {/* Botão Converter em Cliente Oficial */}
                          {lead.status !== 'Convertido' ? (
                            <button
                              type="button"
                              onClick={() => handleConverterLead(lead)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer border-none"
                              title="Fechar pedido e mover para Meus Clientes Oficial"
                            >
                              <UserCheck size={14} />
                              <span>Virou Cliente</span>
                            </button>
                          ) : (
                            <span className="px-3 py-2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-xl text-xs font-black uppercase flex items-center gap-1">
                              <CheckCircle2 size={13} /> Cliente Oficial
                            </span>
                          )}

                          {/* Botão Excluir da Triagem */}
                          <button
                            type="button"
                            onClick={() => handleExcluirLeadTriagem(lead.id, lead.nome)}
                            className="p-2 bg-gray-950 hover:bg-rose-950/50 text-gray-500 hover:text-rose-400 border border-gray-800 hover:border-rose-900 rounded-xl transition-colors cursor-pointer"
                            title="Remover da triagem"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ============================================================== */}
          {/* MODAL DE MENSAGEM DO WHATSAPP + ANEXO DE IMAGEM               */}
          {/* ============================================================== */}
          {modalMensagemAberto && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <MessageSquare size={18} />
                    <span>Modelo de Apresentação WhatsApp</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalMensagemAberto(false)}
                    className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors bg-transparent border-none cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <p className="text-xs text-gray-400">
                  Configure o texto e uma imagem promocional (flyer, tabela ou catálogo). O nome do comércio é adicionado automaticamente no início da conversa.
                </p>

                {/* Texto da Mensagem */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    Texto Padrão
                  </label>
                  <textarea
                    value={templateMensagem}
                    onChange={(e) => setTemplateMensagem(e.target.value)}
                    rows={4}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>

                {/* Imagem Promocional Anexa */}
                <div className="space-y-2 pt-2 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-emerald-400" /> Imagem / Flyer Anexo
                    </label>

                    {imagemWhatsapp && (
                      <button
                        type="button"
                        onClick={handleRemoverImagem}
                        className="text-[11px] text-rose-400 hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Remover Imagem
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleUploadImagem}
                    className="hidden"
                  />

                  {imagemWhatsapp ? (
                    <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={imagemWhatsapp} 
                          alt="Flyer Promocional" 
                          className="w-12 h-12 object-cover rounded-lg border border-gray-800 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">Imagem Promocional Anexada</p>
                          <p className="text-[10px] text-emerald-400">Copia automaticamente para a área de transferência ao clicar em WhatsApp.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 text-[11px] font-bold rounded-lg border border-gray-800 cursor-pointer"
                      >
                        Trocar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 bg-gray-950 hover:bg-gray-800/80 border border-dashed border-gray-800 hover:border-gray-700 rounded-xl text-center cursor-pointer transition-colors space-y-1"
                    >
                      <Upload size={18} className="mx-auto text-gray-500" />
                      <p className="text-xs font-bold text-gray-300">Clique para selecionar imagem ou catálogo</p>
                      <p className="text-[10px] text-gray-500">PNG, JPG ou WEBP de até 2MB</p>
                    </button>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setModalMensagemAberto(false)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer border-none shadow-md"
                  >
                    Salvar e Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Configuração da Chave do Google Places (Opcional) */}
          {modalChaveGoogleAberto && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <KeyRound size={18} />
                    <span>Chave Google Places API (Opcional)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalChaveGoogleAberto(false)}
                    className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors bg-transparent border-none cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-gray-400">
                  <p>
                    O Radar suporta a <strong>Places API (New)</strong> oficial do Google Maps para extrair telefones, avaliações reais e localizações.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400">Chave de API do Google</label>
                  <input
                    type="text"
                    value={chaveInput}
                    onChange={(e) => setChaveInput(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-gray-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  {googleApiKey ? (
                    <button
                      type="button"
                      onClick={() => {
                        setChaveInput('');
                        localStorage.removeItem('@Autonomax:googlePlacesApiKey');
                        setGoogleApiKey('');
                        setModalChaveGoogleAberto(false);
                      }}
                      className="text-xs text-rose-400 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Remover Chave
                    </button>
                  ) : <div />}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setModalChaveGoogleAberto(false)}
                      className="px-3 py-2 bg-gray-800 text-gray-300 hover:text-white font-bold text-xs rounded-xl cursor-pointer border-none"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSalvarChaveGoogle}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer border-none"
                    >
                      Salvar Chave
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
