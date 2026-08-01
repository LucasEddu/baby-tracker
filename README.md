# 👶 Baby Tracker - Aplicação de Acompanhamento do Bebê

Uma aplicação web & mobile responsiva, desenvolvida em **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** e **Prisma ORM (SQLite / PostgreSQL)**, projetada para o registro diário, saúde, amamentação, antropometria e imunização infantil.

Oferece suporte a **Modo Escuro (Dark Mode)** e **Modo Claro Acolhedor**, múltiplos perfis de bebês, cronômetro de amamentação em tempo real, botões de registro em 1-clique, contador diário de fraldas, gráficos interativos de crescimento, carteira de vacinação agrupada por idade e mural de recados/post-its.

---

## 🚀 Funcionalidades Principais

### 1. 🤱 Cronômetro de Amamentação & Alimentação
- **Iniciar Mamada em Tempo Real:** Botões dedicados para **Peito Esquerdo 🤱**, **Peito Direito 🤱** e **Mamadeira 🍼**.
- **Cronômetro Ativo:** Exibe o tempo decorrido da mamada segundo a segundo.
- **Registro de Quantidade:** Para mamadeiras, permite definir a quantidade ingerida em ml.
- **Histórico na Linha do Tempo:** Exibe automaticamente no feed o peito utilizado, a duração exata da mamada e observações.

### 2. 💩 Gestão de Eliminações & Botões em 1-Clique
- **Registro Rápido em 1-Clique:** Botões diretos para salvar eventos comuns de **💦 Xixi**, **💩 Cocô** ou **💩💦 Ambos** sem necessidade de abrir formulários.
- **Contador Diário de Fraldas:** Card no topo mostrando a contagem total de fraldas trocadas no dia atual (zerado à meia-noite).
- **Detalhamento Avançado:** Seleção de cor (*Amarelo 🟡, Verde 🟢, Castanho 🟤, Meconial 🖤, Alerta/Sangue 🚨*) e consistência (*Pastoso, Líquido, Endurecido, Mecônio*).
- **Alerta de Constipação:** Notificação visual em destaque caso não haja registro de evacuação de fezes há mais de 36 horas.

### 3. 📏 Crescimento & Antropometria (`/growth`)
- **Gráficos Interativos (Recharts):** Curvas de evolução visual para **Peso (kg)**, **Estatura (cm)** e **Perímetro Cefálico (cm)** dispostos em colunas lado a lado no Desktop.
- **Historização:** Registro de peso (em gramas), altura (em cm) e perímetro cefálico informando a origem da medição (*Em Casa 🏠* ou *Consulta Médica 🩺*).

### 4. 💉 Carteira de Vacinação (`/vaccines`)
- **Calendário Infantil da SBP / Ministério da Saúde:** Lista pré-cadastrada com 22 vacinas obrigatórias e recomendadas.
- **Agrupamento por Idade:** Abas retráteis e expansíveis (*Ao Nascer, 2 Meses, 3 Meses, 4 Meses, 5 Meses, 6 Meses, 9 Meses, 12 Meses e 15 Meses*).
- **Status & Métricas:** Barra de progresso percentual da vacinação e campos para lote, local de aplicação e efeitos colaterais.

### 5. 🩺 Consultas Médicas & Checklist (`/appointments`)
- **Cadastro Completo:** Nome do médico, especialidade (*Pediatria, Odontopediatria, etc.*), data/horário e motivo/descrição da consulta.
- **Classificação:** Diferenciação visual entre **🌱 Consulta de Rotina** e **🚨 Emergência / Pronto Socorro**.
- **Checklist "Antes da Consulta":** Bloco interativo de dúvidas para o pediatra com marcação de perguntas concluídas.
- **Orientações Pós-Consulta:** Bloco de anotações para prescrições e recomendações médicas.

### 6. 📌 Mural de Lembretes & Post-its (`/reminders`)
- **Quadro de Avisos do Bebê:** Mural de pins e recados coloridos (*Amarelo Pássaro 🟡, Rosa Chiclete 🩷, Verde Menta 🟢, Azul Céu 💙 e Roxo Lavanda 💜*).
- **Lembretes Rápidos:** Perfeito para anotações de horários de medicamentos, recados de fralda e avisos da rotina.

### 7. 👶 Suporte a Múltiplos Bebês & Temas
- **Perfis Independentes:** Cadastre e alterne facilmente entre perfis de diferentes bebês no cabeçalho.
- **Modo Claro Acolhedor & Dark Mode:** Alternador de tema com salvamento de preferência.

---

## 📐 Arquitetura & Tecnologias

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS, Lucide Icons, Recharts.
- **Backend / API:** Next.js Server API Routes com TypeScript.
- **Banco de Dados & ORM:** Prisma ORM v5 (SQLite por padrão para ambiente local, compatível com PostgreSQL).

---

## 🛠️ Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js v18+ e npm.

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/LucasEddu/baby-tracker.git
   cd baby-tracker
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Configurar o banco de dados e aplicar migrações:**
   ```bash
   npx prisma db push
   ```

4. **Executar o script de seed (popula o calendário de vacinas):**
   ```bash
   npx ts-node prisma/seed.ts
   ```

5. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

6. Abra o navegador em `http://localhost:3000` ou `http://localhost:3001`.

---

## 📄 Licença
Este projeto é distribuído sob a licença MIT.
