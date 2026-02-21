# GitHub Wrapped - Design Document

## Overview

Aplicacao web onde o usuario loga com GitHub e gera uma retrospectiva visual dos seus dados (commits, linguagens, repos, PRs, etc.) com textos criativos gerados por IA. O resultado final e um video MP4 no formato Instagram Stories/Reels (9:16) com animacoes, pronto para compartilhar.

## Decisoes

- **Periodo**: Customizavel (mes, trimestre, semestre, ano, custom)
- **Video**: Renderizado server-side com Remotion
- **Framework**: Next.js 15 (App Router) - monolito
- **IA**: Google Gemini API para textos criativos
- **DB**: SQLite + Drizzle ORM
- **Deploy**: VPS proprio com Docker

## Fluxo do Usuario

1. Acessa o site, faz login via GitHub OAuth
2. Seleciona o periodo
3. App busca dados do GitHub e processa analytics
4. Gemini gera textos criativos personalizados
5. Usuario visualiza retrospectiva animada no browser (preview)
6. Clica em "Gerar video" - servidor renderiza MP4 (1080x1920, ~30-45s)
7. Download do video

## Dados Coletados do GitHub

- **Commits**: total, por dia/semana/mes, streak maximo, horarios mais ativos
- **Linguagens**: distribuicao por bytes, evolucao no periodo
- **Repositorios**: mais contribuidos, novos criados, stars recebidas
- **Pull Requests**: abertos, mergeados, reviews feitos
- **Issues**: abertas, fechadas
- **Perfil**: followers ganhos no periodo

## Cenas do Video (sequencia)

1. **Intro** - "Seu GitHub Wrapped" + avatar + username + periodo
2. **Total de commits** - numero animado + mensagem criativa da IA
3. **Streak maximo** - calendario de contribuicoes animado
4. **Linguagens top** - grafico animado + comentario da IA
5. **Repositorio destaque** - nome + descricao + stats
6. **Horario mais produtivo** - heatmap animado + mensagem da IA
7. **PRs e Reviews** - numeros animados + texto criativo
8. **Resumo geral** - "personalidade de dev" gerada pela IA
9. **Outro** - logo do app + CTA

Formato: 9:16 (1080x1920), ~30-45 segundos.

## Stack Tecnica

- **Framework**: Next.js 15 (App Router)
- **Auth**: NextAuth.js v5 com GitHub Provider
- **DB**: SQLite + Drizzle ORM
- **Video**: Remotion 4 (@remotion/renderer server-side)
- **Animacoes preview**: Framer Motion
- **IA**: Google Gemini API
- **GitHub**: Octokit (REST + GraphQL)
- **Styling**: Tailwind CSS
- **Deploy**: Docker (Node + Chrome headless)

## Modelo de Dados

### users
- id (PK)
- githubId
- username
- avatarUrl
- accessToken (encrypted)
- createdAt, updatedAt

### retrospectives
- id (PK)
- userId (FK)
- periodStart, periodEnd
- githubData (JSON - dados brutos cacheados)
- aiTexts (JSON - textos gerados)
- status (pending | processing | ready | failed)
- videoUrl (path do MP4)
- createdAt, updatedAt

## API Routes

| Rota | Metodo | Descricao |
|------|--------|-----------|
| `/api/auth/[...nextauth]` | * | Auth GitHub OAuth |
| `/api/retrospective` | POST | Cria nova retrospectiva |
| `/api/retrospective/[id]` | GET | Status/dados da retrospectiva |
| `/api/retrospective/[id]/video` | POST | Inicia render do video |
| `/api/retrospective/[id]/video` | GET | Status/URL do video |
| `/api/retrospective/history` | GET | Lista retrospectivas do usuario |

## Fluxo de Geracao

```
POST /api/retrospective
  -> Busca dados GitHub (Octokit)
  -> Processa analytics
  -> Gemini gera textos criativos
  -> Salva no SQLite
  -> Retorna ID

POST /api/retrospective/[id]/video
  -> Renderiza Remotion composition server-side
  -> Salva MP4
  -> Atualiza status
  -> Retorna URL (polling async)
```
