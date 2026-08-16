# 🚀 Patch Notes & Histórico de Atualizações — Baby Tracker

---

## 📌 Versão 2.5.0 — (16/08/2026)
### 📱 PWA (Progressive Web App) & Suporte Mobile Nativo
1. **📲 Aplicativo Instalável (PWA)**:
   - Configuração completa com `@ducanh2912/next-pwa` e manifest nativo (`/manifest.json` e `src/app/manifest.ts`).
   - Suporte a instalação nativa no Android (Chrome) e iOS (Safari "Adicionar à Tela de Início").
   - Execução em modo tela cheia (*standalone*) com barra de status adaptativa (`black-translucent` / `#0f172a`).

2. **🎨 Ícones Nativos e Assets PWA**:
   - Ícones de alta resolução gerados em `public/icons/` (192x192, 512x512 e maskable).
   - Suporte a cache inteligente para carregamento rápido offline.

---

## 📌 Versão 2.4.1 — (16/08/2026)
### 🌟 Novas Funcionalidades & Melhorias
1. **⏰ Utilitário de Janela de Vigília (`src/lib/sleep-window.ts`)**:
   - Algoritmo de cálculo dinâmico da Janela de Vigília/Sono baseado na idade exata do bebê em dias (0-30d, 31-60d, 61-120d e >120d).
   - Classificação visual automática no Dashboard: *Acordado / Tranquilo* (verde), *Momento Ideal p/ Soneca* (índigo), *Janela Estourando* (âmbar) e *Sobrecansaço* (rosa).

2. **🔄 Sincronização de Soneca Ativa em Tempo Real via Firebase**:
   - Registro de soneca ativa (`status: 'RUNNING'`) no Firestore instantaneamente no momento em que o modo soneca é ativado.
   - Sincronização via `onSnapshot` no Dashboard: quando a mãe ou pai ativa uma soneca em um dispositivo, **todos os demais dispositivos conectados exibem imediatamente o status "Dormindo 🌙"**.
   - Atualização automática para `status: 'FINISHED'` e gravação da duração final no banco ao concluir.

---

## 📌 Versão 2.4.0 — (16/08/2026)
### 🌟 Novas Funcionalidades
1. **🧠 Acervo de Conhecimento Pediátrico (`/knowledge`)**:
   - Novo hub de conhecimento baseado em evidências científicas e diretrizes oficiais da **OMS**, **SBP** e **AAP**.
   - Guias práticos sobre amamentação, pega correta, higiene do sono seguro (prevenção de SIDS), introdução alimentar (BLW e amassadinhos), desobstrução de vias aéreas (Manobra de Heimlich em lactentes), manejo de febre e neurodesenvolvimento nos 1.000 primeiros dias.
   - Busca em tempo real por palavras-chave e filtro inteligente por categorias.

2. **🚀 Acompanhamento Semanal de Saltos de Desenvolvimento (`/leaps`)**:
   - Mapeamento completo dos 10 saltos mentais (*Wonder Weeks*) e cálculo dinâmico da idade semanal do bebê.
   - Indicador visual em tempo real do estado emocional: **Fase da Tempestade 🌩️** (irritabilidade/choro) vs. **Fase do Sol ☀️** (aprendizado e novas conquistas).
   - Checklist interativo de marcos motores, cognitivos e emocionais para cada semana de vida.

3. **⏸️ Sistema de Pausa em Mamadas e Sonecas**:
   - **Mamadas**: Botão de pausa com seletor de motivos (**Troca de Fralda** 👶, **Troca de Peito** 🤱 com alternância automática entre o seio esquerdo e direito, ou Pausa Genérica).
   - **Sonecas (Modo Soneca Smart)**: Botão de pausa inteligente que congela o cronômetro, silencia suavemente o ruído branco e desativa o monitor de choro até ser retomado.

4. **🍼 Inclusão Manual de Registros de Amamentação e Sono**:
   - Opção de registrar mamadas passadas no peito ou mamadeira com data/hora, duração e dosagem em ML.
   - Opção de registrar sonecas manuais com horário inicial, horário final, duração efetiva e observações.

5. **🩺 Reformulação do Mural de Consultas para "Acompanhamento Médico" (`/appointments`)**:
   - Expansão do sistema para categorizar não apenas **Consultas Médicas** 🩺, mas também **Exames Laboratoriais/Imagem** 🧪 (Sangue, Ultrassom) e **Testes Neonatais/Rotina** 🔬 (Teste do Pezinho, Orelhinha, Olhinho, Coraçãozinho).
   - Abas de filtro na interface e distinção por cores e ícones na visão de lista e no Calendário interativo estilo Google Agenda.

---

## 📌 Versão 2.3.0 — (10/08/2026)
### 🛠️ Melhorias de Infraestrutura & Sync
- **Sincronização em Tempo Real com Firebase Firestore**: Sincronização instantânea de registros de amamentação, fraldas, crescimento e vacinas em múltiplos dispositivos.
- **Ajuste nas Regras de Segurança e Coleções Firestore**: Alinhamento de nomes de coleções em ambiente de produção.
- **Novo Design da Dashboard**: Layout responsivo com 4 cards de status rápido, barra de progresso diária e aviso de constipação (>36h).

---

## 📌 Versão 2.2.0 — (04/08/2026)
### 🌙 Modo Soneca Smart & Detector de Choro
- Player integrado de ruído branco (chuva, ruído clássico e som do útero) com controle de volume.
- Monitoramento de áudio via microfone para detecção automática de choro do bebê com alerta nativo de encerramento de soneca.
- Modo Penumbra / Luz de Presença para manter a tela ligada com brilho reduzido durante a noite.

---

## 📌 Versão 2.1.0 — (25/07/2026)
### 📏 Curvas de Crescimento & Carteira de Vacinação
- Gráficos antropométricos de peso, altura e perímetro cefálico.
- Cadastro e controle de vacinas aplicadas com alertas de idade recomendada.

---

## 📌 Versão 1.0.0 — (01/06/2026)
### 🎉 Lançamento Inicial
- Registro rápido de fraldas (xixi e cocô).
- Cronômetro simples de amamentação.
- Cadastro de perfis de bebês e compartilhamento para casais/cuidadores.
