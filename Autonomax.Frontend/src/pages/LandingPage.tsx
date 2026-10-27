import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, 
  Users, BarChart3, Wallet, Sparkles, ChevronRight,
  Receipt, Check, Zap,
  Menu, X
} from 'lucide-react';

import logoImg from '../assets/logo-horizontal.png';
import imgAnalitico from '../assets/mobile_analitico.png';
import imgClienteDetalhe from '../assets/mobile_clientedetalhe.png';
import imgFluxo from '../assets/mobile_fluxo.png';
import imgParceiros from '../assets/mobile_parceiros.png';

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'fluxo' | 'analise' | 'clientes' | 'parceiros'>('fluxo');
  const [billingCycle, setBillingCycle] = useState<'mensal' | 'anual'>('mensal');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const previewTabs = {
    fluxo: {
      badge: "Gestão Financeira Dinâmica",
      title: "Controle de fluxo de caixa em tempo real",
      desc: "Lançamento ágil de receitas e despesas com categorização automática, status de liquidação e filtros rápidos de períodos.",
      image: imgFluxo,
      benefits: ["Registro em segundos via mobile ou web", "Previsão de saldos e controle de pendências", "Histórico completo com busca instantânea"]
    },
    analise: {
      badge: "Inteligência & Relatórios",
      title: "Decisões baseadas em números reais",
      desc: "Visualize a saúde da sua operação com indicadores visuais de margem, receitas, despesas e comparativos mensais.",
      image: imgAnalitico,
      benefits: ["Gráficos dinâmicos de faturamento e lucro", "Mapeamento dos meses com melhor rendimento", "Estatísticas claras sem jargões contábeis"]
    },
    clientes: {
      badge: "Relacionamento com Clientes",
      title: "Histórico completo de quem compra com você",
      desc: "Descubra seu ticket médio, clientes mais fiéis, faturamento acumulado por comprador e pedidos realizados.",
      image: imgClienteDetalhe,
      benefits: ["Ranking automático dos melhores clientes", "Total de faturamento e pedidos por contato", "Histórico de compras pronto para consulta"]
    },
    parceiros: {
      badge: "Fornecedores & Catálogo",
      title: "Organize custos e fornecedores com facilidade",
      desc: "Centralize contratos, despesas por fornecedor e mantenha a lista de produtos ou serviços sempre alinhada com seus preços.",
      image: imgParceiros,
      benefits: ["Acompanhamento de custos por fornecedor", "Catálogo unificado com histórico de preços", "Gestão descomplicada de ponta a ponta"]
    }
  };

  const faqs = [
    {
      q: "O Autonomax serve para o meu tipo de negócio?",
      a: "Sim! O Autonomax foi desenhado sob medida para prestadores de serviços, autônomos, microempresários, MEIs, agências, comércios locais e profissionais liberais que buscam praticidade sem a complexidade dos ERPs tradicionais."
    },
    {
      q: "Preciso instalar algo no meu computador?",
      a: "Não. O Autonomax é 100% em nuvem e responsivo. Você acessa de qualquer navegador no notebook, computador, tablet ou direto do celular com extrema velocidade e segurança."
    },
    {
      q: "Meus dados financeiros estão seguros?",
      a: "Totalmente. Utilizamos criptografia de ponta a ponta, comunicação HTTPS com certificado SSL, banco de dados isolado com proteção contra acessos indevidos e rotinas automáticas de backup diário."
    },
    {
      q: "Posso cancelar quando quiser?",
      a: "Sim, sem nenhuma fidelidade ou multas rescisórias. Você mantém total autonomia sobre a sua assinatura a qualquer momento com apenas um clique."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* ==================== NAVBAR ==================== */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoImg} alt="Autonomax" className="h-9 w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors">
              Recursos
            </a>
            <a href="#demonstracao" className="text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors">
              Como Funciona
            </a>
            <a href="#planos" className="text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors">
              Planos & Preços
            </a>
            <a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors">
              Dúvidas
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              Criar Conta Grátis
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-4 shadow-xl">
            <a 
              href="#recursos" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-emerald-700"
            >
              Recursos
            </a>
            <a 
              href="#demonstracao" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-emerald-700"
            >
              Como Funciona
            </a>
            <a 
              href="#planos" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-emerald-700"
            >
              Planos & Preços
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-emerald-700"
            >
              Dúvidas
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                to="/login"
                className="w-full text-center py-2.5 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl"
              >
                Entrar na Conta
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20"
              >
                Criar Conta Grátis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 bg-gradient-to-b from-white via-emerald-50/40 to-slate-50">
        {/* Glow & Decorative Grids */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.18] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold tracking-wide uppercase shadow-sm">
              <Sparkles size={14} className="text-emerald-600 animate-pulse" />
              <span>A evolução da gestão para o profissional moderno</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Assuma o controle total do seu negócio com{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-700">
                clareza e elegância.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed">
              O Autonomax simplifica seu fluxo de caixa, clientes, catálogo e indicadores em uma plataforma intuitiva, 
              rápida e descomplicada. Sem planilhas confusas. Sem sistemas engessados.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                Comece Gratuitamente
                <ArrowRight size={18} />
              </Link>
              <a
                href="#demonstracao"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-base rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                Conhecer a Plataforma
                <ChevronRight size={18} className="text-slate-400" />
              </a>
            </div>

            {/* Trust points */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-8 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Sem necessidade de cartão para começar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Configuração em menos de 2 minutos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Acesso imediato no celular e desktop</span>
              </div>
            </div>

          </div>

          {/* Hero Mockup Preview */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="relative p-2 sm:p-4 rounded-3xl bg-gradient-to-b from-slate-200/80 via-white to-slate-200/50 shadow-2xl shadow-slate-300/70 border border-slate-200/80">
              <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner flex flex-col md:flex-row items-center justify-between p-6 sm:p-10 gap-8">
                
                {/* Left Preview Highlights */}
                <div className="flex-1 space-y-6 text-white text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    <TrendingUp size={14} />
                    <span>Visão Estratégica em Tempo Real</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                    Tudo o que acontece na sua empresa reunido em um único painel.
                  </h3>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                    Acompanhe faturamento mensal, margem de contribuição, clientes frequentes e pendências financeiras sem perder tempo com relatórios complexos.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                      <span className="text-xs text-slate-400 font-medium block">Total Receitas</span>
                      <span className="text-xl font-black text-emerald-400">R$ 48.520,00</span>
                      <span className="text-[10px] text-emerald-500/80 font-bold block mt-0.5">+18.4% este mês</span>
                    </div>
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                      <span className="text-xs text-slate-400 font-medium block">Ticket Médio</span>
                      <span className="text-xl font-black text-white">R$ 412,00</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">118 pedidos fechados</span>
                    </div>
                  </div>
                </div>

                {/* Right Mockup Phone Screen */}
                <div className="w-full md:w-auto flex justify-center">
                  <div className="relative w-64 sm:w-72 rounded-[32px] p-2 bg-slate-800 shadow-2xl border-4 border-slate-700">
                    <div className="rounded-[24px] overflow-hidden bg-slate-950 aspect-[9/18]">
                      <img 
                        src={imgAnalitico} 
                        alt="Autonomax no Celular" 
                        className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== STATS / HIGHLIGHTS ==================== */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">100%</span>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">Em Nuvem & Seguro</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">&lt; 10s</span>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">Para Novo Lançamento</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">0</span>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">Planilhas Perdidas</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">24/7</span>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">Disponibilidade Total</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== RECURSOS EM CARDS ==================== */}
      <section id="recursos" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-emerald-700 text-xs font-black uppercase tracking-widest bg-emerald-100/60 px-3 py-1 rounded-full">
              Feito para o dia a dia
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Tudo o que sua empresa precisa, sem complexidade desnecessária.
            </h2>
            <p className="text-slate-600 text-base">
              Projetado para eliminar o retrabalho e permitir que você se concentre no que mais importa: fazer seu negócio crescer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wallet size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Fluxo de Caixa Inteligente</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Controle entradas, saídas, valores pendentes e liquidados por data, cliente ou método de pagamento com atualização em tempo real.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Carteira de Clientes 360°</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Identifique instantaneamente seus clientes mais lucrativos, ticket médio individual e histórico de compras acumulado.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Relatórios Sem Mistério</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Estatísticas visuais de receitas x despesas, produtos com maior giro e gráficos evolutivos fáceis de interpretar e agir.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Receipt size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Catálogo & Histórico de Preços</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Cadastre seus produtos e serviços com registro automático de alterações de preço para manter a margem sempre protegida.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Lançamento Ágil em Segundos</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Adicione vendas com múltiplos itens e selecione formas de pagamento (Pix, Cartão, Dinheiro) sem formulários demorados.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Segurança em Nível Bancário</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Seus dados protegidos com autenticação JWT, validação rigorosa de permissões (BOLA/IDOR) e isolamento por negócio.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ==================== DEMONSTRAÇÃO INTERATIVA ==================== */}
      <section id="demonstracao" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-emerald-700 text-xs font-black uppercase tracking-widest bg-emerald-100/60 px-3 py-1 rounded-full">
              Tour da Solução
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Veja o Autonomax em ação.
            </h2>
            <p className="text-slate-600 text-base">
              Navegue pelos módulos principais e sinta como é fácil gerenciar o seu negócio.
            </p>
          </div>

          {/* Tabs Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            {(['fluxo', 'analise', 'clientes', 'parceiros'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[120px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab === 'analise' ? 'Relatórios' : tab}
              </button>
            ))}
          </div>

          {/* Active Tab Showcase */}
          <div className="bg-slate-50 rounded-3xl p-6 sm:p-12 border border-slate-200/90 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-12">
            
            <div className="flex-1 space-y-6">
              <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full uppercase tracking-wider">
                {previewTabs[activeTab].badge}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {previewTabs[activeTab].title}
              </h3>
              <p className="text-slate-600 text-base leading-relaxed">
                {previewTabs[activeTab].desc}
              </p>

              <div className="space-y-3 pt-2">
                {previewTabs[activeTab].benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 group"
                >
                  Experimentar este recurso agora
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Mobile screenshot presentation */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative rounded-[36px] p-2 bg-slate-900 shadow-2xl border-4 border-slate-800 max-w-[280px]">
                <div className="rounded-[28px] overflow-hidden bg-slate-950 aspect-[9/18]">
                  <img
                    key={activeTab}
                    src={previewTabs[activeTab].image}
                    alt={previewTabs[activeTab].title}
                    className="w-full h-full object-cover object-top animate-in fade-in zoom-in-95 duration-300"
                  />
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ==================== PLANOS & PREÇOS ==================== */}
      <section id="planos" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-emerald-700 text-xs font-black uppercase tracking-widest bg-emerald-100/60 px-3 py-1 rounded-full">
              Transparência Total
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Planos acessíveis que cabem no seu bolso.
            </h2>
            <p className="text-slate-600 text-base">
              Escolha a opção ideal para a fase atual do seu negócio e mude quando precisar.
            </p>

            {/* Billing cycle switch */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-sm font-bold ${billingCycle === 'mensal' ? 'text-slate-900' : 'text-slate-500'}`}>
                Mensal
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'mensal' ? 'anual' : 'mensal')}
                className="w-14 h-8 bg-slate-200 rounded-full p-1 transition-colors relative"
              >
                <div 
                  className={`w-6 h-6 bg-emerald-600 rounded-full shadow-md transition-transform ${
                    billingCycle === 'anual' ? 'translate-x-6' : 'translate-x-0'
                  }`} 
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-bold ${billingCycle === 'anual' ? 'text-slate-900' : 'text-slate-500'}`}>
                  Anual
                </span>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  2 meses grátis
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* Plano Gratuito */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Iniciante</h3>
                  <p className="text-slate-500 text-xs mt-1">Para quem está começando a organizar os primeiros recebimentos.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">R$ 0</span>
                  <span className="text-slate-500 text-xs font-semibold">/mês</span>
                </div>
                <div className="space-y-3 pt-2 text-xs font-semibold text-slate-600 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>Até 1 negócio cadastrado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>Até 50 lançamentos/mês</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>Gestão de clientes & catálogo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>Acesso mobile & desktop</span>
                  </div>
                </div>
              </div>
              <div className="pt-8">
                <Link
                  to="/register"
                  className="w-full py-3 px-4 text-center text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all block"
                >
                  Começar Grátis
                </Link>
              </div>
            </div>

            {/* Plano Profissional (Destaque) */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 border-2 border-emerald-500 shadow-2xl relative flex flex-col justify-between hover:scale-[1.02] transition-all">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                Mais Escolhido
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Profissional</h3>
                  <p className="text-slate-400 text-xs mt-1">Para autônomos e empresas que precisam de controle total e sem travas.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">
                    {billingCycle === 'mensal' ? 'R$ 29,90' : 'R$ 24,90'}
                  </span>
                  <span className="text-slate-400 text-xs font-semibold">/mês</span>
                </div>
                <div className="space-y-3 pt-2 text-xs font-semibold text-slate-300 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>Lançamentos e fluxo <strong>ilimitados</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>Relatórios analíticos completos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>Controle detalhado de fornecedores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>Exportação de dados e recibos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>Suporte prioritário via WhatsApp</span>
                  </div>
                </div>
              </div>
              <div className="pt-8">
                <Link
                  to="/register"
                  className="w-full py-3.5 px-4 text-center text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 transition-all block"
                >
                  Garantir Plano Pro
                </Link>
              </div>
            </div>

            {/* Plano Negócios */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Multi-Empresas</h3>
                  <p className="text-slate-500 text-xs mt-1">Para quem administra mais de um negócio ou filial simultaneamente.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">
                    {billingCycle === 'mensal' ? 'R$ 59,90' : 'R$ 49,90'}
                  </span>
                  <span className="text-slate-500 text-xs font-semibold">/mês</span>
                </div>
                <div className="space-y-3 pt-2 text-xs font-semibold text-slate-600 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span><strong>Múltiplos negócios</strong> no mesmo painel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>Tudo do Plano Profissional incluso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>Troca rápida entre empresas em 1 clique</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>Relatórios consolidados</span>
                  </div>
                </div>
              </div>
              <div className="pt-8">
                <Link
                  to="/register"
                  className="w-full py-3 px-4 text-center text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all block"
                >
                  Conhecer Opção
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section id="faq" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-emerald-700 text-xs font-black uppercase tracking-widest bg-emerald-100/60 px-3 py-1 rounded-full">
              Tira Dúvidas
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Perguntas Frequentes
            </h2>
            <p className="text-slate-600 text-sm">
              Tudo o que você precisa saber para começar com tranquilidade.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/50"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full py-5 px-6 text-left font-bold text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-100/60 transition-colors"
                >
                  <span className="text-base">{faq.q}</span>
                  <ChevronRight 
                    size={18} 
                    className={`text-slate-400 shrink-0 transition-transform ${faqOpen === index ? 'rotate-90 text-emerald-600' : ''}`} 
                  />
                </button>
                {faqOpen === index && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==================== CTA FINAL ==================== */}
      <section className="py-20 bg-gradient-to-br from-emerald-900 via-slate-900 to-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Sparkles size={14} />
            <span>Comece hoje a transformar sua gestão</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
            Chega de perder tempo e dinheiro com controles desorganizados.
          </h2>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Cadastre-se agora mesmo e tenha total clareza financeira na palma da sua mão em menos de 2 minutos.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Criar Conta Gratuita Agora
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 hover:bg-slate-800 text-white font-bold text-base rounded-2xl border border-slate-700 transition-all"
            >
              Já tenho uma conta
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Autonomax" className="h-7 w-auto object-contain brightness-0 invert opacity-80" />
            <span className="text-xs text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} Autonomax. Todos os direitos reservados.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold">
            <Link to="/login" className="hover:text-white transition-colors">Acessar Sistema</Link>
            <Link to="/register" className="hover:text-white transition-colors">Cadastre-se</Link>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <a href="#faq" className="hover:text-white transition-colors">Ajuda</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
