'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Calendar, Sun, CloudRain, CheckCircle2, Award, ChevronRight, ChevronLeft, Info, HelpCircle } from 'lucide-react';

interface LeapInfo {
  leapNumber: number;
  startWeek: number;
  endWeek: number;
  title: string;
  subtitle: string;
  description: string;
  stormPhaseText: string;
  sunnyPhaseText: string;
  newSkills: string[];
  tipsForParents: string[];
}

const ALL_LEAPS: LeapInfo[] = [
  {
    leapNumber: 1,
    startWeek: 4,
    endWeek: 6,
    title: 'Salto 1: O Mundo das Sensações',
    subtitle: 'Desenvolvimento dos Órgãos dos Sentidos (~5 Semanas)',
    description: 'O metabolismo e o sistema nervoso do bebê dão um salto de maturação. O bebê percebe o mundo externo de forma muito mais nítida e intensa.',
    stormPhaseText: 'Choro mais frequente, busca incessante por colo e contato pele a pele, alteração nos horários de mamada.',
    sunnyPhaseText: 'Primeiros sorrisos intencionais (sociais), olhar atento focado nos rostos dos pais, respostas aos sons ambiente.',
    newSkills: [
      'Sorrido social consciente ao ver os pais',
      'Derramamento das primeiras lágrimas reais ao chorar',
      'Fixação do olhar em rostos e objetos contrastantes por mais tempo',
      'Respostas com sobressalto ou atenção a sons da casa',
    ],
    tipsForParents: [
      'Ofereça muito contato pele a pele (sling/colo) para trazer a sensação de segurança do útero.',
      'Converse suavemente olhando nos olhos do bebê a uma distância de 20 a 30 cm.',
      'Mantenha o ambiente calmo com meia-luz e ruído branco nas sonecas.',
    ],
  },
  {
    leapNumber: 2,
    startWeek: 7,
    endWeek: 9,
    title: 'Salto 2: O Mundo dos Padrões',
    subtitle: 'Reconhecimento de Formas e Sons (~8 Semanas)',
    description: 'O bebê descobre que o mundo tem padrões estáticos e repetitivos. Ele percebe que as próprias mãos e pés pertencem ao seu corpo.',
    stormPhaseText: 'Mais irritabilidade ao anoitecer (hora da bruxa), resistência para dormir no berço, busca contínua pelo seio/mamadeira para conforto.',
    sunnyPhaseText: 'Observação fascinada das próprias mãos, emissão de sons de vogais (gugu, dada), virada de cabeça na direção de barulhos.',
    newSkills: [
      'Descoberta e observação contínua das próprias mãos e dedos',
      'Emissão dos primeiros balbucios e sons vocálicos',
      'Acompanhamento de objetos em movimento lento com a cabeça',
      'Movimentos mais coordenados de braços e pernas',
    ],
    tipsForParents: [
      'Coloque móbiles de contraste simples no berço para o bebê observar.',
      'Estimule o "tummy time" (tempo de barriga para baixo) por alguns minutos enquanto desperto.',
      'Responda aos balbucios imitando os sons e fazendo pausas na conversa.',
    ],
  },
  {
    leapNumber: 3,
    startWeek: 11,
    endWeek: 13,
    title: 'Salto 3: Transições Suaves',
    subtitle: 'Movimentos Fluidos e Sensibilidade Corporal (~12 Semanas)',
    description: 'Os movimentos do bebê deixam de ser puramente reflexos ou robóticos e se tornam mais fluidos e intencionais.',
    stormPhaseText: 'Sono agitado com despertares frequentes, recusa temporária do berço, desinteresse repentino por brinquedos.',
    sunnyPhaseText: 'Controle firme do pescoço, acompanhamento visual contínuo de 180°, risadas gostosas e gargalhadas.',
    newSkills: [
      'Sustentação firme da cabeça ao estar no colo ou de bruços',
      'Tentativa ativa de esticar os braços para alcançar brinquedos',
      'Variação de tom de voz nos balbucios e primeiras gargalhadas',
      'Acompanhamento visual suave em arco de 180 graus',
    ],
    tipsForParents: [
      'Ofereça chocalhos leves para o bebê tentar segurar.',
      'Cante músicas com gestos e expressões faciais marcantes.',
      'Proporcione momentos de massagem (shantala) para relaxar a musculatura.',
    ],
  },
  {
    leapNumber: 4,
    startWeek: 18,
    endWeek: 20,
    title: 'Salto 4: O Mundo dos Eventos',
    subtitle: 'Compreensão de Causa e Efeito (~19 Semanas / 4.5 Meses)',
    description: 'Um dos maiores saltos! O bebê percebe que uma ação gera uma consequência (ex: balançar o chocalho faz barulho, soltar a chupeta faz cair).',
    stormPhaseText: 'Regressão do sono de 4 meses (mudança estrutural nos ciclos de sono), choro mais forte e frustração rápida.',
    sunnyPhaseText: 'Agarrar brinquedos com precisão, levar tudo à boca, virar de bruços para as costas (rolar), grande curiosidade pelo ambiente.',
    newSkills: [
      'Rolar da posição de costas para de bruços (ou vice-versa)',
      'Passar objetos de uma mão para a outra',
      'Exploração oral vigorosa de todos os brinquedos',
      'Reconhecimento nítido do próprio nome ao ser chamado',
    ],
    tipsForParents: [
      'Garanta um ambiente seguro no chão (tapete de atividades) para rolar livremente.',
      'Brinque de "Cadê o bebê? Achou!" escondendo o rosto atrás das mãos.',
      'Ofereça mordedores de texturas diferentes para aliviar a gengiva.',
    ],
  },
  {
    leapNumber: 5,
    startWeek: 24,
    endWeek: 27,
    title: 'Salto 5: O Mundo das Relações',
    subtitle: 'Noção de Distância e Ansiedade de Separação (~26 Semanas / 6 Meses)',
    description: 'O bebê compreende a distância física entre os objetos e as pessoas. Ele percebe que os pais podem se afastar para outro cômodo, surgindo a ansiedade de separação.',
    stormPhaseText: 'Choro ao ver pessoas estranhas, apego excessivo à mãe/pai, acordar procurando os pais no quarto.',
    sunnyPhaseText: 'Sentar com apoio, início da introdução alimentar com curiosidade, compreensão de palavras familiares ("papai", "mamãe", "não").',
    newSkills: [
      'Sentar com apoio e manter o tronco ereto',
      'Interesse ativo pela comida dos adultos (Sinal de Prontidão)',
      'Entendimento da relação de distância espacial entre objetos',
      'Bater palminhas ou acenar ("tchau") ao ser estimulado',
    ],
    tipsForParents: [
      'Jogue jogos de esconde-esconde para ensinar que você volta quando se afasta.',
      'Respeite a timidez com estranhos sem forçar o colo de desconhecidos.',
      'Inicie a Introdução Alimentar aos 6 meses respeitando os sinais de fome e saciedade.',
    ],
  },
  {
    leapNumber: 6,
    startWeek: 35,
    endWeek: 38,
    title: 'Salto 6: O Mundo das Categorias',
    subtitle: 'Classificação e Comparação (~37 Semanas / 8.5 Meses)',
    description: 'O cérebro do bebê começa a categorizar o mundo: reconhece que cão e gato são "animais", que maçã e banana são "comidas".',
    stormPhaseText: 'Alterações no apetite durante as refeições, apego a objetos de transição (naninha/cobertor), resistência nas trocas de fralda.',
    sunnyPhaseText: 'Engatinhar ou se arrastar, imitação de gestos do dia a dia, teste da gravidade jorrando objetos do cadeirão.',
    newSkills: [
      'Engatinhar ou se locomover com autonomia pelo chão',
      'Uso da pinça (polegar e indicador) para pegar pequenos pedaços de comida',
      'Reconhecimento de categorias de objetos, cores e animais',
      'Imitação de gestos como mandar beijo e dar tchau',
    ],
    tipsForParents: [
      'Proteja tomadas, quinas de móveis e objetos quebráveis (baby-proofing).',
      'Ofereça livros infantis de pano/cartonados com figuras de animais e objetos.',
      'Deixe o bebê explorar diferentes texturas de alimentos amassados.',
    ],
  },
  {
    leapNumber: 7,
    startWeek: 44,
    endWeek: 47,
    title: 'Salto 7: O Mundo das Sequências',
    subtitle: 'Etapas das Ações e Montagem (~46 Semanas / 11 Meses)',
    description: 'O bebê aprende que as coisas acontecem em etapas sequenciais (ex: colocar a chave na fechadura, encaixar a argola na pirâmide).',
    stormPhaseText: 'Birras e frustrações quando algo não encaixa, acordar no meio da noite querendo treinar ficar em pé no berço.',
    sunnyPhaseText: 'Ficar em pé apoiado nos móveis, empilhar blocos, apontar o dedo indicador para mostrar o que deseja.',
    newSkills: [
      'Ficar em pé segurando no sofá ou grades do berço',
      'Apontar com o dedo indicador para pedir ou mostrar algo',
      'Encaixar peças simples e empilhar blocos de montar',
      'Compreensão de instruções simples ("dá para a mamãe", "pega a bola")',
    ],
    tipsForParents: [
      'Brinque com blocos de empilhar e recipientes de colocar e tirar objetos.',
      'Nomeie os objetos que o bebê aponta no dia a dia.',
      'Elogie as tentativas e pequenas conquistas de autonomia do bebê.',
    ],
  },
  {
    leapNumber: 8,
    startWeek: 53,
    endWeek: 57,
    title: 'Salto 8: O Mundo dos Programas',
    subtitle: 'Tarefas Complexas e Consequências (~55 Semanas / 1 Ano)',
    description: 'O bebê de 1 ano compreende "programas" de ações (ex: para ir passear é preciso colocar o sapato, pegar o casaco e abrir a porta).',
    stormPhaseText: 'Mudanças no padrão de sonecas (transição para 1 ou 2 sonecas), comportamento mais decidido e teimosia.',
    sunnyPhaseText: 'Primeiros passos sem apoio, fala das primeiras palavras com significado ("água", "papa", "mama"), ajuda a se vestir.',
    newSkills: [
      'Dar os primeiros passos sem apoio',
      'Falar de 2 a 5 palavras com significado claro',
      'Ajudar no momento de vestir (esticar os braços/pernas)',
      'Uso de utensílios como colher e copinho aberto (com ajuda)',
    ],
    tipsForParents: [
      'Crie rotinas diárias previsíveis (banho, janta, história, sono).',
      'Permita que a criança treine andar em locais seguros ao ar livre.',
      'Evite corrigir excessivamente a fala; apenas repita a palavra corretamente de forma natural.',
    ],
  },
  {
    leapNumber: 9,
    startWeek: 62,
    endWeek: 66,
    title: 'Salto 9: O Mundo dos Princípios',
    subtitle: 'Estratégias, Jogos e Vontades (~64 Semanas / 15 Meses)',
    description: 'A criança descobre que pode usar estratégias para obter o que quer (ex: negociar, fazer drama, imitar os adultos em brincadeiras de faz-de-conta).',
    stormPhaseText: 'Fase inicial do "terrible twos" (birras por independência), protestos fortes ao ouvir "não", sono instável.',
    sunnyPhaseText: 'Brincadeiras simbólicas (dar comida para a boneca, falar no telefone de brinquedo), corrida lenta, vocabulário em expansão.',
    newSkills: [
      'Desenvolvimento de jogos de faz-de-conta (brincadeira simbólica)',
      'Subir degraus baixos engatinhando ou com apoio',
      'Compreensão de regras sociais de convivência e compartilhamento',
      'Expressão clara de emoções como afeto, ciúme e orgulho',
    ],
    tipsForParents: [
      'Estabeleça limites firmes e carinhosos sem gritos.',
      'Ofereça escolhas simples ("Quer o copo azul ou o vermelho?") para dar sensação de controle.',
      'Estimule brincadeiras de faz-de-conta e imitação cotidiana.',
    ],
  },
  {
    leapNumber: 10,
    startWeek: 73,
    endWeek: 77,
    title: 'Salto 10: O Mundo dos Sistemas',
    subtitle: 'Consciência Individual e Linguagem (~75 Semanas / 18 Meses / 1.5 Anos)',
    description: 'A criança desenvolve a consciência de si mesma como um indivíduo separado com vontades, princípios morais e capacidade de raciocínio abstrato.',
    stormPhaseText: 'Aumento das birras e frustração emocional por não conseguir comunicar tudo o que pensa.',
    sunnyPhaseText: 'Surto de vocabulário (combinação de duas palavras como "dá água"), autonomia para comer sozinho, empatia por outras crianças.',
    newSkills: [
      'Combinação de 2 ou mais palavras em frases simples',
      'Consciência de si mesma no espelho e em fotos',
      'Correr com equilíbrio e chutar uma bola',
      'Demonstração de empatia (oferecer carinho ou brinquedo ao ver alguém triste)',
    ],
    tipsForParents: [
      'Ajude a criança a nomear as emoções ("Você ficou chateado porque o brinquedo caiu").',
      'Leia livros interativos diariamente para expandir o vocabulário.',
      'Garanta momentos diários de atividade física e contato com a natureza.',
    ],
  },
];

