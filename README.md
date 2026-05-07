# Campaign Intelligence API

Aplicação fullstack para gerenciamento inteligente de campanhas de marketing, desenvolvida com foco em arquitetura backend, autenticação segura, cálculos financeiros no servidor e visualização estratégica de métricas em dashboard interativo.

---

# Preview

## Dashboard

- KPIs em tempo real
- Gráficos de performance
- Ranking de campanhas
- Filtros inteligentes
- Insights automáticos
- Interface responsiva

## Login

- Autenticação JWT
- Rotas protegidas
- Persistência de sessão
- Feedback visual com toast notifications

---

# Objetivo do Projeto

Este projeto foi desenvolvido como desafio técnico backend, com objetivo de demonstrar conhecimentos em:

- Desenvolvimento de APIs RESTful
- Arquitetura backend com TypeScript
- Autenticação JWT
- Persistência de dados
- Organização de código
- Regras de negócio
- Integração frontend/backend
- Visualização de métricas estratégicas

---

# Tecnologias Utilizadas

# Backend

- Node.js
- TypeScript
- Express
- Prisma ORM
- SQLite
- JWT
- bcrypt
- Zod
- Express Rate Limit

# Frontend

- React
- TypeScript
- Vite
- Recharts
- React Hot Toast
- CSS3

---

# Funcionalidades

## Autenticação

- Cadastro de usuários
- Login com JWT
- Rotas protegidas
- Middleware de autenticação
- Criptografia de senha com bcrypt

---

## Campanhas

- Cadastro de campanhas
- Listagem paginada
- Busca por nome
- Ordenação dinâmica
- Exclusão de campanhas
- Filtros estratégicos

---

## Dashboard Inteligente

- KPIs financeiros
- ROAS médio
- Lucro bruto
- Lucro real
- Melhor campanha
- Ranking de performance
- Gráficos de distribuição
- Insights automáticos

---

## Segurança

- Validação com Zod
- Rate limiting
- Middleware global de erros
- Proteção de rotas
- Sanitização básica de entrada

---

# Regras de Negócio

Todas as métricas financeiras são calculadas no backend.

| Métrica     | Fórmula                            |
| ----------- | ---------------------------------- |
| Lucro Bruto | Receita - Custo                    |
| Lucro Real  | Receita - Custo - Taxas - Despesas |
| ROAS        | Receita / Custo                    |

---

# Arquitetura do Projeto

```bash
campaign-intelligence-api
├── backend
│
│   ├── prisma
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src
│   │   ├── middlewares
│   │   ├── routes
│   │   ├── schemas
│   │   ├── services
│   │   ├── utils
│   │   └── server.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend
│
│   ├── src
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   └── assets
│   │
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

# Diferenciais Implementados

Mesmo sendo um desafio com foco principal em backend, foram adicionadas melhorias extras:

- Dashboard estilo SaaS
- UX moderna
- Interface responsiva
- Sistema de insights
- Paginação backend
- Busca dinâmica
- Ordenação por métricas
- Toast notifications
- Health check endpoint
- Logger de requisições
- Rate limiting
- Estrutura escalável

---

# Endpoints

# Auth

## Registrar usuário

```http
POST /auth/register
```

## Login

```http
POST /auth/login
```

---

# Campaigns

## Criar campanha

```http
POST /campaigns
```

## Listar campanhas

```http
GET /campaigns
```

### Query Params

| Query  | Descrição             |
| ------ | --------------------- |
| page   | Paginação             |
| limit  | Quantidade por página |
| search | Busca por nome        |
| sortBy | Ordenação             |
| order  | asc ou desc           |

---

## Remover campanha

```http
DELETE /campaigns/:id
```

---

# Como Executar o Projeto

# 1. Clonar repositório

```bash
git clone <repo-url>
```

---

# 2. Backend

```bash
cd backend
npm install
```

## Configurar .env

```env
PORT=3333
JWT_SECRET=your_secret
DATABASE_URL="file:./dev.db"
FRONTEND_URL=http://localhost:5173
```

---

## Executar migrations

```bash
npx prisma migrate dev
```

---

## Popular banco

```bash
npx prisma db seed
```

---

## Rodar backend

```bash
npm run dev
```

---

# 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# Usuário Demo

```txt
Email: demo@gteck.com.br
Senha: 123456
```

---

# Health Check

```http
GET /health
```

Resposta:

```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

# Melhorias Futuras

- Testes automatizados
- Refresh token
- Upload de imagens
- Dashboard analítico avançado
- Tema dinâmico
- Exportação de relatórios
- Docker
- Deploy CI/CD

---

# Autor

Desenvolvido por Gabriel Trisi.
