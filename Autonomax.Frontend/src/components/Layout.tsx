import React, { useState, useEffect } from 'react';
// 1. Importe o Link e o useNavigate
import { Link, useNavigate } from 'react-router-dom'; 
import { LogOut, User, LayoutDashboard, Calendar, ChevronDown, Check, Users } from 'lucide-react';
import logoHorizontalImg from '../assets/logo-horizontal.png';
import api from '../services/api';

interface Negocio {
  id: number;
  nome: string;
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate(); // Hook para navegação programática
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isNegocioOpen, setIsNegocioOpen] = useState(false);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [negocioAtivo, setNegocioAtivo] = useState<Negocio | null>(null);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    async function carregarNegocios() {
      try {
        const response = await api.get('/Negocios');
        setNegocios(response.data);

        const savedId = localStorage.getItem('@Autonomax:selectedNegocioId');
        
        if (savedId && response.data.length > 0) {
          const encontrado = response.data.find((n: Negocio) => n.id === Number(savedId));
          setNegocioAtivo(encontrado || response.data[0]);
        } else if (response.data.length > 0) {
          setNegocioAtivo(response.data[0]);
          localStorage.setItem('@Autonomax:selectedNegocioId', response.data[0].id.toString());
        }
      } catch (err) {
        console.error("Erro ao carregar menu de negócios");
      }
    }

    carregarNegocios();
  }, []);

  const handleTrocarNegocio = (negocio: Negocio) => {
    setNegocioAtivo(negocio);
    localStorage.setItem('@Autonomax:selectedNegocioId', negocio.id.toString());
    setIsNegocioOpen(false);
    // Em vez de reload, o useEffect do Dashboard vai detectar a mudança se o ID estiver no localStorage
    window.location.reload(); 
  };

  const handleLogout = () => {
    localStorage.removeItem('@Autonomax:token');
    localStorage.removeItem('@Autonomax:user');
    localStorage.removeItem('@Autonomax:selectedNegocioId');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            {/* Logo usando Link para não recarregar */}
            <Link to="/dashboard" className="flex items-center">
              <img src={logoHorizontalImg} alt="Autonomax" className="h-8 w-auto object-contain" />
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              {/* Menu Negócios */}
              <div className="relative">
                <button 
                  onClick={() => setIsNegocioOpen(!isNegocioOpen)}
                  className="flex items-center gap-1 text-gray-700 hover:text-blue-600 font-semibold transition-colors"
                >
                  <LayoutDashboard size={18} className="text-blue-600" />
                  {negocioAtivo ? negocioAtivo.nome : 'Selecionar Negócio'} 
                  <ChevronDown size={14} className="ml-1" />
                </button>

                {isNegocioOpen && (
                  <div className="absolute top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-[60]">
                    <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Meus Negócios</p>
                    {negocios.map(negocio => (
                      <button 
                        key={negocio.id}
                        onClick={() => handleTrocarNegocio(negocio)}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-blue-50 transition-colors ${negocioAtivo?.id === negocio.id ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-600'}`}
                      >
                        {negocio.nome}
                        {negocioAtivo?.id === negocio.id && <Check size={14} />}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <Link to="/perfil" className="w-full block text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-50 font-medium">
                        + Gerenciar Negócios
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Meses - CORRIGIDO COM LINK */}
              <div className="relative">
                <button onClick={() => setIsMonthOpen(!isMonthOpen)} className="flex items-center gap-1 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  <Calendar size={18} />
                  2026 <ChevronDown size={14} />
                </button>
                {isMonthOpen && (
                  <div className="absolute top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 h-64 overflow-y-auto z-[60]">
                    <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase">Selecionar Mês</p>
                    {meses.map((mes, index) => (
                      <Link 
                        key={mes} 
                        to={`/dashboard/${index + 1}/2026`}
                        onClick={() => setIsMonthOpen(false)} // Fecha o menu ao clicar
                        className="block px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        {mes}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/clientes" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                <Users size={18} />
                Clientes
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/perfil" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 font-medium">
              <User size={18} /> Perfil
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1 text-red-500 hover:text-red-600 font-medium">
              <LogOut size={18} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">© 2026 Autonomax - Gestão para Autônomos</p>
        </div>
      </footer>
    </div>
  );
}