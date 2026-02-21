import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Menu, X, ChevronDown, Calendar, 
  LayoutDashboard, Users, BarChart3, LogOut,
  Briefcase, User as UserIcon, Building2
} from 'lucide-react';
import api from '../services/api';

interface Negocio {
  id: number;
  nome: string;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { mes, ano } = useParams();
  
  // Estados de Menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isNegocioOpen, setIsNegocioOpen] = useState(false);
  
  // Estados de Dados
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [negocioSelecionado, setNegocioSelecionado] = useState<Negocio | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const mesAtual = Number(mes) || new Date().getMonth() + 1;
  const anoAtual = Number(ano) || new Date().getFullYear();
  const mesesNome = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const anos = [2024, 2025, 2026, 2027];

  // FECHAR AO CLICAR FORA
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

  // CARREGAR NEGÓCIOS
  useEffect(() => {
    async function carregarNegocios() {
      try {
        const response = await api.get('/Negocios');
        setNegocios(response.data);
        const savedId = localStorage.getItem('@Autonomax:selectedNegocioId');
        if (savedId) {
          const found = response.data.find((n: Negocio) => n.id === Number(savedId));
          if (found) setNegocioSelecionado(found);
        } else if (response.data.length > 0) {
          selecionarNegocio(response.data[0]);
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
    window.location.reload(); // Recarrega para atualizar todos os contextos
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const mudarPeriodo = (novoMes: number, novoAno: number) => {
    navigate(`/dashboard/${novoMes}/${novoAno}`);
    setIsMonthOpen(false);
    setIsYearOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" ref={menuRef}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            {/* LOGO ORIGINAL */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Briefcase className="text-white" size={20} />
              </div>
              <span className="text-lg font-black text-gray-800 tracking-tighter">AUTONOMA<span className="text-blue-600">X</span></span>
            </Link>

            <div className="hidden lg:h-6 lg:w-px lg:bg-gray-200 lg:block" />

            {/* SELETORES DE DATA (SÓ APARECEM NO DASHBOARD OU RELATÓRIOS) */}
            {(location.pathname.includes('dashboard') || location.pathname.includes('relatorios')) && (
              <div className="hidden md:flex items-center gap-2">
                <div className="relative">
                  <button onClick={() => setIsMonthOpen(!isMonthOpen)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-600 transition-all">
                    {mesesNome[mesAtual - 1]} <ChevronDown size={12} />
                  </button>
                  {isMonthOpen && (
                    <div className="absolute top-full mt-2 w-40 bg-white border border-gray-100 shadow-2xl rounded-xl p-2 z-50 grid grid-cols-1 overflow-y-auto max-h-60">
                      {mesesNome.map((m, idx) => (
                        <button key={m} onClick={() => mudarPeriodo(idx + 1, anoAtual)} className={`text-left px-3 py-2 rounded-lg text-[11px] font-bold ${mesAtual === idx + 1 ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-500'}`}>{m}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button onClick={() => setIsYearOpen(!isYearOpen)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-600 transition-all">
                    {anoAtual} <ChevronDown size={12} />
                  </button>
                  {isYearOpen && (
                    <div className="absolute top-full mt-2 w-28 bg-white border border-gray-100 shadow-2xl rounded-xl p-2 z-50 flex flex-col gap-1">
                      {anos.map(a => (
                        <button key={a} onClick={() => mudarPeriodo(mesAtual, a)} className={`text-left px-3 py-2 rounded-lg text-[11px] font-bold ${anoAtual === a ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-500'}`}>{a}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* GESTÃO DO NEGÓCIO SELECIONADO */}
            <div className="relative hidden md:block">
              <button onClick={() => setIsNegocioOpen(!isNegocioOpen)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg shadow-gray-200">
                <Building2 size={14} className="text-blue-400" />
                {negocioSelecionado?.nome || 'Selecionar Negócio'}
                <ChevronDown size={14} className="opacity-50" />
              </button>
              {isNegocioOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 z-50">
                  <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Meus Negócios</p>
                  {negocios.map(n => (
                    <button key={n.id} onClick={() => selecionarNegocio(n)} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${negocioSelecionado?.id === n.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}>
                      <Briefcase size={14} /> {n.nome}
                    </button>
                  ))}
                  <div className="h-px bg-gray-100 my-2" />
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2">
                    <LogOut size={14} /> Sair do Sistema
                  </button>
                </div>
              )}
            </div>

            {/* PERFIL / LOGOUT RAPIDO */}
            <button onClick={handleLogout} className="md:hidden p-2 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={22} />
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 bg-gray-100 rounded-lg text-gray-600">
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO SECUNDÁRIA (TABS) */}
        <div className="bg-white border-b border-gray-100 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-8">
            <Link to="/dashboard" className={`py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${location.pathname.includes('dashboard') ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <LayoutDashboard size={14} /> Fluxo de Caixa
            </Link>
            <Link to="/clientes" className={`py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${location.pathname.includes('clientes') ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <Users size={14} /> Meus Clientes
            </Link>
            <Link to="/relatorios" className={`py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${location.pathname.includes('relatorios') ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <BarChart3 size={14} /> Análise Geral
            </Link>
          </div>
        </div>

        {/* MENU MOBILE */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-6 space-y-6 animate-in slide-in-from-top duration-300">
            <div className="space-y-3">
              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl font-bold text-gray-700"><LayoutDashboard size={18}/> Dashboard</Link>
              <Link to="/clientes" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl font-bold text-gray-700"><Users size={18}/> Clientes</Link>
              <Link to="/relatorios" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl font-bold text-gray-700"><BarChart3 size={18}/> Estatísticas</Link>
            </div>
            <div className="pt-4 border-t">
              <button onClick={handleLogout} className="w-full p-3 flex items-center gap-3 text-red-500 font-bold"><LogOut size={18}/> Encerrar Sessão</button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}