import React, { useState } from 'react';
import api from '../services/api';
import { UserPlus, User, Mail, Lock, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');

    if (senha !== confirmarSenha) {
      setErro('As senhas não conferem.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/Auth/register', { nome, email, senha });
      alert('Conta criada com sucesso! Agora você pode fazer login.');
      window.location.href = '/';
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao criar conta. Tente outro e-mail.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-950 px-4 relative overflow-hidden">
      
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-emerald-800 rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500 rounded-full blur-[150px] opacity-10"></div>

      <div className="max-w-lg w-full z-10 py-10">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-emerald-900/10">
          
          {/* Botão Voltar */}
          <div className="mb-8">
            <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-all group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Login
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex p-3 bg-emerald-50 rounded-2xl text-emerald-600 mb-4">
              <UserPlus size={28} />
            </div>
            <h1 className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em] mb-2">Comece sua jornada</h1>
            <p className="text-gray-400 text-sm font-medium italic">Junte-se ao Autonomax e simplifique sua gestão</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Campo Nome */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-700 transition-all placeholder:text-gray-300"
                  placeholder="Como quer ser chamado?"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
              </div>
            </div>

            {/* Campo E-mail */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail Principal</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-700 transition-all placeholder:text-gray-300"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Grid Senhas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-700 transition-all placeholder:text-gray-300 text-sm"
                    placeholder="••••••••"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirmar</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-700 transition-all placeholder:text-gray-300 text-sm"
                    placeholder="••••••••"
                    value={confirmarSenha}
                    onChange={e => setConfirmarSenha(e.target.value)}
                  />
                </div>
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Criar minha conta <Sparkles size={18} /></>
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-emerald-600/40 font-black uppercase tracking-[0.4em]">
          Autonomax © 2026
        </p>
      </div>
    </div>
  );
}