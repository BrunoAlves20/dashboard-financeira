# 📊 Finanças Inteligentes (Financial Dashboard Full-Stack)

![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10+-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Gemini API](https://img.shields.io/badge/Gemini-AI-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 1. Visão Geral

O **Finanças Inteligentes** é uma aplicação Full-Stack robusta para gestão financeira pessoal. Projetado com uma arquitetura modular e escalável, o sistema permite o controle minucioso de receitas, despesas, categorias customizadas com limites de orçamento e bancos. 

O grande diferencial técnico é a **Integração nativa com Inteligência Artificial (Google Gemini API)**, que atua como um assistente financeiro contextual, lendo dados reais do banco de dados do usuário (saldos e limites) para fornecer consultoria imediata sobre viabilidade de compras e saúde financeira.

### Escopo e Benefícios
* **Arquitetura Desacoplada**: Backend e Frontend separados, facilitando futuras migrações para Cloud (AWS EC2/ECS).
* **Gestão de Estado Inteligente**: Frontend reativo com Angular, garantindo atualizações de saldo e gráficos em tempo real.
* **Segurança**: Autenticação via tokens JWT e proteção de rotas.
* **Assistente IA Contextual**: Processamento de linguagem natural integrado às regras de negócio.

### Arquitetura do Sistema

```mermaid
graph TD
    Client[Frontend: Angular 17+] -->|REST API / JWT| API[Backend: NestJS]
    API -->|Prisma ORM| DB[(PostgreSQL)]
    API -->|@google/genai| Gemini[Google Gemini AI]
    
    subgraph Funcionalidades Principais
    Auth(Autenticação)
    Tx(Transações & Bancos)
    Cat(Categorias & Limites)
    Chat(Assistente IA)
    end

## 2. Instalação e Configuração

Siga os passos abaixo para configurar o ambiente de desenvolvimento local.

### Pré-requisitos
* **Node.js** (v18 ou superior)
* **Docker** e **Docker Compose**
* Chave de API do **Google AI Studio** (Gemini)

### Passo 2.1: Subir o Banco de Dados
Na raiz do projeto, execute o container do PostgreSQL:
```bash
docker-compose up -d
```

### Passo 2.2: Configurar o Backend (NestJS)
1. Navegue até o diretório do backend e instale as dependências:
```bash
cd backend
npm install
```
2. Crie um arquivo `.env` na pasta `backend` com as seguintes variáveis:
```env
DATABASE_URL="postgresql://postgres:suasenha@localhost:5432/finance_db?schema=public"
JWT_SECRET="sua_chave_jwt_super_segura_aqui"
GEMINI_API_KEY="sua_chave_api_do_google_aqui"
```
3. Execute as migrações do Prisma para estruturar o banco:
```bash
npx prisma migrate dev --name init
```
4. Inicie o servidor em modo de desenvolvimento:
```bash
npm run start:dev
```
*A API estará disponível em `http://localhost:3000`.*

### Passo 2.3: Configurar o Frontend (Angular)
1. Em um novo terminal, navegue até a pasta do frontend e instale as dependências:
```bash
cd frontend
npm install
```
2. Inicie a aplicação:
```bash
npm run start
```
*A interface estará disponível em `http://localhost:4200`.*

---

## 3. Uso e Exemplos Práticos

### Criando Categorias e Limites
1. No Dashboard, clique em **+ Criar Categoria**.
2. Defina o nome (ex: "Vestuário") e um limite mensal opcional (ex: "300.00").
3. As transações atreladas a essa categoria atualizarão automaticamente a barra de progresso visual.

### Lançando Transações (Entradas e Saídas)
* **Entradas**: Selecione o botão verde (Entrada). O campo "Forma de Pagamento" será ocultado automaticamente pela lógica reativa do formulário.
* **Saídas**: Selecione o banco de origem e o método de pagamento. Caso o banco não exista, adicione-o via modal "Gerenciar Bancos".

### Consultoria com a Inteligência Artificial
Com transações e categorias criadas, clique no ícone flutuante 🤖 no canto inferior direito e envie um prompt:
> **Usuário:** *"Posso comprar uma saia de R$ 150,00 no débito Nubank?"*
> **FinAI:** *"Não. Você já gastou R$ 200,00 do seu limite de R$ 300,00 na categoria Vestuário. Uma compra de R$ 150,00 ultrapassaria seu teto em R$ 50,00."*

---

## 4. Referência de API (Principais Endpoints)

A API RESTful foi documentada e padronizada. Todas as rotas (exceto autenticação) exigem o header `Authorization: Bearer <token>`.

### 🟡 Módulo de Transações (`/transactions`)

| Método | Rota | Descrição | Payload (Body) |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Cria nova transação | `{ "title": "Mercado", "amount": 150, "type": "EXPENSE", "categoryId": "uuid", "paymentMethod": "CREDIT", "bank": "Nubank" }` |
| `GET` | `/` | Lista transações do usuário | - |
| `GET` | `/summary` | Retorna consolidação de saldos | - |
| `DELETE` | `/:id` | Remove uma transação | - |

**Exemplo de Resposta de `/summary`:**
```json
{
  "balance": 1250.50,
  "incomes": 5000.00,
  "expenses": 3749.50
}
```

### 🟣 Módulo de Inteligência Artificial (`/ai`)

| Método | Rota | Descrição | Payload (Body) |
| :--- | :--- | :--- | :--- |
| `POST` | `/ask` | Processa pergunta com o Gemini | `{ "prompt": "Posso gastar 200 em lazer?" }` |

**Exemplo de Resposta:**
```json
{
  "answer": "Sim, você pode. Seu limite de lazer é R$ 500 e você gastou apenas R$ 100 até o momento."
}
```

---

## 5. FAQ e Solução de Problemas

**1. Erro: `ApiError: {"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}` no Chat da IA**
* **Causa**: Limite de requisições por minuto da camada gratuita do Google Gemini excedido (Rate Limit).
* **Solução**: O frontend foi programado para tratar este erro de forma elegante. Aguarde aproximadamente 30 a 60 segundos e tente enviar o prompt novamente.

**2. Erro: Falha de relacionamento Prisma ao salvar Transação sem Categoria (`categoryId IN (NULL)`)**
* **Causa**: O frontend enviou uma string vazia `""` em vez de ignorar o parâmetro quando o usuário seleciona "Sem Categoria".
* **Solução**: Já corrigido na v1.0. O payload converte campos não selecionados para `undefined`, permitindo que o Prisma salve a transação com `categoryId: null`.

**3. Erro: NestJS retornando `401 Unauthorized`**
* **Causa**: O token JWT expirou ou não está sendo enviado nos cabeçalhos.
* **Solução**: Faça logout e login novamente no frontend. Verifique o `AuthInterceptor` no Angular para garantir que o cabeçalho `Authorization` está injetado corretamente.

