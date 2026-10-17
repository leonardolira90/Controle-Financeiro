# Finanças — Controle Financeiro

Plataforma para organizar a vida financeira pessoal, acessível pelo **navegador (desktop)** e pelo **celular** — pode ser instalada como aplicativo (PWA) na tela inicial do Android e do iOS.

Inspirada nas principais soluções do mercado (Mobills, Organizze, YNAB, Monarch), com layout limpo, responsivo e tema claro/escuro.

## Funcionalidades

- **Visão geral**: saldo atual, receitas, despesas e resultado do mês com comparação ao mês anterior; fluxo de caixa dos últimos 6 meses; despesas por categoria; contas; orçamentos; próximos vencimentos e evolução do patrimônio.
- **Lançamentos (cadastro)**: receitas, despesas e transferências entre contas, com categoria, conta, situação (pago/pendente), observações, **parcelamento** e **lançamentos fixos mensais**. Busca e filtros por tipo, categoria, conta e situação.
- **Contas**: conta corrente, poupança, carteira, investimentos e cartão, com saldo atual e saldo previsto.
- **Orçamentos**: limite mensal por categoria, com alertas de 80% e de estouro e sugestão baseada na média dos últimos 3 meses.
- **Metas**: objetivos com prazo, progresso e valor mensal necessário para alcançá-los.
- **Relatórios**: períodos de 1, 3, 6 ou 12 meses, ano atual ou personalizado; gráficos de receitas × despesas, evolução do saldo, distribuição por categoria; tabelas de resumo mensal e por categoria; **exportação em CSV** (compatível com Excel) e **impressão/PDF**.
- **Configurações**: nome, tema (automático/claro/escuro), modo privacidade (oculta valores), gestão de categorias (ícone e cor), backup/restauração em JSON, dados de exemplo e reinício.

Os dados ficam salvos localmente no dispositivo (`localStorage`). Use o backup em JSON para transferi-los entre dispositivos.

## Tecnologias

React 19 + TypeScript + Vite, Recharts (gráficos), lucide-react (ícones), React Router. Sem backend.

## Como executar

```bash
npm install
npm run dev       # ambiente de desenvolvimento em http://localhost:5173
npm run build     # build de produção em dist/
npm run preview   # serve o build de produção
```

O conteúdo de `dist/` pode ser publicado em qualquer hospedagem estática (GitHub Pages, Netlify, Vercel). Ao acessar pelo celular, use "Adicionar à tela inicial" para instalar como app.

## Estrutura

```
src/
  components/   Layout, formulário de lançamento, gráficos, componentes de UI
  pages/        Visão geral, Lançamentos, Contas, Orçamentos, Metas, Relatórios, Configurações
  store/        Estado global persistido (FinanceContext), estado de interface e dados de exemplo
  utils/        Formatação (pt-BR/BRL), cálculos financeiros, exportação e tema
  styles/       Design system (tokens, temas claro/escuro, responsividade, impressão)
public/         Manifesto PWA, ícone e service worker (uso offline)
```
