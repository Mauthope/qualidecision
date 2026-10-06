# Diretório de Instruções de Agentes de IA (Lean Flow System)

Este diretório foi criado para armazenar arquivos com **instruções, diretrizes e papéis especializados para Agentes de IA**, auxiliando no desenvolvimento contínuo, governança, segurança e expansão do **Fluxo Lean System**.

---

## Como Funciona

Você pode criar arquivos `.md` (Markdown) nesta pasta para definir agentes com papéis específicos. Sempre que iniciarmos um trabalho ou você me pedir para atuar com base em um agente (ex: *"aja como o agente revisor de segurança"* ou *"consulte as instruções do analista lean"*), eu lerei e seguirei estritamente as regras definidas no arquivo correspondente.

Além disso, o arquivo raiz `AGENTS.md` instrui o assistente a sempre consultar esta pasta para manter o alinhamento com os padrões do projeto.

---

## Sugestões de Agentes para este Projeto

| Arquivo Recomendado | Especialidade / Papel | Quando Usar |
| :--- | :--- | :--- |
| `security-expert.md` | **SecOps & Governança (Grupo Vaccaro / PSI)** | Para revisar código, queries SQL, RLS e autenticação antes de publicar. |
| `designer.md` | **Design System Executivo & UI Obsidian Navy** | Para criação de telas, componentes acessíveis, iconografia e harmonia visual. |
| `copywriter.md` | **UX Writing & Redação Industrial** | Para padronização de textos, mensagens, microcopy e vocabulário Lean/TPS. |
| `cleancod.md` | **Clean Code, SOLID & Otimização de Tokens** | Para refatorações, modularização, desacoplamento e tipagem TypeScript estrita. |

---

## Modelo de Criação

Para criar um novo agente, você pode duplicar o arquivo [`TEMPLATE_AGENTE.md`](./TEMPLATE_AGENTE.md) e preencher as seções:

```markdown
# Nome do Agente (Ex: Agente Auditor de Segurança)

## 1. Identidade & Papel
- Quem é o agente e qual o seu foco principal.

## 2. Diretrizes Inegociáveis
- O que o agente NUNCA deve permitir (ex: expor chaves, burlar RLS).

## 3. Padrões Técnicos
- Tecnologias, convenções de código e boas práticas esperadas.

## 4. Exemplos de Ação
- Casos de uso práticos onde esse agente deve intervir.
```

---

*Diretório integrado ao ecossistema do **Fluxo Lean System** • Rafitec S.A. / Grupo Vaccaro.*
