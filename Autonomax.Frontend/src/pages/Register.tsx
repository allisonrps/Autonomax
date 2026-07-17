import React, { useState } from 'react';
import api from '../services/api';
import { 
  User, Mail, Lock, ArrowLeft, 
  Loader2, Sparkles, ShieldCheck 
} from 'lucide-react';
import logoImg from '../assets/logo.png';

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
      await api.post('/Auth/register', { Nome: nome, Email: email, Senha: senha });
      alert('Conta criada com sucesso! Agora você pode fazer login.');
      window.location.href = '/';
    } catch (err: any) {
      const mensagemServidor = err.response?.data?.message || err.response?.data || 'Erro ao criar conta.';
      setErro(typeof mensagemServidor === 'string' ? mensagemServidor : 'Erro na validação dos dados.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-sans">
      
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logoImg} alt="Autonomax" className="h-12 w-auto object-contain opacity-90" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-widest">Criar Conta</h1>
            <p className="text-xs text-gray-500 font-medium mt-1">Junte-se ao ecossistema Autonomax</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input type="text" required className="w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-md focus:border-emerald-600 outline-none font-bold text-sm text-white" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input type="email" required className="w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-md focus:border-emerald-600 outline-none font-bold text-sm text-white" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type="password" required className="w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-md focus:border-emerald-600 outline-none font-bold text-sm text-white" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirmar</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type="password" required className="w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-md focus:border-emerald-600 outline-none font-bold text-sm text-white" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
          </div>

          {erro && (
            <div className="text-[10px] font-black text-red-400 bg-red-950/30 p-3 rounded-md text-center uppercase tracking-widest border border-red-900/50">
              {erro}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-md transition-all flex items-center justify-center gap-2 border border-emerald-700 mt-2">
            {loading ? <Loader2 className="animate-spin" size={16} /> : <>Criar conta <Sparkles size={16} /></>}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-800 text-center">
          <button onClick={() => window.location.href = '/'} className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-500 uppercase hover:text-white transition-all w-full">
            <ArrowLeft size={14} /> Voltar ao Login
          </button>
        </div>
      </div>
      
      <p className="fixed bottom-8 text-[9px] text-gray-700 font-black uppercase tracking-[0.3em] text-center w-full">
        Autonomax © 2026 • Sistema Seguro <ShieldCheck size={10} className="inline ml-1" />
      </p>
    </div>
  );
}