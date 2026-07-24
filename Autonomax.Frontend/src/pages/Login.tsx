import React, { useState } from 'react';
import api from '../services/api';
import { 
  Mail, Lock, Loader2, ArrowRight, ShieldCheck, 
  Briefcase, TrendingUp, Users, Truck, BarChart3, Package 
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
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 font-sans text-gray-100">
      
      {/* LADO ESQUERDO: VITRINE */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-gray-900 border-r border-gray-800 relative overflow-hidden flex-col justify-between p-12 lg:p-16">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[160px] pointer-events-none"></div>

        <div className="z-10">
           <img src={logoImg} alt="Autonomax" className="h-10 w-auto object-contain mb-12 opacity-90" />
           <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tight leading-tight">
                Controle total do seu <br /> 
                <span className="text-emerald-400">ecossistema autônomo.</span>
              </h2>
              <p className="text-gray-400 text-xs font-medium max-w-md leading-relaxed uppercase tracking-wider">
                Desenvolvido para centralizar sua gestão com tecnologia de ponta e clareza analítica.
              </p>
           </div>

           <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
             {[ 
               {i: Briefcase, t: 'Multi-Negócios'}, 
               {i: TrendingUp, t: 'Fluxo de Caixa'}, 
               {i: Users, t: 'Gestão de Clientes'}, 
               {i: Truck, t: 'Parceiros & Custos'}, 
               {i: BarChart3, t: 'Estatísticas'}, 
               {i: Package, t: 'Top Performance'} 
             ].map((f, idx) => (
                <div key={idx} className="flex items-center gap-3.5 bg-gray-950/60 p-3.5 rounded-lg border border-gray-800/80 hover:border-gray-700 transition-all">
                  <div className="p-2 bg-emerald-950/40 text-emerald-400 rounded border border-emerald-900/40 h-fit">
                    <f.i size={18}/>
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-bold text-xs uppercase tracking-wider">{f.t}</h4>
                  </div>
                </div>
             ))}
           </div>
        </div>

        <div className="z-10 flex items-center gap-3 border-t border-gray-800/80 pt-6">
          <div className="p-2 bg-emerald-950/40 border border-emerald-900/40 rounded-lg text-emerald-400"><ShieldCheck size={16}/></div>
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Ambiente Seguro & Criptografado</span>
        </div>
      </div>

      {/* LADO DIREITO: LOGIN */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gray-950">
        <div className="max-w-md w-full bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl space-y-6">
          <div className="flex justify-center">
            <img src={logoImg} alt="Autonomax" className="h-14 w-auto object-contain" />
          </div>

          <div className="space-y-1 text-center">
            <h3 className="text-xl font-black text-white uppercase tracking-widest">Acesso ao Sistema</h3>
            <p className="text-xs text-gray-500 font-medium">Insira suas credenciais para continuar.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type="email" required className="w-full pl-11 pr-4 py-3.5 bg-gray-950 border border-gray-800 rounded-md focus:border-emerald-600 outline-none font-bold text-sm text-white transition-all placeholder-gray-700" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type="password" required className="w-full pl-11 pr-4 py-3.5 bg-gray-950 border border-gray-800 rounded-md focus:border-emerald-600 outline-none font-bold text-sm text-white transition-all placeholder-gray-700" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} />
              </div>
              {/* Link de recuperar senha posicionado abaixo do input de senha */}
              <div className="flex justify-end pt-1">
                <button type="button" onClick={() => window.location.href = '/esqueceu-senha'} className="text-[9px] font-black text-emerald-500 uppercase hover:text-emerald-400 cursor-pointer">
                  Esqueceu sua senha?
                </button>
              </div>
            </div>

            {erro && <div className="text-[10px] font-black text-red-400 bg-red-950/30 p-3 rounded-md text-center uppercase tracking-widest border border-red-900/50">{erro}</div>}

            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-md transition-all flex items-center justify-center gap-2 border border-emerald-700 mt-2 cursor-pointer">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <>Entrar no Sistema <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-800 text-center">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              Não possui conta? <button type="button" onClick={() => window.location.href = '/register'} className="text-emerald-500 hover:text-emerald-400 font-black ml-1 uppercase cursor-pointer">Cadastre-se</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}