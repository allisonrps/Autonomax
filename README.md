# 🚀 Autonomax - Gestão Financeira para Autônomos

O **Autonomax** é uma plataforma completa desenvolvida para profissionais autônomos gerenciarem seu fluxo de caixa de forma simples e eficiente. 
O sistema permite o controle de múltiplos negócios, gestão de clientes e lançamentos financeiros categorizados por mês e ano.

## ✨ Características do Projeto

* **Multi-negócio:** Gerencie diferentes empresas ou frentes de trabalho em uma única conta.
* **Fluxo de Caixa Mensal:** Navegação dinâmica entre meses para controle de entradas e saídas.
* **Gestão de Clientes:** Cadastro completo de clientes com vínculo direto nos lançamentos de receita.
* **Resumo Financeiro:** Cards inteligentes que calculam automaticamente Entradas, Saídas e Saldo Líquido.
* **Ranking de Clientes:** Inteligência de dados para identificar os clientes que mais geram receita.
* **Arquitetura Moderna:** Backend robusto em .NET 9 e Frontend ultra-rápido com React + Vite.

## 🛠️ Tecnologias Utilizadas

### **Backend**
* **C# / .NET 9**
* **Entity Framework Core** (ORM)
* **PostgreSQL / SQL Server** (Base de dados relacional)
* **ASP.NET Core Web API** com Autenticação JWT

### **Frontend**
* **React** com **TypeScript**
* **Tailwind CSS** (Estilização)
* **Lucide React** (Ícones)
* **Axios** (Consumo de API)
* **React Router Dom** (Navegação dinâmica)

---

## 🚀 COMO RODAR O PROJETO:

### **PRÉ REQUISITOS**
* SDK do .NET 9 instalado.
* Node.js instalado (versão 18 ou superior).
* Um banco de dados configurado (PostgreSQL ou SQL Server).

## **CONFIGURANDO O BACKEND**
### 1. Acesse a pasta do servidor:
   ```bash
   cd Autonomax
   ```
   
### 2. Atualize a Connection String no arquivo appsettings.json.

### 3. Execute as migrations para criar o banco de dados:

   ```bash
dotnet ef database update
   ```
   
### 4. Inicie o servidor:

   ```bash
dotnet run
   ```
A API estará rodando em: http://localhost:5203

## **CONFIGURANDO O FRONTEND**
### 1. Acesse a pasta do cliente:

   ```bash
cd Autonomax.Frontend
   ```
   
### 2. Instale as dependências:

   ```bash
npm install
   ```
   
### 3. Inicie a aplicação:

   ```bash
npm run dev
   ```
O App estará rodando em: http://localhost:5173

## 📂 Estrutura de Pastas Principal
```text
/
├── Autonomax (Backend)
│   ├── Controllers/    # Endpoints da API que gerenciam a lógica de entrada/saída para Clientes, Transações e Negócios...
│   ├── Data/           # Contém o AppDbContext do Entity Framework Core e configurações de mapeamento.
│   ├── DTOs/           # Classes para entrada e saída de dados da API, evitando a exposição direta das Models e resolvendo problemas de referência cíclica.
│   ├── Middleware/     # Filtros personalizados, como tratamento global de exceções ou logs de requisições.
│   ├── Migrations/     # Histórico de versões do banco de dados gerado pelo EF Core.
│   ├── Models/         # Entidades que representam as tabelas do banco de dados.
│   ├── Properties/     # Arquivos como launchSettings.json que definem as portas (HTTP/HTTPS) e perfis de execução.
│   └── Services/       # Camada de lógica de negócio.
│
└── Autonomax.Frontend (React)
    ├── src/
    │   ├── assets/     # Imagens 
    │   ├── components/ # Componentes reutilizáveis (Layout, Header...)
    │   ├── pages/      # Páginas (Dashboard, Clientes, Login...)
    │   └── services/   # Configuração do Axios (API)
```

### 👤 Autor
## Allison - Desenvolvedor Full Stack