export default function GrowthLeapsPage() {
  const [baby, setBaby] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number>(5);

  useEffect(() => {
    async function loadBaby() {
      try {
        const stored = localStorage.getItem('activeBabyId');
        const activeBabyId = (stored && stored !== 'undefined' && stored !== 'null') ? stored : '';

        const res = await fetch('/api/babies');
        const babies = await res.json();
        if (Array.isArray(babies) && babies.length > 0) {
          const current = babies.find((b: any) => b.id === activeBabyId) || babies[0];
          setBaby(current);

          if (current?.birthDate) {
            const bDate = new Date(current.birthDate);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
            const calculatedWeeks = Math.max(1, Math.floor(diffDays / 7));
            setSelectedWeek(Math.min(78, calculatedWeeks));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadBaby();
  }, []);

  // Compute Baby Age in Weeks & Days
  let currentWeeks = 5;
  let currentDaysRemainder = 0;
  if (baby?.birthDate) {
    const bDate = new Date(baby.birthDate);
    const now = new Date();
    const totalDays = Math.max(0, Math.floor((now.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24)));
    currentWeeks = Math.floor(totalDays / 7);
    currentDaysRemainder = totalDays % 7;
  }

  // Find active leap for the selected week
  const activeLeap = ALL_LEAPS.find(
    (l) => selectedWeek >= l.startWeek - 1 && selectedWeek <= l.endWeek + 1
  );

  // Check if current week is in a storm phase (fussy phase)
  const isStormyWeek = ALL_LEAPS.some(
    (l) => selectedWeek >= l.startWeek && selectedWeek <= l.endWeek
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs dark:shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/20">
              Desenvolvimento Semanal Baseado em Evidências
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2 flex items-center gap-2">
              <Sparkles size={26} className="text-amber-500" />
              Saltos de Desenvolvimento Semanal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-2xl">
              Acompanhe as fases de saltos mentais, crises de irritabilidade (Fase da Tempestade 🌩️) e conquistas de novas habilidades (Fase do Sol ☀️).
            </p>
          </div>

          {/* Current Baby Status Card */}
          {baby && (
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-indigo-400 block">
                👶 Idade Atual de {baby.name}
              </span>
              <p className="text-base font-black text-slate-800 dark:text-slate-100">
                {currentWeeks} Semana(s) e {currentDaysRemainder} dia(s)
              </p>
              <div className="flex items-center gap-1.5 text-xs font-bold pt-1">
                {isStormyWeek ? (
                  <span className="text-amber-500 flex items-center gap-1">
                    🌩️ Período de Salto / Irritabilidade
                  </span>
                ) : (
                  <span className="text-emerald-500 flex items-center gap-1">
                    ☀️ Período de Sol / Estabilidade
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Navigator Slider (Week 1 to Week 75) */}
        <div className="pt-4 border-t border-rose-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar size={15} className="text-rose-500 dark:text-indigo-400" />
              Navegar nas Semanas de Vida: <span className="text-rose-500 dark:text-indigo-400 font-extrabold text-sm">Semana {selectedWeek}</span>
            </label>
            <button
              onClick={() => setSelectedWeek(Math.max(1, currentWeeks))}
              className="text-[11px] font-bold text-rose-500 dark:text-indigo-400 hover:underline"
            >
              Ir para Semana Atual ({currentWeeks}w)
            </button>
          </div>

          <input
            type="range"
            min="1"
            max="75"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 dark:accent-indigo-500"
          />

          {/* Timeline Quick Select Pills for 10 Leaps */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ALL_LEAPS.map((leap) => {
              const isActive = selectedWeek >= leap.startWeek && selectedWeek <= leap.endWeek;
              const isPassed = selectedWeek > leap.endWeek;

              return (
                <button
                  key={leap.leapNumber}
                  onClick={() => setSelectedWeek(leap.startWeek)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                      : isPassed
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span>Salto {leap.leapNumber} (~{leap.startWeek}w)</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Display of Selected Week & Active Leap Details */}
      {activeLeap ? (
        <div className="space-y-6">
          {/* Active Leap Overview Card */}
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs dark:shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  Salto {activeLeap.leapNumber} de 10
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">
                  {activeLeap.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  {activeLeap.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                  className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 transition"
                  title="Semana Anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono px-2">
                  Semana {selectedWeek}
                </span>
                <button
                  onClick={() => setSelectedWeek(Math.min(75, selectedWeek + 1))}
                  className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 transition"
                  title="Próxima Semana"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {activeLeap.description}
            </p>

            {/* Storm Phase vs Sunny Phase Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Storm Phase Box */}
              <div className="bg-amber-50/70 dark:bg-slate-950/80 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <CloudRain size={18} />
                  <span>Fase da Tempestade (O que esperar no comportamento)</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {activeLeap.stormPhaseText}
                </p>
              </div>

              {/* Sunny Phase Box */}
              <div className="bg-emerald-50/70 dark:bg-slate-950/80 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Sun size={18} />
                  <span>Fase do Sol (Novas Habilidades & Conquistas)</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {activeLeap.sunnyPhaseText}
                </p>
              </div>
            </div>

            {/* New Skills Checklist */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Award size={16} className="text-rose-500 dark:text-indigo-400" />
                Novas Habilidades Adquiridas neste Salto:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeLeap.newSkills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips for Parents */}
            <div className="bg-rose-50/60 dark:bg-indigo-950/40 border border-rose-200/60 dark:border-indigo-800/50 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-indigo-300 flex items-center gap-2">
                <Info size={16} /> Dicas Práticas de Estímulo e Acolhimento:
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200 font-medium">
                {activeLeap.tipsForParents.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-500 dark:text-indigo-400 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <p className="text-xs text-slate-500 font-medium">
            Semana {selectedWeek}: Período de consolidação e estabilidade. O próximo salto grande ocorrerá nas próximas semanas!
          </p>
        </div>
      )}
    </div>
  );
}
