import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  ArrowLeft, 
  Truck, 
  Receipt, 
  Phone, 
  AlertCircle, 
  Loader2,
  History,
  Tag,
  FileText,
  ArrowDownCircle
} from 'lucide-react';
import api from '../services/api';

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: string;
}

interface Fornecedor {
  id: number;
  nome: string;
  telefone: string;
  categoria: string;
  observacoes: string;
}

interface DadosFornecedor {
  fornecedor: Fornecedor;
  transacoes: Transacao[];
}

export function DetalhesFornecedor() {
  const { id } = useParams<{ id: string }>(); 
  const negocioId = localStorage.getItem('@Autonomax:selectedNegocioId');
  
  const [dados, setDados] = useState<DadosFornecedor | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDados() {
      if (!id || !negocioId || negocioId === "undefined") {
        setErro("Selecione um negócio antes de prosseguir.");
        setCarregando(false);
        return;
      }
      
      try {
        setCarregando(true);
        setErro(null);

        // Busca os dados filtrados por fornecedor
        const response = await api.get(`/Transacoes/por-fornecedor/${id}`, {
          params: { negocioId: Number(negocioId) }
        });
        
        setDados(response.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setErro(`O parceiro com ID ${id} não foi encontrado.`);
        } else {
          setErro("Não foi possível conectar ao servidor.");
        }
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [id, negocioId]);

  if (carregando) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="animate-spin text-emerald-600" size={40} />
          <p className="text-gray-500 animate-pulse font-black uppercase text-[10px] tracking-widest">Sincronizando parceiro...</p>
        </div>
      </Layout>
    );
  }

  if (erro || !dados) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-3xl border border-red-100 shadow-xl text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Parceiro não encontrado</h2>
          <p className="text-gray-500 mt-2 font-medium">{erro || "O histórico deste parceiro não pôde ser carregado."}</p>
          <Link to="/fornecedores" className="inline-block mt-6 bg-emerald-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg active:scale-95">
            Voltar para Parceiros
          </Link>
        </div>
      </Layout>
    );
  }

  const { fornecedor, transacoes } = dados;
  // Cálculo do gasto total com destaque em vermelho para despesas
  const totalGasto = transacoes.reduce((acc, t) => acc + t.valor, 0);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16 pt-8 px-4">
        
        <Link to="/fornecedores" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-600 transition-all w-fit">
          <ArrowLeft size={16} /> Voltar para a lista
        </Link>

        {/* HEADER PERFIL - FOCO EM DESPESA ACUMULADA */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-emerald-600 p-5 rounded-3xl text-white shadow-xl shadow-emerald-100">
              <Truck size={36} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-gray-800 tracking-tight uppercase">{fornecedor.nome}</h2>
              <div className="flex flex-wrap gap-4 mt-3">
                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter">
                  <Phone size={12}/> {fornecedor.telefone || 'Sem telefone'}
                </span>
                <span className="flex items-center gap-1.5 bg-gray-50 text-gray-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter border border-gray-100">
                  <Tag size={12} className="text-emerald-300"/> {fornecedor.categoria || 'Geral'}
                </span>
              </div>
            </div>
          </div>
          
          {/* CARD DE GASTO ACUMULADO EM VERMELHO */}
          <div className="w-full md:w-auto bg-red-600 p-6 rounded-3xl text-white shadow-2xl shadow-red-900/20">
            <p className="text-[10px] text-red-100 font-black uppercase tracking-widest mb-1">Gasto Total Acumulado</p>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold opacity-60">R$</span>
              <span className="text-4xl font-black">
                {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* INDICADORES E NOTAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-red-50 text-red-500 rounded-2xl">
              <Receipt size={28} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Lançamentos de Saída</p>
              <p className="text-2xl font-black text-gray-800">{transacoes.length} despesas</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-5">
            <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl">
              <FileText size={28} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Observações do Parceiro</p>
              <p className="text-sm font-bold text-gray-600 leading-tight italic mt-1">
                {fornecedor.observacoes || 'Nenhuma nota adicional registrada.'}
              </p>
            </div>
          </div>
        </div>

        {/* TABELA HISTÓRICO - TEMA DESPESA */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <div className="flex items-center gap-2">
              <History size={18} className="text-emerald-600" />
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Histórico de Gastos</h3>
            </div>
            <span className="text-[10px] font-black bg-white border border-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase">Relatório de Despesas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black tracking-[0.2em]">
                <tr className="border-b border-gray-100">
                  <th className="px-8 py-5">Data</th>
                  <th className="px-8 py-5">Descrição da Despesa</th>
                  <th className="px-8 py-5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transacoes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center text-gray-300 font-black uppercase text-xs tracking-widest italic">
                      Nenhuma despesa vinculada a este parceiro.
                    </td>
                  </tr>
                ) : (
                  transacoes.map(t => (
                    <tr key={t.id} className="hover:bg-red-50/20 transition-all group">
                      <td className="px-8 py-6 text-xs font-black text-gray-400 group-hover:text-red-600 transition-colors">
                        {new Date(t.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-8 py-6 flex items-center gap-3">
                        <ArrowDownCircle size={16} className="text-red-400" />
                        <span className="text-gray-700 font-bold text-sm leading-tight">{t.descricao}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="font-black text-red-500 text-lg">
                          - R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}