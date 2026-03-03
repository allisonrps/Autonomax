import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  Plus, Trash2, Edit3, Building2, 
  ArrowRight, AlertTriangle, ShieldCheck,
  LayoutGrid, Rocket, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../services/api';

interface Negocio {
  id: number;
  nome: string;
}

// Interface para tipar os logs
interface Log {
  id: number;
  evento: string;
  descricao: string;
  ipOrigem: string;
  data: string;
}

export function Perfil() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [logs, setLogs] = useState<Log[]>([]); // Estado para os logs
  const [formAberto, setFormAberto] = useState(false);
  const [novoNegocio, setNovoNegocio] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [confirmarExclusao, setConfirmarExclusao] = useState<number | null>(null);

  useEffect(() => {
    carregarNegocios();
    carregarLogs(); // Chama os logs ao carregar a página
  }, []);

  async function carregarNegocios() {
    try {
      const response = await api.get('/Negocios');
      setNegocios(response.data);
    } catch (err) {
      console.error("Erro ao buscar negócios.");
    }
  }

  async function carregarLogs() {
    try {
      const response = await api.get('/LogsSeguranca'); 
      setLogs(response.data);
    } catch (err) {
      console.error("Erro ao carregar trilha de auditoria.");
    }
  }

  async function handleAddNegocio() {
    if (!novoNegocio.trim()) return;
    try {
      await api.post('/Negocios', { nome: novoNegocio });
      setNovoNegocio('');
      setFormAberto(false);
      carregarNegocios();
    } catch (err) {
      alert("Erro ao cadastrar negócio.");
    }
  }

  async function handleUpdateNegocio(id: number) {
    if (!nomeEdicao.trim()) return;
    try {
      await api.put(`/Negocios/${id}`, { id: id, nome: nomeEdicao });
      setEditandoId(null);
      carregarNegocios();
    } catch (err) {
      alert("Erro ao atualizar.");
    }
  }

  async function handleDeleteNegocio() {
    if (!confirmarExclusao) return;
    try {
      await api.delete(`/Negocios/${confirmarExclusao}`);
      setConfirmarExclusao(null);
      carregarNegocios();
    } catch (err) {
      alert("Erro ao excluir.");
    }
  }

  const selecionarNegocio = (id: number) => {
    localStorage.setItem('@Autonomax:selectedNegocioId', String(id));
    window.location.href = '/dashboard'; 
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-10 pb-16 pt-8 px-4">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl">
              <Building2 size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Meus Negócios</h2>
              <p className="text-sm text-gray-500 font-medium">Gerencie suas unidades de trabalho [cite: 2026-02-27]</p>
            </div>
          </div>
        </div>

        {/* CADASTRO RETRÁTIL */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <button 
            onClick={() => setFormAberto(!formAberto)}
            className="w-full bg-emerald-50/50 px-8 py-5 flex items-center justify-between hover:bg-emerald-50 transition-colors border-none outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Rocket size={20} className="text-emerald-600" />
              <h3 className="text-xs font-black text-emerald-900 uppercase tracking-[0.2em]">Novo Perfil</h3>
            </div>
            {formAberto ? <ChevronUp size={20} className="text-emerald-600" /> : <ChevronDown size={20} className="text-emerald-600" />}
          </button>
          
          {formAberto && (
            <div className="p-8 animate-in slide-in-from-top duration-300">
              <div className="flex flex-col md:flex-row gap-6">
                <input
                  className="flex-1 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  value={novoNegocio}
                  onChange={e => setNovoNegocio(e.target.value)}
                  placeholder="Nome do Negócio..."
                />
                <button 
                  onClick={handleAddNegocio}
                  className="bg-emerald-950 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs hover:bg-black transition-all border-none cursor-pointer"
                >
                  Criar <Plus size={18} className="inline ml-1"/>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* GRID DE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {negocios.map(negocio => (
            <div key={negocio.id} className="group bg-white rounded-[32px] border border-gray-200 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col relative">
              {!editandoId && (
                <div className="flex gap-1 absolute top-6 right-6 bg-white shadow-lg p-1.5 rounded-2xl border border-gray-100 z-10">
                  <button onClick={() => { setEditandoId(negocio.id); setNomeEdicao(negocio.nome); }} className="p-2 text-gray-400 hover:text-emerald-600 transition-colors bg-transparent border-none cursor-pointer">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => setConfirmarExclusao(negocio.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer">
                    <Trash2 size={18} />
                  </button>
                </div>
              )}

              <div className="p-8 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl mb-6">
                  {negocio.nome.charAt(0).toUpperCase()}
                </div>
                {editandoId === negocio.id ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <input 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-emerald-500"
                      value={nomeEdicao}
                      onChange={e => setNomeEdicao(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateNegocio(negocio.id)} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg border-none cursor-pointer font-bold text-xs uppercase">Salvar</button>
                      <button onClick={() => setEditandoId(null)} className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg border-none cursor-pointer font-bold text-xs uppercase">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="text-2xl font-black text-gray-800 mb-2 leading-tight">{negocio.nome}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <LayoutGrid size={12} className="text-emerald-600" /> ID #{negocio.id}
                    </p>
                  </>
                )}
              </div>
              {!editandoId && (
                <button 
                  onClick={() => selecionarNegocio(negocio.id)}
                  className="w-full bg-gray-50 border-t border-gray-100 py-6 px-8 text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center justify-between hover:bg-emerald-950 hover:text-white transition-all border-none cursor-pointer"
                >
                  Acessar <ArrowRight size={18} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* SEÇÃO DE AUDITORIA E SEGURANÇA*/}
        <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm overflow-hidden mt-12">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-emerald-600" />
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Atividades de Segurança</h3>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black uppercase">Audit Trail Ativo</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase">Evento</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase">Descrição</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase">IP de Origem</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.length > 0 ? logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${
                        log.evento.includes('FALHO') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {log.evento.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-xs font-bold text-gray-600">{log.descricao}</td>
                    <td className="px-8 py-4 text-xs font-mono text-gray-400">{log.ipOrigem || 'Sistema'}</td>
                    <td className="px-8 py-4 text-xs text-gray-500">
                      {new Date(log.data).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-8 text-center text-gray-400 text-xs font-bold italic">Nenhuma atividade registrada ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE EXCLUSÃO */}
      {confirmarExclusao && (
        <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800 uppercase">Excluir Perfil?</h3>
              <p className="text-sm text-gray-500 mt-2">Isso apagará todos os dados desta unidade permanentemente.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setConfirmarExclusao(null)} className="py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase border-none cursor-pointer">Não</button>
              <button onClick={handleDeleteNegocio} className="py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase border-none cursor-pointer shadow-lg shadow-red-200">Sim</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}