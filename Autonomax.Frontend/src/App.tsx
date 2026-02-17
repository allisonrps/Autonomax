import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Perfil } from './pages/Perfil';
import { Clientes } from './pages/Clientes';
import { DetalhesCliente } from './pages/DetalhesCliente';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/:mes/:ano" element={<Dashboard />} />
        <Route path="/clientes/:id" element={<DetalhesCliente />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;