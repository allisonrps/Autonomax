import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, ChevronDown, LayoutDashboard, Users, 
  BarChart3, Briefcase, Building2, User, Truck, Package,
  ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import api from '../services/api';
import logoImg from '../assets/logo-horizontal-white.png';

interface Negocio { 
  id: number; 
  nome: string; 
  logoUrl?: string | null;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Estado do menu mobile (drawer)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Estado da sidebar no desktop (recolhida ou expandida)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('@Autonomax:sidebarCollapsed') === 'true';
  });

  const [isNegocioOpen, setIsNegocioOpen] = useState(false);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [negocioSelecionado, setNegocioSelecionado] = useState<Negocio | null>(null);

  const carregarNegocios = async () => {
    try {
      const response = await api.get('/Negocios');
      setNegocios(response.data);
      const savedId = localStorage.getItem('@Autonomax:selectedNegocioId');
      if (savedId) {
        const found = response.data.find((n: Negocio) => n.id === Number(savedId));
        if (found) setNegocioSelecionado(found);
      } else if (response.data.length > 0) {
        setNegocioSelecionado(response.data[0]);
        localStorage.setItem('@Autonomax:selectedNegocioId', String(response.data[0].id));
      }
    } catch (err) { 
      console.error("Erro ao carregar negócios"); 
    }
  };

  useEffect(() => {
    carregarNegocios();

    // Escuta evento customizado caso o logo ou nome seja alterado no Perfil
    const handleAtualizacao = () => carregarNegocios();
    window.addEventListener('negocioAtualizado', handleAtualizacao);
    return () => window.removeEventListener('negocioAtualizado', handleAtualizacao);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const novo = !prev;
      localStorage.setItem('@Autonomax:sidebarCollapsed', String(novo));
      return novo;
    });
  };

  const selecionarNegocio = (n: Negocio) => {
    localStorage.setItem('@Autonomax:selectedNegocioId', String(n.id));
    setIsNegocioOpen(false);
    window.location.reload();
  };

  const handleLogout = () => { 
    localStorage.clear(); 
    navigate('/'); 
  };

  const navLinks = [
    { name: 'Fluxo de Caixa', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Catálogo', path: '/catalogo', icon: Package },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Parceiros', path: '/fornecedores', icon: Truck },
    { name: 'Análise', path: '/relatorios', icon: BarChart3 },
    { name: 'Perfil', path: '/perfil', icon: User },
  ];

  const isLinkActive = (path: string) => {
    const clean = path.replace('/', '');
    return location.pathname === path || (clean && location.pathname.includes(clean));
  };

  return (
    <div className="min-h-screen bg-gray-950 flex font-sans text-gray-100">
      
      {/* ============================================================ */}
      {/* 1. SIDEBAR DESKTOP (FIXA À ESQUERDA, COLAPSÁVEL)             */}
      {/* ============================================================ */}
      <aside 
        className={`hidden lg:flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 ease-in-out fixed top-0 bottom-0 left-0 z-50 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* TOPO DA SIDEBAR: LOGO + BOTÃO DE RECOLHER */}
        <div className="h-20 px-4 border-b border-gray-800/80 flex items-center justify-between flex-shrink-0">
          {!sidebarCollapsed ? (
            <Link to="/perfil" className="flex items-center gap-3 min-w-0 max-w-[180px]">
              {negocioSelecionado?.logoUrl ? (
                <div className="h-9 max-w-[150px] flex items-center">
                  <img 
                    src={negocioSelecionado.logoUrl} 
                    alt={negocioSelecionado.nome} 
                    className="max-h-9 max-w-full object-contain rounded"
                  />
                </div>
              ) : (
                <img 
                  src={logoImg} 
                  alt="Autonomax" 
                  className="h-6 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" 
                />
              )}
            </Link>
          ) : (
            <Link to="/perfil" className="mx-auto" title={negocioSelecionado?.nome || "Autonomax"}>
              {negocioSelecionado?.logoUrl ? (
                <div className="w-10 h-10 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center overflow-hidden p-1">
                  <img src={negocioSelecionado.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-emerald-950/50 border border-emerald-900 text-emerald-400 flex items-center justify-center font-black text-sm">
                  {negocioSelecionado?.nome?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
            </Link>
          )}

          {/* Botão de Toggle Expandir / Recolher */}
          <button
            type="button"
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer ${
              sidebarCollapsed ? 'hidden' : 'block'
            }`}
            title="Recolher menu"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* SELETOR DE UNIDADE DE NEGÓCIO */}
        <div className="p-3 border-b border-gray-800/60 relative flex-shrink-0">
          {!sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setIsNegocioOpen(!isNegocioOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-[10px] font-black uppercase tracking-wider text-gray-300 hover:border-emerald-600 hover:text-emerald-400 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 size={13} className="text-emerald-400 flex-shrink-0" />
                <span className="truncate">{negocioSelecionado?.nome || 'Selecionar'}</span>
              </div>
              <ChevronDown size={12} className="text-gray-500 flex-shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { toggleSidebar(); setIsNegocioOpen(true); }}
              className="w-full flex justify-center p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-gray-400 hover:text-emerald-400 hover:border-emerald-600 transition-all cursor-pointer"
              title={`Negócio: ${negocioSelecionado?.nome || 'Selecionar'}`}
            >
              <Building2 size={16} />
            </button>
          )}

          {/* Dropdown de Negócios */}
          {isNegocioOpen && !sidebarCollapsed && (
            <div className="absolute left-3 right-3 mt-1.5 bg-gray-950 border border-gray-800 rounded-xl p-1.5 shadow-2xl z-50 space-y-1">
              {negocios.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => selecionarNegocio(n)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-black uppercase tracking-tight flex items-center gap-2 transition-colors cursor-pointer ${
                    negocioSelecionado?.id === n.id 
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Briefcase size={12} />
                  <span className="truncate">{n.nome}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LISTA DE NAVEGAÇÃO */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navLinks.map(link => {
            const ativo = isLinkActive(link.path);
            const Icon = link.icon;

            return (
              <Link
                key={link.path}
                to={link.path}
                title={sidebarCollapsed ? link.name : undefined}
                className={`flex items-center gap-3.5 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  ativo
                    ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/60 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60 border border-transparent'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon size={18} className={`flex-shrink-0 ${ativo ? 'text-emerald-400' : 'text-gray-400'}`} />
                {!sidebarCollapsed && <span className="truncate">{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* RODAPÉ DA SIDEBAR: BOTÃO EXPANDIR (QUANDO RECOLHIDO) OU SAIR */}
        <div className="p-3 border-t border-gray-800/80 flex-shrink-0 space-y-2">
          {sidebarCollapsed ? (
            <>
              <button
                type="button"
                onClick={toggleSidebar}
                className="w-full flex items-center justify-center p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                title="Expandir menu"
              >
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2.5 text-red-400/80 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                title="Sair do Autonomax"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-red-400/80 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              <span>Sair do Sistema</span>
            </button>
          )}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. BARRA SUPERIOR MOBILE                                     */}
      {/* ============================================================ */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900/90 backdrop-blur-xl border-b border-gray-800/80 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            title="Abrir Menu"
          >
            <Menu size={22} />
          </button>

          <Link to="/perfil" className="flex items-center">
            {negocioSelecionado?.logoUrl ? (
              <img 
                src={negocioSelecionado.logoUrl} 
                alt={negocioSelecionado.nome} 
                className="h-8 max-w-[120px] object-contain"
              />
            ) : (
              <img 
                src={logoImg} 
                alt="Autonomax" 
                className="h-6 w-auto object-contain opacity-90" 
              />
            )}
          </Link>
        </div>

        {/* Negócio Ativo Mobile */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-950 px-2.5 py-1.5 rounded border border-gray-800 truncate max-w-[120px]">
            {negocioSelecionado?.nome || 'Negócio'}
          </span>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 3. DRAWER MOBILE (SLIDE-OVER LATERAL)                        */}
      {/* ============================================================ */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          {/* Fundo escurecido */}
          <div 
            className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Painel lateral */}
          <div className="fixed top-0 bottom-0 left-0 w-72 bg-gray-900 border-r border-gray-800 p-5 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Header do Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <Link 
                  to="/perfil" 
                  onClick={() => setMobileDrawerOpen(false)} 
                  className="flex items-center gap-2"
                >
                  {negocioSelecionado?.logoUrl ? (
                    <img 
                      src={negocioSelecionado.logoUrl} 
                      alt={negocioSelecionado.nome} 
                      className="h-8 max-w-[140px] object-contain"
                    />
                  ) : (
                    <img src={logoImg} alt="Autonomax" className="h-6 w-auto opacity-90" />
                  )}
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Seletor de Negócio no Drawer */}
              <div className="py-4 border-b border-gray-800">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Unidade Atual</p>
                <div className="space-y-1">
                  {negocios.map(n => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => { selecionarNegocio(n); setMobileDrawerOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-colors ${
                        negocioSelecionado?.id === n.id
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Briefcase size={12} /> {n.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Links de Navegação */}
              <nav className="py-4 space-y-1">
                {navLinks.map(link => {
                  const ativo = isLinkActive(link.path);
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        ativo
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/60'
                          : 'text-gray-300 hover:bg-gray-800/60'
                      }`}
                    >
                      <Icon size={18} className={ativo ? 'text-emerald-400' : 'text-gray-500'} />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Logout Mobile */}
            <div className="pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-3 text-xs font-black uppercase text-red-400 bg-red-950/20 border border-red-900/40 rounded-xl hover:bg-red-950/40 transition-colors"
              >
                <LogOut size={16} /> Sair da Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. CONTEÚDO PRINCIPAL (COM MARGEM DINÂMICA PARA A SIDEBAR)   */}
      {/* ============================================================ */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } pt-16 lg:pt-0`}
      >
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="py-8 text-center border-t border-gray-900/60 mt-auto">
          <p className="text-gray-700 font-black text-[9px] uppercase tracking-[0.3em]">
            Autonomax © 2026
          </p>
        </footer>
      </div>

    </div>
  );
}
