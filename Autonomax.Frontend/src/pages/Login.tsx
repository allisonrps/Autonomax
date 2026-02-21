import React, { useState } from 'react';
import api from '../services/api';
import { LogIn, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import logoImg from '../assets/logo.png';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const response = await api.post('/Auth/login', { email, senha });
      
      localStorage.setItem('@Autonomax:token', response.data.token);
      localStorage.setItem('@Autonomax:user', JSON.stringify(response.data.usuario));


      window.location.href = '/perfil';
    } catch (err: any) {
      setErro(err.response?.data?.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-950 px-4 relative overflow-hidden">
      
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-emerald-800 rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500 rounded-full blur-[150px] opacity-10"></div>

      <div className="max-w-md w-full z-10">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-emerald-900/10">
          
          {/* Header com Logo */}
          <div className="text-center mb-10">
            <div className="flex flex-col items-center justify-center mb-6">
              <img 
                src={logoImg} 
                alt="Autonomax Logo" 
                className="h-40 w-auto object-contain" 
              />
            </div>
            <h1 className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em] mb-2">Bem-vindo de volta</h1>
            <p className="text-gray-400 text-sm font-medium italic">Acesse sua conta para gerenciar seu sucesso!</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Campo E-mail */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-700 transition-all placeholder:text-gray-300"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Senha de Acesso</label>
                <button type="button" className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Esqueceu?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-700 transition-all placeholder:text-gray-300"
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                />
              </div>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-[11px] font-bold p-3 rounded-xl text-center animate-in fade-in slide-in-from-top-1">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Acessar Painel <ArrowRight size={18} /></>
              )}
            </button>

            <div className="pt-4 text-center">
              <p className="text-sm text-gray-400 font-medium">
                Novo por aqui?{' '}
                <button 
                  type="button"
                  onClick={() => window.location.href = '/register'}
                  className="text-emerald-600 hover:text-emerald-700 font-black uppercase text-xs tracking-wider ml-1"
                >
                  Criar minha conta
                </button>
              </p>
            </div>
          </form>
        </div>
        
        {/* Rodapé do Login */}
        <p className="mt-8 text-center text-[10px] text-emerald-600/40 font-black uppercase tracking-[0.4em]">
          Autonomax © 2026
        </p>
      </div>
    </div>
  );
}