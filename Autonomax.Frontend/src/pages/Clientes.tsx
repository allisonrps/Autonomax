import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
// 1. Importe o Link do react-router-dom, não do lucide-react
import { Link } from 'react-router-dom'; 
import { Plus, Trash2, Edit3, Save, X, Users, MapPin, Phone, User, Eye } from 'lucide-react';
import api from '../services/api';

interface Cliente {
  id: number;
  nome: string;
  celular: string;
  endereco: string;
  negocioId: number;
}

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [novoCliente, setNovoCliente] = useState({ nome: '', celular: '', endereco: '' });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [clienteEdicao, setClienteEdicao] = useState<Cliente | null>(null);

  const currentNegocioId = localStorage.getItem('@Autonomax:selectedNegocioId');

  useEffect(() => {
    carregarClientes();
  }, [currentNegocioId]);

  async function carregarClientes() {
    if (!currentNegocioId) return;
    try {
      const response = await api.get(`/Clientes/por-negocio/${currentNegocioId}`);
      setClientes(response.data);
    } catch (err) {
      console.error("Erro ao buscar clientes.");
    }
  }

  async function handleAddCliente() {
    if (!novoCliente.nome.trim() || !currentNegocioId) return;
    try {
      await api.post('/Clientes', { 
        ...novoCliente, 
        negocioId: Number(currentNegocioId) 
      });
      setNovoCliente({ nome: '', celular: '', endereco: '' });
      carregarClientes();
    } catch (err) {
      alert("Erro ao cadastrar.");
    }
  }

  async function handleUpdateCliente(id: number) {
    if (!clienteEdicao || !currentNegocioId) return;
    try {
      const clienteParaEnviar = {
        ...clienteEdicao,
        id: id,
        negocioId: Number(currentNegocioId)
      };
      await api.put(`/Clientes/${id}`, clienteParaEnviar);
      setEditandoId(null);
      carregarClientes();
    } catch (err: any) {
      alert("Erro ao atualizar.");
    }
  }

  async function handleDeleteCliente(id: number) {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    try {
      await api.delete(`Clientes/${id}`);
      carregarClientes();
    } catch (err: any) {
      alert("Erro ao excluir. Verifique se existem transações vinculadas.");
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600" /> Gestão de Clientes
          </h2>
          <p className="text-gray-500">Clientes vinculados ao negócio selecionado.</p>
        </div>

        {/* CADASTRO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
              <input
                placeholder="Nome"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={novoCliente.nome}
                onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})}
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
              <input
                placeholder="Celular"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={novoCliente.celular}
                onChange={e => setNovoCliente({...novoCliente, celular: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                <input
                  placeholder="Endereço"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={novoCliente.endereco}
                  onChange={e => setNovoCliente({...novoCliente, endereco: e.target.value})}
                />
              </div>
              <button onClick={handleAddCliente} className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg">
                <Plus size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* LISTAGEM */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Contato / Endereço</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map(cliente => (
                <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {editandoId === cliente.id ? (
                      <input 
                        className="border rounded px-2 py-1 w-full outline-blue-500"
                        value={clienteEdicao?.nome}
                        onChange={e => setClienteEdicao({...clienteEdicao!, nome: e.target.value})}
                      />
                    ) : (
                      <span className="font-medium text-gray-700">{cliente.nome}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editandoId === cliente.id ? (
                      <div className="space-y-1">
                         <input 
                          className="border rounded px-2 py-1 w-full text-sm outline-blue-500"
                          value={clienteEdicao?.celular}
                          onChange={e => setClienteEdicao({...clienteEdicao!, celular: e.target.value})}
                        />
                         <input 
                          className="border rounded px-2 py-1 w-full text-sm outline-blue-500"
                          value={clienteEdicao?.endereco}
                          onChange={e => setClienteEdicao({...clienteEdicao!, endereco: e.target.value})}
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        <p>{cliente.celular}</p>
                        <p className="text-xs">{cliente.endereco}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
<div className="flex justify-end gap-3">
  {editandoId === cliente.id ? (
    <>
      <button onClick={() => handleUpdateCliente(cliente.id)} className="text-green-600"><Save size={20}/></button>
      <button onClick={() => setEditandoId(null)} className="text-gray-400"><X size={20}/></button>
    </>
  ) : (
    <>
      {/* ÍCONE DE VISUALIZAR (OLHO) QUE REDIRECIONA */}
      <Link 
        to={`/clientes/${cliente.id}`} 
        className="text-gray-400 hover:text-blue-600 transition-colors"
        title="Ver detalhes"
      >
        <Eye size={20} />
      </Link>

      <button onClick={() => { setEditandoId(cliente.id); setClienteEdicao(cliente); }} className="text-gray-400 hover:text-blue-500">
        <Edit3 size={18}/>
      </button>
      
      <button onClick={() => handleDeleteCliente(cliente.id)} className="text-gray-400 hover:text-red-500">
        <Trash2 size={18}/>
      </button>
    </>
  )}
</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}