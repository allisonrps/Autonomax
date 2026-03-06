import React, { useState } from 'react';
import api from '../services/api';
import { 
  Mail, Lock, Loader2, ArrowRight, ShieldCheck, 
  BarChart3, Briefcase, TrendingUp, Users, Truck, Package 
} from 'lucide-react';
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
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      
      {/* LADO ESQUERDO: VITRINE DE FUNCIONALIDADES */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-emerald-950 relative overflow-hidden flex-col justify-between p-12 lg:p-16">
        {/* Efeitos de Fundo (Blur) */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-800 rounded-full blur-[120px] opacity-30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[150px] opacity-20"></div>

        <div className="z-10">
           <img src={logoImg} alt="Autonomax" className="h-10 w-auto brightness-0 invert opacity-90 mb-12" />
           
           <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Controle total do seu <br /> 
                <span className="text-emerald-400">ecossistema autônomo.</span>
              </h2>
              <p className="text-emerald-100/60 text-lg max-w-md font-medium leading-relaxed">
                Desenvolvido para centralizar sua gestão com tecnologia de ponta e clareza analítica.
              </p>
           </div>

           {/* GRID DE FEATURES DETALHADAS */}
           <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-y-8 gap-x-12">
             <div className="flex gap-4">
               <div className="p-3 bg-white/5 rounded-2xl text-emerald-400 h-fit"><Briefcase size={22}/></div>
               <div>
                 <h4 className="text-white font-bold text-sm">Multi-Negócios</h4>
                 <p className="text-emerald-100/40 text-xs mt-1">Gerencie múltiplas empresas em um único perfil seguro.</p>
               </div>
             </div>
             
             <div className="flex gap-4">
               <div className="p-3 bg-white/5 rounded-2xl text-emerald-400 h-fit"><TrendingUp size={22}/></div>
               <div>
                 <h4 className="text-white font-bold text-sm">Fluxo de Caixa</h4>
                 <p className="text-emerald-100/40 text-xs mt-1">Lançamentos detalhados com histórico inteligente e retroativo.</p>
               </div>
             </div>

             <div className="flex gap-4">
               <div className="p-3 bg-white/5 rounded-2xl text-emerald-400 h-fit"><Users size={22}/></div>
               <div>
                 <h4 className="text-white font-bold text-sm">Gestão de Clientes</h4>
                 <p className="text-emerald-100/40 text-xs mt-1">CRM integrado para identificar seus maiores parceiros comerciais.</p>
               </div>
             </div>

             <div className="flex gap-4">
               <div className="p-3 bg-white/5 rounded-2xl text-emerald-400 h-fit"><Truck size={22}/></div>
               <div>
                 <h4 className="text-white font-bold text-sm">Parceiros & Custos</h4>
                 <p className="text-emerald-100/40 text-xs mt-1">Vínculo direto com fornecedores para controle total de despesas.</p>
               </div>
             </div>

             <div className="flex gap-4">
               <div className="p-3 bg-white/5 rounded-2xl text-emerald-400 h-fit"><BarChart3 size={22}/></div>
               <div>
                 <h4 className="text-white font-bold text-sm">Estatísticas Anuais</h4>
                 <p className="text-emerald-100/40 text-xs mt-1">Visão analítica de lucros, receitas e tendências de mercado.</p>
               </div>
             </div>

             <div className="flex gap-4">
               <div className="p-3 bg-white/5 rounded-2xl text-emerald-400 h-fit"><Package size={22}/></div>
               <div>
                 <h4 className="text-white font-bold text-sm">Top Performance</h4>
                 <p className="text-emerald-100/40 text-xs mt-1">Rankings automáticos de produtos, serviços e rentabilidade.</p>
               </div>
             </div>
           </div>
        </div>

        {/* Rodapé Interno Visual */}
        <div className="z-10 flex items-center gap-3 border-t border-white/10 pt-8">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><ShieldCheck size={18}/></div>
          <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Sistema Seguro</span>
        </div>
      </div>

      {/* LADO DIREITO: FORMULÁRIO DE LOGIN */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-gray-50">
        <div className="max-w-md w-full space-y-10">
          
          <div className="md:hidden flex justify-center mb-8">
            <img src={logoImg} alt="Autonomax" className="h-24 w-auto object-contain" />
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Acesse o Painel</h3>
            <p className="text-gray-500 font-medium">Insira suas credenciais para gerenciar seu negócio.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-bold text-gray-700 transition-all placeholder:text-gray-300 shadow-sm"
                    placeholder="exemplo@dominio.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Senha</label>
                  <button type="button" className="text-[11px] font-black text-emerald-600 uppercase hover:text-emerald-700">Recuperar acesso</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input
                    type="password"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-bold text-gray-700 transition-all placeholder:text-gray-300 shadow-sm"
                    placeholder="••••••••"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-xs font-bold p-4 rounded-2xl text-center">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl transition-all shadow-xl shadow-emerald-200 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Entrar na Plataforma <ArrowRight size={18} /></>}
            </button>

            <div className="pt-6 text-center border-t border-gray-100">
              <p className="text-sm text-gray-500 font-medium">
                Não possui conta?{' '}
                <button 
                  type="button"
                  onClick={() => window.location.href = '/register'}
                  className="text-emerald-600 hover:text-emerald-700 font-black uppercase text-xs tracking-widest ml-1"
                >
                  Cadastre-se agora
                </button>
              </p>
            </div>
          </form>

          <p className="text-center text-[9px] text-gray-600 font-black uppercase tracking-[0.4em]">
            Autonomax © 2026 • Desenvolvido por Allison Rodrigues
          </p>
        </div>
      </div>
    </div>
  );
}