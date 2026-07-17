import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, ChevronDown, LayoutDashboard, Users, 
  BarChart3, LogOut, Briefcase, Building2, User, Truck 
} from 'lucide-react';
import api from '../services/api';
import logoImg from '../assets/logo-horizontal-white.png';

interface Negocio { id: number; nome: string; }

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNegocioOpen, setIsNegocioOpen] = useState(false);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [negocioSelecionado, setNegocioSelecionado] = useState<Negocio | null>(null);

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
      } catch (err) { console.error("Erro ao carregar negócios"); }
    }
    carregarNegocios();
  }, []);

  const selecionarNegocio = (n: Negocio) => {
    localStorage.setItem('@Autonomax:selectedNegocioId', String(n.id));
    setIsNegocioOpen(false);
    window.location.reload();
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const navLinks = [
    { name: 'Fluxo de Caixa', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Parceiros', path: '/fornecedores', icon: Truck },
    { name: 'Análise', path: '/relatorios', icon: BarChart3 },
    { name: 'Perfil', path: '/perfil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans">
      
      {/* HEADER GLASSMOPHIC - Alinhado aos limites das páginas */}
      <header className="sticky top-0 z-[100] border-b border-gray-800/60 bg-gray-900/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          
          {/* Logo e Navegação */}
          <div className="flex items-center gap-8">
            <Link to="/perfil" className="flex-shrink-0">
              <img src={logoImg} alt="Logo" className="h-7 w-auto opacity-90 hover:opacity-100 transition-opacity" />
            </Link>
            
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map(link => (
                <Link key={link.path} to={link.path} className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${location.pathname.includes(link.path.replace('/', '')) ? 'text-emerald-400' : 'text-gray-500 hover:text-white'}`}>
                  <link.icon size={13} /> {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Ações Direitas */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setIsNegocioOpen(!isNegocioOpen)} className="flex items-center gap-2 px-4 py-2 bg-gray-950 border border-gray-800 text-gray-400 rounded-md text-[10px] font-black uppercase tracking-widest hover:border-emerald-600 hover:text-emerald-400 transition-all">
                <Building2 size={12} />
                {negocioSelecionado?.nome.substring(0, 8) || 'Negócio'}
                <ChevronDown size={12} />
              </button>
              {isNegocioOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-md p-1 shadow-2xl z-50">
                  {negocios.map(n => (
                    <button key={n.id} onClick={() => selecionarNegocio(n)} className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-300 hover:bg-gray-800 rounded flex items-center gap-2">
                      <Briefcase size={12} /> {n.nome}
                    </button>
                  ))}
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-[10px] font-black text-red-400 hover:bg-red-950/30 rounded mt-1 uppercase">Sair</button>
                </div>
              )}
            </div>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-gray-400 hover:text-white">
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* MENU MOBILE */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 w-full bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 p-4 space-y-2">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 text-white font-bold text-xs uppercase bg-gray-950 rounded-lg">
                <link.icon size={14} className="text-emerald-500"/> {link.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* FOOTER MINIMALISTA */}
      <footer className="py-8 text-center border-t border-gray-900/50">
        <p className="text-emerald-900 font-black text-[9px] uppercase tracking-[0.3em]">Autonomax © 2026</p>
      </footer>
    </div>
  );
}