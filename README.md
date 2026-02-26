# 🚀 Autonomax — Gestão Financeira Inteligente para Autônomos

[![Deploy on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel)](https://autonomax.vercel.app)
[![Deploy on Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=for-the-badge&logo=railway)](https://autonomax-production.up.railway.app/swagger)

O **Autonomax** é uma solução Full Stack de alta performance projetada para profissionais autônomos que buscam controle rigoroso de fluxo de caixa. A plataforma utiliza uma arquitetura moderna para garantir escalabilidade e segurança no gerenciamento de múltiplos negócios e transações financeiras.

## 💎 Diferenciais Técnicos

* **Arquitetura de Dados:** Implementação de **DTOs (Data Transfer Objects)** para garantir o desacoplamento das entidades do banco e otimizar a serialização JSON, eliminando problemas de referências cíclicas.
* **Segurança Robusta:** Sistema de autenticação **JWT (JSON Web Token)** com criptografia **BCrypt** para proteção de senhas e *Rate Limiting* nativo para prevenção de ataques de força bruta.
* **Persistência e Performance:** Uso de **Entity Framework Core 9** com PostgreSQL (via Supabase), utilizando índices e restrições de integridade referencial para garantir a consistência absoluta dos dados.
* **UX/UI Reativa:** Frontend SPA desenvolvido com **React + Vite**, priorizando performance, consumo eficiente de APIs via **Axios Interceptors** e design responsivo com **Tailwind CSS**.



## 🛠️ Funcionalidades Atuais

* **Gestão Multi-Negócio:** Permite que o usuário gerencie diferentes frentes de trabalho ou empresas de forma isolada dentro da mesma conta.
* **Fluxo de Caixa Dinâmico:** Registro de entradas e saídas com categorização por mês e ano, permitindo uma navegação histórica intuitiva.
* **Dashboard Inteligente:** Visualização imediata de Saldo Total, Receitas e Despesas do período selecionado.
* **Gestão de Clientes:** Cadastro e vínculo de clientes às transações de receita para análise de faturamento por origem.
* **Filtros por Período:** Motor de busca otimizado no backend para recuperar lançamentos financeiros baseados em competência mensal.

## 🚀 Roadmap (Próximas Features)

* **Relatórios Exportáveis:** Geração de arquivos PDF e Excel.
* **Gráficos Avançados:** Implementação de gráficos de linha e pizza (Recharts) para análise de tendência de gastos e fontes de receita.
* **Metas Financeiras:** Ferramenta para definição de objetivos de faturamento mensal com barra de progresso em tempo real.
* **Notificações Push:** Alertas para contas a pagar e lembretes de faturamento para clientes inadimplentes.
* **App Mobile:** Versão nativa utilizando React Native para gestão financeira "on-the-go".

---

## 🛠️ Stack Tecnológica

### **Backend (Core Engine)**
* **Runtime:** .NET 9 (C#)
* **ORM:** Entity Framework Core (Code First)
* **Database:** PostgreSQL (Supabase)
* **API Documentation:** Swagger UI (OpenAPI 3.0)

### **Frontend (Interface)**
* **Framework:** React 18+ com TypeScript
* **Estilização:** Tailwind CSS
* **Ícones:** Lucide React
* **Navegação:** React Router Dom

---

## ⚙️ Configuração do Ambiente de Desenvolvimento

### **Backend**
1. Navegue até o diretório raiz do servidor: `cd Autonomax.Backend`
2. Configure a `Connection String` no arquivo `appsettings.Development.json`.
3. Instale as dependências e execute as migrations:
   ```bash
   dotnet restore
   dotnet ef database update
   ```
4. Inicie a API: 
```bash
dotnet run
```
(Disponível em: http://localhost:5203)

### **Frontend**
1. Navegue até a pasta: cd Autonomax.Frontend
2. Instale as dependências: 
```bash
npm install
```
3. Inicie o servidor: 
```bash
npm run dev 
```
(Disponível em: http://localhost:5173)

### 👤 Autor
## Allison - Desenvolvedor Full Stack
