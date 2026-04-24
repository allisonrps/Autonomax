import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';

interface PrivateRouteProps {
  children: ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const token = localStorage.getItem('@Autonomax:token');
  const location = useLocation();

  // Se NÃO existir token, exibe a tela de aviso
  if (!token) {
    return (
      <div className="min-h-screen bg-emerald-50/30 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-[40px] border border-gray-200 shadow-2xl p-10 text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
            <Lock size={40} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Sessão Expirada</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              Para garantir a segurança dos seus dados financeiros, você precisa realizar o acesso novamente.
            </p>
          </div>

          <Link 
            to="/login" 
            state={{ from: location }} // Guarda de onde o usuário veio
            className="flex items-center justify-center gap-3 w-full bg-emerald-950 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95"
          >
            <LogIn size={18} />
            Ir para Login
          </Link>
          
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            Autonomax Security System
          </p>
        </div>
      </div>
    );
  }

  // Se existir token, renderiza a página normalmente
  return <>{children}</>;
}