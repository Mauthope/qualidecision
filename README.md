# 🛡️ QualiDecision

> **Sistema Inteligente de Gestão de Qualidade Industrial, Tolerância de Clientes e Concessões Fabris**

QualiDecision é uma plataforma corporativa desenvolvida para apoiar os times de Engenharia de Qualidade e Controle Fabril na tomada de decisão sobre liberação de lotes sob concessão, mitigação de scrap (descarte de matéria-prima) e gerenciamento de perfil de tolerância técnica de clientes de embalagens industriais (Sacaria e Big Bags).

---

## 🚀 Principais Funcionalidades

- 📊 **Dashboard Executivo de Qualidade**: Indicadores em tempo real de Scrap Economizado (R$), Volume Concedido (un e kg), Taxa de Aceite de Concessões e Reclamações ativas.
- 🏢 **Catálogo & Radar de Tolerância de Clientes**:
  - Matriz técnica de tolerância por cliente cruzando as famílias de defeitos fabris.
  - Cálculo auditável de Score Geral de Tolerância (0 a 100%).
  - Classificação de exposição por peso reclamado no ERP (kg acumulados e média/rec).
  - Fluxo ágil de cadastro de novos clientes com 3 perfis iniciais (Padrão 80%, Exigente 50%, Flexível 90%).
- ⚡ **Simulador de Risco de Envio com Desvio**:
  - Equação estatística de risco com resolução aritmética explícita passo a passo.
  - Cruzamento em tempo real de histórico de reincidências de SAC e concessões anteriores.
- 📑 **Memorial de Cálculo Didático (`/memorial`)**:
  - Documentação matemática completa com KaTeX de todas as fórmulas utilizadas.
  - Simulador interativo auditável e dicionário de termos para qualquer nível de usuário.
- 🔄 **Integração Nativa com ERP Corporativo**:
  - 69 tipos exatos de problemas industriais catalogados.
  - 180 ocorrências procedentes sincronizadas com números de OP, laudos, evidências e setores responsáveis.
- 🤖 **Assistente IA de Qualidade em Tela Cheia**:
  - Chat inteligente com busca de OPs, visualização de laudos e fotos em alta resolução.

---

## 🛠️ Stack Tecnológica

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Animações**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Persistência**: Local Storage com suporte a importação/exportação JSON

---

## 📦 Instalação e Execução

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/Mauthope/qualidecision.git
   cd qualidecision
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Execute o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

4. **Build para produção**:
   ```bash
   npm run build
   npm start
   ```

---

## 📄 Licença

Projeto desenvolvido para fins industriais e corporativos de gestão de qualidade.
