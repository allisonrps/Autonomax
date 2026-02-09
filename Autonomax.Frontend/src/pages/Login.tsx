import React, { useState } from 'react';
import api from '../services/api';
import { LogIn, User, Lock } from 'lucide-react';

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
      
      // Salva os dados no navegador
      localStorage.setItem('@Autonomax:token', response.data.token);
      localStorage.setItem('@Autonomax:user', JSON.stringify(response.data.usuario));

      alert('Login realizado com sucesso!');
      window.location.href = '/dashboard'; // Redireciona
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Falha ao conectar no servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Autonomax</h1>
          <p className="text-gray-500">Gestão simplificada para autônomos</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <div className="mt-1 relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <div className="mt-1 relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
              />
            </div>
          </div>

          {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Entrando...' : <><LogIn size={20} /> Entrar</>}
          </button>
        </form>
      </div>
    </div>
  );
}