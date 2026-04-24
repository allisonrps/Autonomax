import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Perfil } from './pages/Perfil';
import { Clientes } from './pages/Clientes';
import { DetalhesCliente } from './pages/DetalhesCliente';
import { Relatorios } from './pages/Relatorios';
import { Fornecedores } from './pages/Fornecedores';
import { DetalhesFornecedor } from './pages/DetalhesFornecedor';

interface ProtectedRouteProps {
  children: ReactNode;
}

// COMPONENTE DE PROTEÇÃO COM TELA DE AVISO
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('@Autonomax:token');
  const location = useLocation();

  if (!token) {
    return (
      <div className="min-h-screen bg-emerald-50/30 flex items-center justify-center p-4 font-sans text-gray-800">
        <div className="max-w-md w-full bg-white rounded-[40px] border border-gray-200 shadow-2xl p-10 text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
            <Lock size={40} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tight">Acesso Restrito</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              Sua sessão expirou ou você não está logado. Para visualizar os dados do Autonomax, realize o acesso.
            </p>
          </div>

          <Link 
            to="/" 
            className="flex items-center justify-center gap-3 w-full bg-emerald-950 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 border-none"
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

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rotas Protegidas envolvidas pela lógica de segurança */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/:mes/:ano" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
        <Route path="/clientes/:id" element={<ProtectedRoute><DetalhesCliente /></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
        <Route path="/fornecedores" element={<ProtectedRoute><Fornecedores /></ProtectedRoute>} />
        <Route path="/fornecedores/:id" element={<ProtectedRoute><DetalhesFornecedor /></ProtectedRoute>} />
        
        {/* Redirecionamento Global para o Login (Raiz) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;