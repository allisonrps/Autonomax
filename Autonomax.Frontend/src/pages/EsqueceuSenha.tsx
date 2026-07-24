import React, { useState } from 'react';
import api from '../services/api';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import logoImg from '../assets/logo.png';

export function EsqueceuSenha() {
  const [etapa, setEtapa] = useState<'solicitar' | 'redefinir'>('solicitar');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  // Etapa 1: Solicitar o envio do token/instruções para o e-mail
  async function handleSolicitar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setMensagem('');
    try {
      await api.post('/Auth/esqueci-senha', { email });
      setMensagem('Instruções enviadas para o seu e-mail!');
      setEtapa('redefinir');
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao processar solicitação. Verifique o e-mail.');
    } finally {
      setLoading(false);
    }
  }

  // Etapa 2: Redefinir a senha com o token recebido
  async function handleRedefinir(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não conferem!');
      return;
    }
    setLoading(true);
    setErro('');
    setMensagem('');
    try {
      await api.post('/Auth/redefinir-senha-token', { email, token, novaSenha });
      alert('Senha alterada com sucesso!');
      window.location.href = '/login';
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 font-sans text-gray-100">
      
      {/* LADO ESQUERDO: VITRINE */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-gray-900 border-r border-gray-800 relative overflow-hidden flex-col justify-between p-12 lg:p-16">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[160px] pointer-events-none"></div>

        <div className="z-10">
           <img src={logoImg} alt="Autonomax" className="h-10 w-auto object-contain mb-12 opacity-90" />
           <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tight leading-tight">
                Recuperação de <br /> 
                <span className="text-emerald-400">acesso ao sistema.</span>
              </h2>
              <p className="text-gray-400 text-xs font-medium max-w-md leading-relaxed uppercase tracking-wider">
                Siga as etapas para redefinir sua credencial de segurança com total proteção de dados.
              </p>
           </div>
        </div>

        <div className="z-10 flex items-center gap-3 border-t border-gray-800/80 pt-6">
          <div className="p-2 bg-emerald-950/40 border border-emerald-900/40 rounded-lg text-emerald-400"><ShieldCheck size={16}/></div>
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Protocolo Seguro</span>
        </div>
      </div>

      {/* LADO DIREITO: FORMULÁRIO */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gray-950">
        <div className="max-w-md w-full bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl space-y-6">
          <div className="flex justify-center">
            <img src={logoImg} alt="Autonomax" className="h-14 w-auto object-contain" />
          </div>

          <div className="space-y-1 text-center">
            <h3 className="text-xl font-black text-white uppercase tracking-widest">
              {etapa === 'solicitar' ? 'Recuperar Senha' : 'Nova Senha'}
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              {etapa === 'solicitar' ? 'Informe seu e-mail cadastrado.' : 'Digite o código e sua nova senha.'}
            </p>
          </div>

          {etapa === 'solicitar' ? (
            <form onSubmit={handleSolicitar} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input type="email" required className="w-full pl-11 pr-4 py-3.5 bg-gray-950 border border-gray-800 rounded-md focus:border-emerald-600 outline-none font-bold text-sm text-white transition-all placeholder-gray-700" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              {erro && <div className="text-[10px] font-black text-red-400 bg-red-950/30 p-3 rounded-md text-center uppercase tracking-widest border border-red-900/50">{erro}</div>}
              {mensagem && <div className="text-[10px] font-black text-emerald-400 bg-emerald-950/30 p-3 rounded-md text-center uppercase tracking-widest border border-emerald-900/50">{mensagem}</div>}

              <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-md transition-all flex items-center justify-center gap-2 border border-emerald-700 cursor-pointer">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>Enviar Instruções <ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRedefinir} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Código Recebido / Token</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input type="text" required className="w-full pl-11 pr-4 py-3.5 bg-gray-950 border border-gray-800 rounded-md focus:border-emerald-600 outline-none font-bold text-sm text-white transition-all placeholder-gray-700" placeholder="Cole o código aqui" value={token} onChange={e => setToken(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input type="password" required className="w-full pl-11 pr-4 py-3.5 bg-gray-950 border border-gray-800 rounded-md focus:border-emerald-600 outline-none font-bold text-sm text-white transition-all placeholder-gray-700" placeholder="••••••••" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input type="password" required className="w-full pl-11 pr-4 py-3.5 bg-gray-950 border border-gray-800 rounded-md focus:border-emerald-600 outline-none font-bold text-sm text-white transition-all placeholder-gray-700" placeholder="••••••••" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} />
                </div>
                {confirmarSenha && (
                  <p className={`text-[9px] font-bold uppercase mt-1 ml-1 ${novaSenha === confirmarSenha ? 'text-emerald-500' : 'text-red-500'}`}>
                    {novaSenha === confirmarSenha ? '✓ As senhas conferem' : '✕ As senhas não estão iguais'}
                  </p>
                )}
              </div>

              {erro && <div className="text-[10px] font-black text-red-400 bg-red-950/30 p-3 rounded-md text-center uppercase tracking-widest border border-red-900/50">{erro}</div>}

              <button type="submit" disabled={loading || novaSenha !== confirmarSenha} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-md transition-all flex items-center justify-center gap-2 border border-emerald-700 cursor-pointer">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>Salvar Nova Senha <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-gray-800 text-center">
            <button type="button" onClick={() => window.location.href = '/login'} className="text-[10px] text-gray-400 hover:text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 mx-auto cursor-pointer">
              <ArrowLeft size={14} /> Voltar para o Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}