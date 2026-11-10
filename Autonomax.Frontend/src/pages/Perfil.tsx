import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Trash2, Edit3, X, Building2, 
  AlertTriangle, Rocket, ChevronDown, ChevronUp, Lock, 
  ShieldCheck, Palette, Check, Upload
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface Negocio { 
  id: number; 
  nome: string; 
  logoUrl?: string | null;
}
interface DetalhesFinanceiros { receitas: number; despesas: number; pendentes: number; liquido: number; carregando: boolean; }

export function Perfil() {
  const { theme, setTheme, temas } = useTheme();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [personalizacaoAberto, setPersonalizacaoAberto] = useState(false);
  const [novoNegocio, setNovoNegocio] = useState('');
  
  const [negocioExpandido, setNegocioExpandido] = useState<number | null>(null);
  const [detalhesFinanceiros, setDetalhesFinanceiros] = useState<Record<number, DetalhesFinanceiros>>({});

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [confirmarExclusao, setConfirmarExclusao] = useState<number | null>(null);
  
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [senhaAntiga, setSenhaAntiga] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  useEffect(() => { carregarNegocios(); }, []);

  async function carregarNegocios() {
    try { const response = await api.get('/Negocios'); setNegocios(response.data); } 
    catch (err) { console.error("Erro ao buscar negócios."); }
  }

  async function handleRedefinirSenha() {
    if (novaSenha !== confirmarSenha) return alert("As novas senhas não coincidem!");
    try {
      await api.post('/Auth/redefinir-senha', { senhaAntiga, novaSenha });
      alert("Senha alterada com sucesso!");
      setSenhaAntiga(''); setNovaSenha(''); setConfirmarSenha(''); setModalSenhaAberto(false);
    } catch (err) { alert("Erro ao alterar senha. Verifique a senha atual."); }
  }

  async function handleAddNegocio() {
    if (!novoNegocio.trim()) return;
    try { await api.post('/Negocios', { nome: novoNegocio }); setNovoNegocio(''); setFormAberto(false); carregarNegocios(); } 
    catch (err) { alert("Erro ao cadastrar."); }
  }

  async function handleUpdateNegocio(id: number) {
    if (!nomeEdicao.trim()) return;
    try { await api.put(`/Negocios/${id}`, { id, nome: nomeEdicao }); setEditandoId(null); carregarNegocios(); } 
    catch (err) { alert("Erro ao atualizar."); }
  }

  async function handleDeleteNegocio(id: number) {
    try { await api.delete(`/Negocios/${id}`); setConfirmarExclusao(null); carregarNegocios(); } 
    catch (err) { alert("Erro ao excluir."); }
  }

  async function handleUploadLogo(negocio: Negocio, file: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem da logo deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        await api.put(`/Negocios/${negocio.id}`, { ...negocio, logoUrl: base64 });
        carregarNegocios();
        window.dispatchEvent(new Event('negocioAtualizado'));
      } catch (err) {
        alert("Erro ao salvar o logo do negócio.");
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleRemoverLogo(negocio: Negocio) {
    if (!confirm("Remover a logo personalizada desta unidade?")) return;
    try {
      await api.put(`/Negocios/${negocio.id}`, { ...negocio, logoUrl: null });
      carregarNegocios();
      window.dispatchEvent(new Event('negocioAtualizado'));
    } catch (err) {
      alert("Erro ao remover a logo.");
    }
  }

  async function toggleExpandir(id: number) {
    if (negocioExpandido === id) { setNegocioExpandido(null); return; }
    setNegocioExpandido(id);
    if (!detalhesFinanceiros[id]) {
      setDetalhesFinanceiros(prev => ({ ...prev, [id]: { receitas: 0, despesas: 0, pendentes: 0, liquido: 0, carregando: true } }));
      try {
        const res = await api.get(`/Transacoes/por-negocio/${id}`);
        const transacoes = res.data;
        const receitas = transacoes.filter((t: any) => t.tipo === 'Entrada' && t.status === 'Pago').reduce((acc: number, t: any) => acc + t.valor, 0);
        const pendentes = transacoes.filter((t: any) => t.tipo === 'Entrada' && t.status === 'Pendente').reduce((acc: number, t: any) => acc + t.valor, 0);
        const despesas = transacoes.filter((t: any) => t.tipo === 'Saida' && t.status === 'Pago').reduce((acc: number, t: any) => acc + t.valor, 0);
        setDetalhesFinanceiros(prev => ({ ...prev, [id]: { receitas, despesas, pendentes, liquido: receitas - despesas, carregando: false } }));
      } catch (err) { setDetalhesFinanceiros(prev => ({ ...prev, [id]: { receitas: 0, despesas: 0, pendentes: 0, liquido: 0, carregando: false } })); }
    }
  }

  const selecionarNegocio = (id: number) => {
    localStorage.setItem('@Autonomax:selectedNegocioId', String(id));
    window.location.href = '/dashboard'; 
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950 pt-8 pb-16 px-4 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto space-y-5">
          
          {/* HEADER PRINCIPAL */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-lg border border-emerald-900/50 hidden md:flex"><Building2 size={24} /></div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Gerenciamento de Conta</h2>
              </div>
            </div>
            <button onClick={() => setModalSenhaAberto(true)} className="flex items-center gap-2 bg-gray-950 px-5 py-3 rounded-md border border-gray-800 text-[10px] font-black uppercase text-gray-400 hover:border-emerald-600 hover:text-emerald-400 transition-all cursor-pointer"><ShieldCheck size={16} /> Redefinir Senha</button>
          </div>

          {/* CARDS DE PERFIL / UNIDADES DE NEGÓCIO NO TOPO */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 px-1">
              Perfil de Negócios / Unidades Cadastradas
            </h3>
            <div className="flex flex-col gap-2.5">
              {negocios.map(negocio => {
                const dados = detalhesFinanceiros[negocio.id];
                const isExpandido = negocioExpandido === negocio.id;

                return (
                  <div key={negocio.id} className="bg-gray-900 rounded-xl border border-gray-800 p-3.5 sm:p-4 md:px-6 md:py-4 flex flex-col transition-all hover:border-gray-700">
                    
                    {/* Primeia Linha: Clicável no Card Inteiro para Acessar a Unidade */}
                    <div
                      onClick={() => selecionarNegocio(negocio.id)}
                      className="flex items-center justify-between gap-3 cursor-pointer group"
                      title="Clique para acessar esta unidade"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        {/* Ícone com a letra (ou logo se cadastrado) */}
                        {negocio.logoUrl ? (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-emerald-500/50 transition-colors">
                            <img src={negocio.logoUrl} alt={negocio.nome} className="w-full h-full object-contain p-1" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-800 text-emerald-400 flex items-center justify-center font-black text-base sm:text-lg border border-gray-700 flex-shrink-0 shadow-sm group-hover:border-emerald-500/50 transition-colors">
                            <span>{negocio.nome.charAt(0).toUpperCase()}</span>
                          </div>
                        )}

                        {/* Nome da Unidade */}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-sm sm:text-base uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors truncate">
                            {negocio.nome}
                          </h4>
                        </div>
                      </div>

                      {/* Somente o Chevron para Expandir/Recolher */}
                      <div className="flex items-center flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandir(negocio.id);
                          }}
                          className="p-2 sm:p-2.5 text-gray-400 hover:text-white bg-gray-950 hover:bg-gray-800 rounded-xl border border-gray-800 transition-all cursor-pointer flex items-center justify-center"
                          title={isExpandido ? "Recolher detalhes" : "Expandir detalhes"}
                        >
                          {isExpandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Conteúdo do Card Expandido */}
                    {isExpandido && (
                      <div className="mt-4 pt-4 border-t border-gray-800 space-y-4 animate-in slide-in-from-top duration-200">
                        {/* Métricas Financeiras em 1 única linha no mobile */}
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                          {[
                            { l: 'Receitas', v: dados?.receitas || 0, c: 'text-emerald-400' },
                            { l: 'Despesas', v: dados?.despesas || 0, c: 'text-red-400' },
                            { l: 'Líquido', v: dados?.liquido || 0, c: (dados?.liquido || 0) >= 0 ? 'text-blue-400' : 'text-red-400' }
                          ].map((f, i) => (
                            <div key={i} className="bg-gray-950 p-2 sm:p-3 rounded-xl border border-gray-800 text-center sm:text-left">
                              <p className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-wider truncate">{f.l}</p>
                              <p className={`text-[10px] sm:text-sm font-black truncate ${f.c}`}>
                                R$ {f.v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Botões de Ação Responsivos */}
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2 pt-2 border-t border-gray-800/80 w-full">
                          <button
                            type="button"
                            onClick={() => { setEditandoId(negocio.id); setNomeEdicao(negocio.nome); }}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 bg-gray-950 hover:bg-gray-800 text-gray-300 hover:text-white px-2.5 sm:px-3.5 py-2 rounded-xl border border-gray-800 text-[10px] font-black uppercase transition-all cursor-pointer"
                          >
                            <Edit3 size={13} className="text-emerald-400 flex-shrink-0" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmarExclusao(negocio.id)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 bg-gray-950 hover:bg-red-950/50 text-gray-400 hover:text-red-400 px-2.5 sm:px-3.5 py-2 rounded-xl border border-gray-800 hover:border-red-900/60 text-[10px] font-black uppercase transition-all cursor-pointer"
                          >
                            <Trash2 size={13} className="flex-shrink-0" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD DE ADICIONAR PERFIL DE NEGÓCIO */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <button onClick={() => setFormAberto(!formAberto)} className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between border-b border-gray-800 outline-none hover:bg-gray-800 transition-colors cursor-pointer">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2"><Rocket size={18}/> Novo Perfil de Negócio</span>
              {formAberto ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
            </button>
            {formAberto && (
              <div className="p-6 flex flex-col md:flex-row gap-3 bg-gray-900">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase ml-1">Nome do Negócio</label>
                  <input className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-md text-sm text-white focus:border-emerald-600 outline-none" value={novoNegocio} onChange={e => setNovoNegocio(e.target.value)} placeholder="Ex: Minha Loja" />
                </div>
                <button onClick={handleAddNegocio} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 rounded-md font-black text-xs uppercase text-white mt-auto cursor-pointer border-none transition-colors">Criar</button>
              </div>
            )}
          </div>

          {/* SELETOR DE TEMA / PERSONALIZAÇÃO (OCULTO E EXPANSÍVEL AO CLICAR) */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-sm">
            <button 
              type="button" 
              onClick={() => setPersonalizacaoAberto(!personalizacaoAberto)} 
              className="w-full bg-gray-900/50 px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-none outline-none cursor-pointer border-b border-gray-800"
            >
              <div className="flex items-center gap-3">
                <Palette size={18} className="text-emerald-400" />
                <div className="text-left">
                  <h3 className="text-xs font-black uppercase text-gray-200 tracking-wider">Personalização</h3>
                </div>
              </div>
              {personalizacaoAberto ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
            </button>

            {personalizacaoAberto && (
              <div className="p-6 space-y-4 bg-gray-900 animate-in slide-in-from-top duration-200">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {temas.map(t => {
                    const isAtivo = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={`p-3 rounded-lg border flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                          isAtivo 
                            ? 'bg-gray-950 border-white/60 shadow-lg ring-1 ring-white/20' 
                            : 'bg-gray-950/60 border-gray-800 hover:border-gray-700 hover:bg-gray-950'
                        }`}
                      >
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: t.corHex }}
                        >
                          {isAtivo && <Check size={12} className="text-white drop-shadow" />}
                        </div>
                        <span className={`text-xs font-black uppercase tracking-tight truncate ${isAtivo ? 'text-white' : 'text-gray-400'}`}>
                          {t.nome}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MODAL REDEFINIR SENHA */}
      {modalSenhaAberto && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-sm rounded-xl border border-gray-800 p-6 space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2"><Lock size={16}/> Segurança</h3>
              <button onClick={() => setModalSenhaAberto(false)} className="text-gray-500 hover:text-white bg-transparent border-none cursor-pointer"><X size={18}/></button>
            </div>

            {/* Campo Senha Atual */}
            <div className="space-y-1 relative">
              <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Senha Atual</label>
              <input type="password" placeholder="••••••••" className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md text-sm text-white outline-none focus:border-emerald-600" value={senhaAntiga} onChange={e => setSenhaAntiga(e.target.value)} />
            </div>

            {/* Campo Nova Senha */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Nova Senha</label>
              <input type="password" placeholder="••••••••" className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md text-sm text-white outline-none focus:border-emerald-600" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
            </div>

            {/* Campo Confirmação + Validação Dinâmica */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Confirmar Nova Senha</label>
              <input type="password" placeholder="••••••••" className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md text-sm text-white outline-none focus:border-emerald-600" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} />
              
              {confirmarSenha && (
                <p className={`text-[9px] font-bold uppercase mt-1 ${novaSenha === confirmarSenha ? 'text-emerald-500' : 'text-red-500'}`}>
                  {novaSenha === confirmarSenha ? '✓ As senhas conferem' : '✕ As senhas não estão iguais'}
                </p>
              )}
            </div>

            <button 
              onClick={handleRedefinirSenha} 
              disabled={!senhaAntiga || !novaSenha || novaSenha !== confirmarSenha}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md font-black text-xs uppercase text-white mt-2 transition-all border-none cursor-pointer"
            >
              Atualizar Senha
            </button>
          </div>
        </div>
      )}

      {/* MODAL EDIÇÃO DO NEGÓCIO (COM TROCA E REMOÇÃO DE LOGO AQUI) */}
      {editandoId && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-sm rounded-xl border border-gray-800 p-6 space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
                <Edit3 size={16} /> Editar Perfil da Unidade
              </h3>
              <button onClick={() => setEditandoId(null)} className="text-gray-500 hover:text-white bg-transparent border-none cursor-pointer"><X size={18}/></button>
            </div>

            {/* Gerenciamento de Logo no Modal de Edição */}
            {(() => {
              const negocioEdicao = negocios.find(n => n.id === editandoId);
              if (!negocioEdicao) return null;
              return (
                <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 space-y-3">
                  <span className="text-[10px] font-black uppercase text-gray-400 block">Logo da Unidade</span>
                  <div className="flex items-center gap-3">
                    {negocioEdicao.logoUrl ? (
                      <div className="w-14 h-14 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                        <img src={negocioEdicao.logoUrl} alt={negocioEdicao.nome} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-800 text-gray-300 flex items-center justify-center font-black text-xl border border-gray-700 flex-shrink-0">
                        {negocioEdicao.nome.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <label className="bg-gray-900 hover:bg-gray-800 text-emerald-400 border border-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                        <Upload size={14} />
                        <span>{negocioEdicao.logoUrl ? 'Trocar Logo' : 'Enviar Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadLogo(negocioEdicao, f);
                          }}
                        />
                      </label>

                      {negocioEdicao.logoUrl && (
                        <button
                          type="button"
                          onClick={() => handleRemoverLogo(negocioEdicao)}
                          className="text-[10px] font-black uppercase tracking-wider text-red-400 hover:text-red-300 bg-transparent border-none cursor-pointer py-0.5 text-center transition-colors"
                        >
                          Remover Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Nome da Unidade</label>
              <input className="w-full p-3 bg-gray-950 border border-gray-800 rounded-md text-sm text-white focus:border-emerald-600 outline-none" value={nomeEdicao} onChange={e => setNomeEdicao(e.target.value)} />
            </div>

            <button onClick={() => handleUpdateNegocio(editandoId)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-md transition-colors cursor-pointer border-none">Salvar Alterações</button>
          </div>
        </div>
      )}

      {/* MODAL EXCLUSÃO */}
      {confirmarExclusao && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 text-center space-y-4 animate-in zoom-in duration-200 max-w-xs">
            <AlertTriangle className="text-red-500 mx-auto" size={32} />
            <p className="text-sm font-black text-white">Excluir unidade permanentemente?</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setConfirmarExclusao(null)} className="flex-1 py-2 bg-gray-800 rounded text-xs font-black uppercase text-gray-300 hover:text-white cursor-pointer border-none">Não</button>
              <button onClick={() => handleDeleteNegocio(confirmarExclusao)} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-black uppercase cursor-pointer border-none">Sim</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}