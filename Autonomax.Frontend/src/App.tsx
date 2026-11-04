import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';
import { LoadingProgress } from './components/LoadingProgress';
import { isTokenExpired } from './utils/auth';

// Lazy loading das páginas para Code Splitting de alta performance
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const FluxoCaixa = lazy(() => import('./pages/FluxoCaixa').then(m => ({ default: m.FluxoCaixa })));
const Perfil = lazy(() => import('./pages/Perfil').then(m => ({ default: m.Perfil })));
const Clientes = lazy(() => import('./pages/Clientes').then(m => ({ default: m.Clientes })));
const DetalhesCliente = lazy(() => import('./pages/DetalhesCliente').then(m => ({ default: m.DetalhesCliente })));
const Relatorios = lazy(() => import('./pages/Relatorios').then(m => ({ default: m.Relatorios })));
const Fornecedores = lazy(() => import('./pages/Fornecedores').then(m => ({ default: m.Fornecedores })));
const DetalhesFornecedor = lazy(() => import('./pages/DetalhesFornecedor').then(m => ({ default: m.DetalhesFornecedor })));
const Catalogo = lazy(() => import('./pages/Catalogo').then(m => ({ default: m.Catalogo })));
const DetalhesProduto = lazy(() => import('./pages/DetalhesProduto').then(m => ({ default: m.DetalhesProduto })));
const EsqueceuSenha = lazy(() => import('./pages/EsqueceuSenha').then(m => ({ default: m.EsqueceuSenha })));

interface ProtectedRouteProps {
  children: ReactNode;
}

// COMPONENTE DE PROTEÇÃO COM TELA DE AVISO
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const rawToken = localStorage.getItem('@Autonomax:token');
  const tokenValido = rawToken && !isTokenExpired(rawToken);

  if (!tokenValido) {
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
            to="/login" 
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
      <Suspense fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <LoadingProgress message="Carregando..." />
        </div>
      }>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rotas Protegidas envolvidas pela lógica de segurança */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/fluxo-caixa" element={<ProtectedRoute><FluxoCaixa /></ProtectedRoute>} />
          <Route path="/fluxo-caixa/:mes/:ano" element={<ProtectedRoute><FluxoCaixa /></ProtectedRoute>} />
          <Route path="/dashboard/:mes/:ano" element={<Navigate to="/fluxo-caixa" replace />} />
          <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
          <Route path="/clientes/:id" element={<ProtectedRoute><DetalhesCliente /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
          <Route path="/catalogo" element={<ProtectedRoute><Catalogo /></ProtectedRoute>} />
          <Route path="/catalogo/:id" element={<ProtectedRoute><DetalhesProduto /></ProtectedRoute>} />
          <Route path="/fornecedores" element={<ProtectedRoute><Fornecedores /></ProtectedRoute>} />
          <Route path="/fornecedores/:id" element={<ProtectedRoute><DetalhesFornecedor /></ProtectedRoute>} />
          <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
          
          {/* Redirecionamento Global para o Login (Raiz) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;