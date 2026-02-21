import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Menu, X, ChevronDown, 
  LayoutDashboard, Users, BarChart3, LogOut,
  Briefcase, Building2, Calendar
} from 'lucide-react';
import api from '../services/api';

// IMPORTAÇÃO DO LOGO
import logoImg from '../assets/logo.png';

interface Negocio {
  id: number;
  nome: string;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { mes, ano } = useParams();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isNegocioOpen, setIsNegocioOpen] = useState(false);
  
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [negocioSelecionado, setNegocioSelecionado] = useState<Negocio | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const mesAtual = Number(mes) || new Date().getMonth() + 1;
  const anoAtual = Number(ano) || new Date().getFullYear();
  const mesesNome = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const anos = [2024, 2025, 2026, 2027];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsYearOpen(false);
        setIsMonthOpen(false);
        setIsNegocioOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function carregarNegocios() {
      try {
        const response = await api.get('/Negocios');
        setNegocios(response.data);
        const savedId = localStorage.getItem('@Autonomax:selectedNegocioId');
        if (savedId) {
          const found = response.data.find((n: Negocio) => n.id === Number(savedId));
          if (found) setNegocioSelecionado(found);
        }
      } catch (err) {
        console.error("Erro ao carregar negócios");
      }
    }
    carregarNegocios();
  }, []);

  const selecionarNegocio = (n: Negocio) => {
    setNegocioSelecionado(n);
    localStorage.setItem('@Autonomax:selectedNegocioId', String(n.id));
    setIsNegocioOpen(false);
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const mudarPeriodo = (novoMes: number, novoAno: number) => {
    navigate(`/dashboard/${novoMes}/${novoAno}`);
    setIsMonthOpen(false);
    setIsYearOpen(false);
    setIsMenuOpen(false); // Fecha o menu mobile ao navegar
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" ref={menuRef}>
      <header className="bg-emerald-950 border-b border-emerald-900 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <Link to="/perfil" className="flex items-center">
              <img src={logoImg} alt="Autonomax Logo" className="h-10 md:h-12 w-auto object-contain" />
            </Link>

            <div className="hidden lg:h-8 lg:w-px lg:bg-emerald-800 lg:block" />

            {/* SELETORES DE DATA (DESKTOP) */}
            {(location.pathname.includes('dashboard') || location.pathname.includes('relatorios')) && (
              <div className="hidden md:flex items-center gap-2">
                <div className="relative">
                  <button onClick={() => setIsMonthOpen(!isMonthOpen)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-emerald-900 rounded-lg text-xs font-bold text-emerald-100 transition-all">
                    {mesesNome[mesAtual - 1]} <ChevronDown size={12} />
                  </button>
                  {isMonthOpen && (
                    <div className="absolute top-full mt-2 w-40 bg-white border border-gray-100 shadow-2xl rounded-xl p-2 z-50 grid grid-cols-1 overflow-y-auto max-h-60">
                      {mesesNome.map((m, idx) => (
                        <button key={m} onClick={() => mudarPeriodo(idx + 1, anoAtual)} className={`text-left px-3 py-2 rounded-lg text-[11px] font-bold ${mesAtual === idx + 1 ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-500'}`}>{m}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button onClick={() => setIsYearOpen(!isYearOpen)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-emerald-900 rounded-lg text-xs font-bold text-emerald-100 transition-all">
                    {anoAtual} <ChevronDown size={12} />
                  </button>
                  {isYearOpen && (
                    <div className="absolute top-full mt-2 w-28 bg-white border border-gray-100 shadow-2xl rounded-xl p-2 z-50 flex flex-col gap-1">
                      {anos.map(a => (
                        <button key={a} onClick={() => mudarPeriodo(mesAtual, a)} className={`text-left px-3 py-2 rounded-lg text-[11px] font-bold ${anoAtual === a ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-500'}`}>{a}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* GESTÃO DO NEGÓCIO (DESKTOP) */}
            <div className="relative hidden md:block">
              <button onClick={() => setIsNegocioOpen(!isNegocioOpen)} className="flex items-center gap-2 px-4 py-2 bg-emerald-900 border border-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-all shadow-md">
                <Building2 size={14} className="text-emerald-400" />
                {negocioSelecionado?.nome || 'Selecionar Negócio'}
                <ChevronDown size={14} className="opacity-50" />
              </button>
              {isNegocioOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 z-50">
                  {negocios.map(n => (
                    <button key={n.id} onClick={() => selecionarNegocio(n)} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${negocioSelecionado?.id === n.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-600'}`}>
                      <Briefcase size={14} /> {n.nome}
                    </button>
                  ))}
                  <div className="h-px bg-gray-100 my-2" />
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2">
                    <LogOut size={14} /> Sair
                  </button>
                </div>
              )}
            </div>

            {/* BOTÃO MENU SANDUÍCHE (MOBILE) */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="md:hidden p-2 bg-emerald-900 border border-emerald-800 rounded-xl text-emerald-100 active:scale-95 transition-all"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO SECUNDÁRIA (DESKTOP) */}
        <div className="bg-emerald-900 border-b border-emerald-800 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-8">
            <Link to="/dashboard" className={`py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${location.pathname.includes('dashboard') ? 'border-white text-white' : 'border-transparent text-emerald-300 hover:text-white'}`}>
              <LayoutDashboard size={14} /> Fluxo de Caixa
            </Link>
            <Link to="/clientes" className={`py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${location.pathname.includes('clientes') ? 'border-white text-white' : 'border-transparent text-emerald-300 hover:text-white'}`}>
              <Users size={14} /> Meus Clientes
            </Link>
            <Link to="/relatorios" className={`py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${location.pathname.includes('relatorios') ? 'border-white text-white' : 'border-transparent text-emerald-300 hover:text-white'}`}>
              <BarChart3 size={14} /> Análise Geral
            </Link>
          </div>
        </div>

        {/* MENU MOBILE EXPANSÍVEL (O CORRIGIDO) */}
        {isMenuOpen && (
          <div className="md:hidden bg-emerald-900 border-t border-emerald-800 animate-in slide-in-from-top duration-300">
            <div className="p-4 space-y-2">
              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-4 bg-emerald-950/50 rounded-2xl text-white font-bold text-sm">
                <LayoutDashboard size={18} className="text-emerald-400" /> Fluxo de Caixa
              </Link>
              <Link to="/clientes" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-4 bg-emerald-950/50 rounded-2xl text-white font-bold text-sm">
                <Users size={18} className="text-emerald-400" /> Meus Clientes
              </Link>
              <Link to="/relatorios" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-4 bg-emerald-950/50 rounded-2xl text-white font-bold text-sm">
                <BarChart3 size={18} className="text-emerald-400" /> Análise Geral
              </Link>
              
              <div className="h-px bg-emerald-800 my-4" />
              
              {/* SELETOR DE NEGÓCIO NO MOBILE */}
              <div className="p-2">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 px-2">Trocar Negócio</p>
                <div className="space-y-1">
                  {negocios.map(n => (
                    <button key={n.id} onClick={() => selecionarNegocio(n)} className={`w-full text-left p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${negocioSelecionado?.id === n.id ? 'bg-white text-emerald-900' : 'text-emerald-200 hover:bg-emerald-800'}`}>
                      <Briefcase size={14} /> {n.nome}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleLogout} className="w-full mt-4 flex items-center gap-3 p-4 text-red-400 font-bold text-sm border-t border-emerald-800">
                <LogOut size={18} /> Sair do Sistema
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-emerald-950 border-t border-emerald-900 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center">
          <img src={logoImg} alt="Autonomax" className="h-8 w-auto grayscale opacity-40" />
          <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">
            © 2026 Autonomax - Gestão de Sucesso
          </p>
        </div>
      </footer>
    </div>
  );
}