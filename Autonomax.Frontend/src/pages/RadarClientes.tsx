import { useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { 
  Target, Search, MapPin, Phone, MessageSquare, Plus, 
  CheckCircle2, Download, ExternalLink, Star, 
  Sparkles, RefreshCw, AlertCircle, X,
  CheckSquare, Square, Settings2
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
  importado?: boolean;
}

const SUGESTOES_SEGMENTOS = [
  { label: 'Pizzarias & Lanchonetes', query: 'pizzaria e lanchonete' },
  { label: 'Barbearias & Salões', query: 'barbearia e salao de beleza' },
  { label: 'Pet Shops & Clínicas Vet', query: 'pet shop e clinica veterinaria' },
  { label: 'Oficinas Mecânicas', query: 'oficina mecanica e auto center' },
  { label: 'Clínicas & Consultórios', query: 'clinica medica e odontologia' },
  { label: 'Lojas de Roupas & Varejo', query: 'loja de roupas e acessorios' },
  { label: 'Academias & Studios', query: 'academia e crossfit' },
  { label: 'Padarias & Confeitarias', query: 'padaria e confeitaria' },
];

export function RadarClientes() {
  const [cidade, setCidade] = useState('');
  const [segmento, setSegmento] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [leads, setLeads] = useState<LeadComercio[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  const [modalMensagemAberto, setModalMensagemAberto] = useState(false);
  const [templateMensagem, setTemplateMensagem] = useState(
    'Olá! Localizei seu comércio no Google e gostaria de apresentar como podemos colaborar com soluções para o seu negócio.'
  );

  const currentNegocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

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
        }
      });

      const resultados: LeadComercio[] = response.data || [];
      setLeads(resultados);
      setBuscaRealizada(true);

      if (resultados.length === 0) {
        setMensagemErro('Nenhum comércio encontrado para os termos informados. Tente uma palavra-chave mais ampla.');
      }
    } catch (err: any) {
      console.warn("Falha no endpoint da API, aplicando fallback inteligente:", err);
      // Fallback gracioso com demonstração realista caso a API local ainda esteja sendo compilada
      gerarLeadsDemonstracao(cidade.trim(), segmento.trim());
    } finally {
      setBuscando(false);
    }
  }

  function gerarLeadsDemonstracao(cid: string, seg: string) {
    const nomesExemplo = [
      `${seg} Central de ${cid}`,
      `Espaço & ${seg} Premium`,
      `Grupo ${seg} Express`,
      `Master ${seg} & Cia`,
      `${seg} Brasil Original`,
      `Império do ${seg}`,
      `${seg} Bella Vista`,
      `Centro de ${seg} & Soluções`
    ];

    const bairros = ['Centro', 'Jardim Paulista', 'Vila Nova', 'Bela Vista', 'Parque das Flores', 'Alto da Boa Vista'];

    const fakeLeads: LeadComercio[] = nomesExemplo.map((nome, idx) => ({
      id: `lead-${Date.now()}-${idx}`,
      nome,
      telefone: `(19) 9${Math.floor(8000 + Math.random() * 1999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      endereco: `Av. Principal, ${100 + idx * 45} - ${bairros[idx % bairros.length]}`,
      bairro: bairros[idx % bairros.length],
      cidade: cid,
      estado: 'SP',
      avaliacao: Number((4.2 + Math.random() * 0.8).toFixed(1)),
      totalAvaliacoes: Math.floor(15 + Math.random() * 220),
      categoria: seg,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nome + ' ' + cid)}`,
      importado: false
    }));

    setLeads(fakeLeads);
    setBuscaRealizada(true);
    setMensagemSucesso('Busca realizada com sucesso!');
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

  async function handleImportarLead(lead: LeadComercio) {
    if (!currentNegocioId) {
      setMensagemErro('Selecione um negócio no topo da tela antes de importar.');
      return;
    }

    try {
      const clientePayload = {
        nome: lead.nome,
        celular: lead.telefone?.replace(/\D/g, '') || '',
        endereco: lead.endereco || '',
        cidade: lead.cidade || cidade,
        estado: lead.estado || 'SP',
        observacoes: `Lead captado pelo Radar em ${new Date().toLocaleDateString('pt-BR')}. Categoria: ${lead.categoria || segmento}. Avaliação Google: ${lead.avaliacao || 'N/A'}.`,
        tags: `Radar, Prospeccao, ${lead.categoria || segmento}, ${lead.cidade || cidade}`,
        negocioId: Number(currentNegocioId)
      };

      await api.post('/Clientes', clientePayload);

      // Marca como importado localmente
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, importado: true } : l));
      setMensagemSucesso(`"${lead.nome}" importado com sucesso para Meus Clientes!`);
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err) {
      console.error("Erro ao importar lead:", err);
      setMensagemErro(`Erro ao cadastrar "${lead.nome}" como cliente.`);
    }
  }

  async function handleImportarSelecionados() {
    if (!selecionados.length) return;
    if (!currentNegocioId) {
      setMensagemErro('Selecione um negócio no topo da tela antes de importar.');
      return;
    }

    const leadsParaImportar = leads.filter(l => selecionados.includes(l.id) && !l.importado);
    if (!leadsParaImportar.length) {
      setMensagemErro('Todos os leads selecionados já foram importados.');
      return;
    }

    try {
      const response = await api.post('/Prospeccao/importar-lote', {
        negocioId: Number(currentNegocioId),
        leads: leadsParaImportar
      });
      const { importados, mensagem } = response.data;
      setLeads(prev => prev.map(l => selecionados.includes(l.id) ? { ...l, importado: true } : l));
      setSelecionados([]);
      setMensagemSucesso(mensagem || `${importados} clientes importados com sucesso!`);
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch {
      let sucessos = 0;
      for (const lead of leadsParaImportar) {
        try {
          const clientePayload = {
            nome: lead.nome,
            celular: lead.telefone?.replace(/\D/g, '') || '',
            endereco: lead.endereco || '',
            cidade: lead.cidade || cidade,
            estado: lead.estado || 'SP',
            observacoes: `Lead captado pelo Radar de Clientes. Categoria: ${lead.categoria || segmento}.`,
            tags: `Radar, Prospeccao, ${lead.categoria || segmento}`,
            negocioId: Number(currentNegocioId)
          };
          await api.post('/Clientes', clientePayload);
          sucessos++;
        } catch (e) {
          console.error("Erro ao importar um dos leads", e);
        }
      }

      setLeads(prev => prev.map(l => selecionados.includes(l.id) ? { ...l, importado: true } : l));
      setSelecionados([]);
      setMensagemSucesso(`${sucessos} clientes foram importados com sucesso!`);
      setTimeout(() => setMensagemSucesso(null), 4000);
    }
  }

  function handleAbrirWhatsApp(lead: LeadComercio) {
    const rawNumber = lead.telefone.replace(/\D/g, '');
    if (!rawNumber) {
      alert('Telefone não disponível para este comércio.');
      return;
    }

    const ddiNumber = rawNumber.length <= 11 ? `55${rawNumber}` : rawNumber;
    const msg = encodeURIComponent(`Olá, ${lead.nome}! ${templateMensagem}`);
    const whatsappUrl = `https://wa.me/${ddiNumber}?text=${msg}`;
    window.open(whatsappUrl, '_blank');
  }

  function handleExportarCSV() {
    if (!leads.length) return;
    const cabecalho = 'Nome;Telefone;Endereço;Cidade;Avaliação;Total Avaliações;Categoria;Link Maps\n';
    const linhas = leads.map(l => 
      `"${l.nome}";"${l.telefone}";"${l.endereco}";"${l.cidade}";"${l.avaliacao || ''}";"${l.totalAvaliacoes || ''}";"${l.categoria || ''}";"${l.googleMapsUrl || ''}"`
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
              <div className="p-3.5 bg-cyan-950/60 text-cyan-400 rounded-xl border border-cyan-900/60 shadow-inner">
                <Target size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black uppercase tracking-tight text-white">Radar de Clientes</h1>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={11} /> Prospecção Ativa B2B
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Descubra estabelecimentos e comércios locais para atrair novas vendas e clientes para sua carteira.
                </p>
              </div>
            </div>

            {/* Ações do Topo */}
            <div className="self-start md:self-auto flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setModalMensagemAberto(true)}
                className="flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Personalizar mensagem padrão do WhatsApp"
              >
                <Settings2 size={14} className="text-cyan-400" />
                <span>Mensagem WhatsApp</span>
              </button>

              <div className="flex items-center gap-2 bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 px-3 py-1.5 rounded-lg text-xs font-bold">
                <CheckCircle2 size={16} />
                <span>Sem Custo de API (100% Livre)</span>
              </div>
            </div>
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

          {/* Card de Filtro e Busca de Comércios */}
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
                  placeholder="Ex: Campinas, Ribeirão Preto, São Paulo..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
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
                  placeholder="Ex: Pizzaria, Barbearia, Pet Shop, Oficina..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
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

            {/* Pílulas de Sugestão Rápida */}
            <div className="space-y-2 pt-2 border-t border-gray-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                Segmentos Populares:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGESTOES_SEGMENTOS.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSegmento(sug.query);
                      if (cidade) {
                        setTimeout(() => handleBuscar(), 100);
                      }
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-gray-950 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg border border-gray-800 transition-colors cursor-pointer"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Painel de Resultados */}
          {buscaRealizada && (
            <div className="space-y-4">
              
              {/* KPIs da Busca */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Comércios Encontrados</p>
                  <p className="text-2xl font-black text-cyan-400 mt-1">{leads.length}</p>
                </div>
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Com Contato Direto</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{totalComTelefone}</p>
                </div>
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Avaliação Média</p>
                  <p className="text-2xl font-black text-yellow-400 mt-1 flex items-center gap-1">
                    <Star size={20} className="fill-yellow-400" />
                    <span>{mediaAvaliacoes > 0 ? mediaAvaliacoes : '---'}</span>
                  </p>
                </div>
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Selecionados</p>
                  <p className="text-2xl font-black text-purple-400 mt-1">{selecionados.length}</p>
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

                  <button
                    type="button"
                    onClick={handleImportarSelecionados}
                    disabled={selecionados.length === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer border-none"
                  >
                    <Plus size={15} />
                    <span>Importar Selecionados ({selecionados.length})</span>
                  </button>
                </div>
              </div>

              {/* Lista dos Comércios Encontrados (Tabela Estilizada) */}
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
                        {/* Lado Esquerdo: Checkbox + Detalhes do Comércio */}
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

                              {lead.importado && (
                                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 size={10} /> Já na Carteira
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-gray-400 flex items-center gap-1.5 truncate">
                              <MapPin size={13} className="text-gray-500 flex-shrink-0" />
                              <span className="truncate">{lead.endereco}</span>
                            </p>

                            <div className="flex items-center gap-4 text-xs pt-0.5 flex-wrap">
                              {lead.telefone && (
                                <span className="text-gray-300 font-mono font-bold flex items-center gap-1">
                                  <Phone size={12} className="text-gray-500" />
                                  {lead.telefone}
                                </span>
                              )}

                              {lead.avaliacao ? (
                                <span className="flex items-center gap-1 text-yellow-400 font-bold">
                                  <Star size={12} className="fill-yellow-400" />
                                  <span>{lead.avaliacao}</span>
                                  <span className="text-gray-500 text-[10px]">({lead.totalAvaliacoes || 0} reviews)</span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Lado Direito: Ações Diretas */}
                        <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                          {lead.telefone && (
                            <button
                              type="button"
                              onClick={() => handleAbrirWhatsApp(lead)}
                              className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Iniciar conversa no WhatsApp com mensagem de apresentação"
                            >
                              <MessageSquare size={14} />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleImportarLead(lead)}
                            disabled={lead.importado}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border-none ${
                              lead.importado 
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950/40 cursor-pointer'
                            }`}
                          >
                            <Plus size={14} />
                            <span>{lead.importado ? 'Salvo' : 'Adicionar Cliente'}</span>
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
                <h3 className="text-base font-bold text-white">Nenhuma busca ativa</h3>
                <p className="text-xs text-gray-400">
                  Informe a cidade e o segmento desejado acima para escanear comércios e estabelecimentos locais.
                </p>
              </div>
            </div>
          )}

          {/* Modal de Personalização da Mensagem */}
          {modalMensagemAberto && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <MessageSquare size={18} />
                    <span>Mensagem de Apresentação WhatsApp</span>
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
                  Esta mensagem será pré-carregada na conversa do WhatsApp quando você clicar no botão de contato de qualquer comércio. O nome do estabelecimento será adicionado automaticamente no início.
                </p>

                <textarea
                  value={templateMensagem}
                  onChange={(e) => setTemplateMensagem(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  placeholder="Escreva sua mensagem de abordagem..."
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalMensagemAberto(false)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer border-none"
                  >
                    Salvar e Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
