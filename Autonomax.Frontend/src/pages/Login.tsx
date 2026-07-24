import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Mail, Lock, Loader2, ArrowRight, ShieldCheck, 
  Wallet, Users, Truck, PlusCircle, BarChart3,
} from 'lucide-react';
import logoImg from '../assets/logo.png';

import imgAnalitico from '../assets/mobile_analitico.png';
import imgClienteDetalhe from '../assets/mobile_clientedetalhe.png';
import imgFluxo from '../assets/mobile_fluxo.png';
import imgLancamento from '../assets/mobile_lançamento.png';
import imgParceiros from '../assets/mobile_parceiros.png';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const slides = [
    {
      titulo: "Resumo Analítico e Estatísticas",
      descricao: "Acompanhe a evolução mensal e o saldo financeiro em tempo real com clareza.",
      imagem: imgAnalitico,
      icone: BarChart3
    },
    {
      titulo: "Gestão Completa de Clientes",
      descricao: "Visualize faturamento total, ticket médio e histórico de pedidos por cliente.",
      imagem: imgClienteDetalhe,
      icone: Users
    },
    {
      titulo: "Fluxo de Caixa Dinâmico",
      descricao: "Filtre receitas, despesas e transações com controle total de status e pagamentos.",
      imagem: imgFluxo,
      icone: Wallet
    },
    {
      titulo: "Novos Lançamentos Rápidos",
      descricao: "Cadastre entradas e saídas de forma intuitiva com suporte a múltiplos itens e formas de pagamento.",
      imagem: imgLancamento,
      icone: PlusCircle
    },
    {
      titulo: "Controle de Parceiros e Fornecedores",
      descricao: "Monitore gastos totais, quantidade de lançamentos e última atividade de cada parceiro.",
      imagem: imgParceiros,
      icone: Truck
    }
  ];

  const [slideAtual, setSlideAtual] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideAtual((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

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
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 font-sans text-gray-100 overflow-hidden">
      
      {/* LADO ESQUERDO: VITRINE COM O CELULAR E VANTAGENS AO LADO */}
      <div className="hidden md:flex md:w-7/12 lg:w-7/12 bg-gray-900 border-r border-gray-800 relative overflow-hidden flex-col justify-between p-8 lg:p-12">
        
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[160px] pointer-events-none"></div>

        {/* Topo: Logo e Título */}
        <div className="z-10">
           <img src={logoImg} alt="Autonomax" className="h-9 w-auto object-contain mb-4 opacity-90" />
           <h2 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tight">
             Ecossistema Autônomo na <span className="text-emerald-400">Palma da Mão</span>
           </h2>
        </div>

        {/* Centro: Layout Flex em Linha (Celular à esquerda, Vantagens à direita) */}
        <div className="z-10 my-4 flex flex-col xl:flex-row items-center justify-center gap-8 xl:gap-12">
          
          {/* Mock Mobile Reduzido com Borda/Padding Interno para evitar cortes */}
          <div className="relative flex flex-col items-center flex-shrink-0">
            <div className="absolute bg-emerald-500/10 w-56 h-80 rounded-3xl blur-2xl pointer-events-none"></div>
            
            <div className="w-[230px] lg:w-[250px] h-[440px] lg:h-[480px] bg-gray-950 rounded-[2.5rem] border-4 border-gray-800 p-2 shadow-2xl relative overflow-hidden flex items-center justify-center">
              <img 
                src={slides[slideAtual].imagem} 
                alt="Mock Mobile" 
                className="w-full h-full object-contain rounded-[2rem] border border-gray-800/60 bg-gray-950 transition-all duration-500" 
              />
            </div>

            {/* Indicadores de Slide (Dots) */}
            <div className="flex items-center gap-1.5 mt-3">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSlideAtual(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${slideAtual === idx ? 'w-5 bg-emerald-500' : 'w-1.5 bg-gray-800 hover:bg-gray-700'}`}
                  aria-label={`Ir para o slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Listinha de Vantagens e Funcionalidades ao Lado */}
          <div className="space-y-3 max-w-sm">
            <div className="space-y-1 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-900/40">
                Recursos Principais
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-tight pt-1">
                {slides[slideAtual].titulo}
              </h3>
              <p className="text-gray-400 text-xs font-medium leading-relaxed">
                {slides[slideAtual].descricao}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-800">
              {slides.map((item, idx) => {
                const IconComponent = item.icone;
                const isAtivo = slideAtual === idx;
                return (
                  <div 
                    key={idx} 
                    onClick={() => setSlideAtual(idx)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${isAtivo ? 'bg-emerald-950/30 border-emerald-900/60 text-emerald-300' : 'bg-gray-950/40 border-gray-800/60 text-gray-400 hover:border-gray-700'}`}
                  >
                    <div className={`p-1.5 rounded ${isAtivo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-900 text-gray-500'}`}>
                      <IconComponent size={14} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wide truncate">
                      {item.titulo}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Rodapé da Vitrine */}
        <div className="z-10 flex items-center gap-3 border-t border-gray-800/80 pt-4">
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