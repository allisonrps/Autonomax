import { Layout } from '../components/Layout';

export function Dashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Resumo Geral</h2>
        
        {/* cards de saldo e gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Saldo Atual</p>
            <p className="text-2xl font-bold text-green-600">R$ 0,00</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Entradas (Mês)</p>
            <p className="text-2xl font-bold text-blue-600">R$ 0,00</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Saídas (Mês)</p>
            <p className="text-2xl font-bold text-red-600">R$ 0,00</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}