'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, ShieldCheck, HeartPulse, Moon, Milk, Brain, Syringe, ChevronRight, X, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: string;
  category: 'breastfeeding' | 'sleep' | 'health' | 'development' | 'vaccines';
  title: string;
  subtitle: string;
  summary: string;
  evidenceLevel: string; // Ex: "Diretriz OMS / SBP", "Estudo Clínico Controlado"
  readingTimeMin: number;
  icon: string;
  takeaways: string[];
  content: string[];
  references: string[];
}

const ARTICLES_DATABASE: Article[] = [
  {
    id: 'amamentacao-livre-demanda',
    category: 'breastfeeding',
    title: 'Amamentação em Livre Demanda e Pega Correta',
    subtitle: 'Diretrizes da OMS e Sociedade Brasileira de Pediatria (SBP)',
    summary: 'Entenda a neurobiologia da lactação, a importância do contato pele a pele inicial e como identificar os sinais sutis de fome e a pega anatômica perfeita.',
    evidenceLevel: 'Diretriz Oficial OMS / SBP',
    readingTimeMin: 6,
    icon: '🍼',
    takeaways: [
      'O leite materno adapta sua composição imunitária em tempo real ao entrar em contato com a saliva do bebê.',
      'Livre demanda significa oferecer o peito sempre que o bebê demonstrar sinais iniciais de fome (lamber os lábios, virar a cabeça), sem estipular horários rígidos.',
      'A pega correta abrange grande parte da aréola, com lábios virados para fora (peixinho) e queixo encostado no mama.',
    ],
    content: [
      'A amamentação exclusiva é recomendada pela Organização Mundial da Saúde (OMS) até os 6 meses de vida, devendo ser mantida complementarmente até os 2 anos ou mais.',
      'Nos primeiros dias após o parto, a produção de colostro é a nutrição ideal: rica em imunoglobulinas (IgA secretora), células de defesa e fatores de crescimento gut-brain.',
      'Para evitar fissuras mamilares e dor, a pega deve ser assimétrica: o bebê abocanha mais a parte inferior da aréola do que a superior. O mamilo se posiciona profundamente em direção ao palato mole.',
      'Se houver ganho de peso adequado (verificado através das medições de crescimento) e fraldas molhadas (xixi claro 5 a 8 vezes ao dia), a produção de leite está perfeita.',
    ],
    references: [
      'World Health Organization (WHO). Infant and young child feeding guidelines.',
      'Sociedade Brasileira de Pediatria (SBP). Manual Prático de Aleitamento Materno (2023).',
      'American Academy of Pediatrics (AAP). Policy Statement: Breastfeeding and the Use of Human Milk (2022).',
    ],
  },
  {
    id: 'higiene-sono-seguro-prevencao-sids',
    category: 'sleep',
    title: 'Higiene do Sono e Prevenção da Síndrome da Morte Súbita (SIDS)',
    subtitle: 'Recomendações internacionais de segurança no berço',
    summary: 'Aprenda os pilares do ambiente de sono seguro (Back to Sleep) e como o ruído branco e a penumbra auxiliam na consolidação dos ciclos de sono.',
    evidenceLevel: 'Recomendação AAP & Pediatria Baseada em Evidências',
    readingTimeMin: 7,
    icon: '🌙',
    takeaways: [
      'A posição de barriga para cima (decúbito dorsal) é a única posição segura comprovada para o sono dos bebês.',
      'Superfície do colchão deve ser firme, sem travesseiros, protetores de berço de pano macio ou bichos de pelúcia.',
      'Evite o superaquecimento (overheating): o peito e o pescoço do bebê devem estar mornos, nunca suados.',
    ],
    content: [
      'A Síndrome da Morte Súbita do Lactente (SIDS) teve sua incidência reduzida em mais de 50% globalmente após as campanhas "Back to Sleep" (Dormir de Barriga Para Cima).',
      'O berço deve ser limpo e minimalista: apenas colchão firme ajustado ao estrado e lençol de elástico bem esticado. Sacos de dormir infantis adequados ao clima são preferíveis a cobertores soltos.',
      'O sono do recém-nascido é dividido em ciclos curtos (45 a 60 minutos) com alta proporção de sono REM (ativo), essencial para a neuroplasticidade e consolidação da memória.',
      'O uso de ruído branco contínuo em volume moderado (<60 dB a pelo menos 1,5m do berço) mimetiza o ambiente intrauterino e previne despertares causados por ruídos abruptos da casa.',
    ],
    references: [
      'American Academy of Pediatrics (AAP). Sleep-Related Infant Deaths: Updated 2022 Recommendations for Reducing Infant Deaths in the Sleep Environment.',
      'Lancet Child & Adolescent Health. Evidence-based infant sleep hygiene strategies (2021).',
    ],
  },
  {
    id: 'manejo-febre-primeiros-socorros',
    category: 'health',
    title: 'Febre em Bebês: Quando Razoar e Quando Buscar Emergência',
    subtitle: 'Fisiopatologia da resposta febril e sinais de alerta',
    summary: 'Saiba interpretar a temperatura corporal em bebês, desmistifique o medo da febre e aprenda a reconhecer os sinais vermelhos de urgência.',
    evidenceLevel: 'Consenso de Infectologia & Emergência Pediátrica',
    readingTimeMin: 8,
    icon: '🌡️',
    takeaways: [
      'A febre (temperatura axilar igual ou superior a 37,8°C) é um mecanismo natural de defesa do sistema imune contra patógenos.',
      'Em bebês menores de 3 meses, QUALQUER febre (≥37,8°C) exige avaliação médica imediata no pronto-socorro.',
      'Em bebês maiores de 3 meses, mais importante que a temperatura exata é o estado geral: se está ativo, mamando e interagindo quando a febre baixa.',
    ],
    content: [
      'A febre acelera a produção de linfócitos T e desacelera a replicação de diversos vírus e bactérias. O objetivo do antitérmico (prescrito pelo pediatra) é trazer conforto, e não zerar a temperatura a todo custo.',
      'Como aferir corretamente: O termômetro digital na axila é a técnica recomendada pela SBP. Aferição por toque de pele ou testa pode ser imprecisa.',
      'Sinais de Alerta (Buscar Emergência Imediatamente):',
      '• Bebê menor de 90 dias com febre.',
      '• Prostração extrema ou sonolência da qual o bebê não desperta.',
      '• Dificuldade para respirar (costelas afundando, chiado, batedeira ou lábios roxos/azulados).',
      '• Manchas avermelhadas ou arroxadas na pele que não somem ao pressionar com um copo transparente.',
      '• Recusa total de líquidos e sinais de desidratação (ausência de lágrimas, boca seca, mais de 6h sem fralda de xixi).',
    ],
    references: [
      'Sociedade Brasileira de Pediatria (SBP). Diretriz sobre Manejo da Febre em Puericultura (2023).',
      'NICE Guidelines. Fever in under 5s: assessment and initial management (2021 update).',
    ],
  },
  {
    id: 'introducao-alimentar-blw-tradicional',
    category: 'breastfeeding',
    title: 'Introdução Alimentar Aos 6 Meses: BLW vs. Papinhas',
    subtitle: 'Sinais de prontidão e prevenção de engasgos',
    summary: 'Descubra como iniciar a alimentação complementar de forma segura, respeitando o desenvolvimento motor do bebê e prevenindo seletividade alimentar.',
    evidenceLevel: 'Consenso SBP & Guia Alimentar para Crianças Brasileiras',
    readingTimeMin: 9,
    icon: '🥑',
    takeaways: [
      'A introdução alimentar deve iniciar estritamente aos 6 meses de vida, após a presença de todos os sinais de prontidão.',
      'Sinais de Prontidão: sentar sem apoio (ou com apoio mínimo), sustentação firme do pescoço, perda do reflexo de protrusão da língua e interesse pelos alimentos.',
      'Tanto o método BLW (Baby-Led Weaning) quanto a introdução participativa amassada com garfo são seguros e nutritivos.',
    ],
    content: [
      'Aos 6 meses, as reservas de ferro acumuladas durante a gestação começam a diminuir, tornando a alimentação complementar indispensável ao lado do leite materno ou fórmula.',
      'Diferença entre Engasgo e Reflexo de GAG (Nausea):',
      '• Reflexo de Gag: É um mecanismo de proteção. O bebê gagueja, fica vermelho, projeta a língua para frente e empurra o alimento. Os pais devem manter a calma e não intervir abruptamente.',
      '• Engasgo Verdadeiro: Obstrução das vias aéreas. O bebê fica silencioso, não consegue tossir ou chorar e os lábios começam a ficar arroxeadoss. Exige a Manobra de Desobstrução (Manobra de Heimlich adaptada para lactentes).',
      'Nunca liquide no liquidificador ou passe na peneira: a comida deve ser amassada no garfo para que a criança desenvolva a musculatura da mastigação e sinta a textura dos alimentos.',
      'Sem adição de sal ou açúcar até os 2 anos de idade, priorizando temperos naturais como alho, cebola, salsinha, orégano e azeite de oliva extra virgem.',
    ],
    references: [
      'Ministério da Saúde do Brasil. Guia Alimentar para a População Brasileira Menor de 2 Anos (2019).',
      'Pediatrics Journal. Safety and Efficacy of Baby-Led Weaning: A Systematic Review (2022).',
    ],
  },
  {
    id: 'desenvolvimento-linguagem-estimulacao',
    category: 'development',
    title: 'Desenvolvimento Cognitivo, Linguagem e Telas',
    subtitle: 'O impacto da interação humana no cérebro do bebê',
    summary: 'Compreenda a janela crítica de desenvolvimento da linguagem nos primeiros 1.000 dias e por que especialistas vetam o uso de telas antes dos 2 anos.',
    evidenceLevel: 'Neurociência do Desenvolvimento & Diretrizes SBP/AAP',
    readingTimeMin: 7,
    icon: '🧠',
    takeaways: [
      'Nos primeiros anos de vida, são formadas mais de 1 milhão de novas conexões neurais por segundo no cérebro do bebê.',
      'A interação bidirecional "servir e devolver" (serve and return) — conversar, cantar, imitar os sons do bebê — é o motor principal da linguagem.',
      'Telas antes dos 2 anos são associadas a atraso de fala, déficit de atenção e alterações na regulação emocional.',
    ],
    content: [
      'A neuroplasticidade infantil está no seu auge nos primeiros 1.000 dias de vida (da gestação aos 2 anos). O cérebro aprende através da exploração sensorial do mundo real (tocar, colocar na boca, ouvir vozes humanas).',
      'Por que telas prejudicam o desenvolvimento antes dos 2 anos?',
      'As telas oferecem estimulação super-normal de luzes e cores sem a resposta social e interativa necessária. Telas substituem a exploração motora e a conversa com os cuidadores.',
      'Como estimular a linguagem diariamente:',
      '• Narre as tarefas cotidianas ("Agora a mamãe/papai vai colocar a meia azul no seu pezinho!").',
      '• Faça leitura compartilhada mostrando figuras e apontando para os objetos desde o nascimento.',
      '• Responda aos balbucios como se fossem uma conversa real, fazendo pausas e olhando nos olhos do bebê.',
    ],
    references: [
      'Harvard Center on the Developing Child. Key Concepts: Serve and Return.',
      'Sociedade Brasileira de Pediatria. Menos Tela, Mais Saúde: Guia Prático de Orientação sobre Saúde na Era Digital (2023).',
    ],
  },
  {
    id: 'manobra-desobstrucao-heimlich-bebe',
    category: 'health',
    title: 'Guia Prático de Primeiros Socorros: Engasgo em Bebês',
    subtitle: 'Passo a passo da Manobra de Desobstrução em menores de 1 ano',
    summary: 'Aprenda o protocolo internacional de emergência em caso de obstrução das vias aéreas por corpo estranho (OVACE).',
    evidenceLevel: 'Protocolo Internacional da AHA (American Heart Association)',
    readingTimeMin: 5,
    icon: '🚨',
    takeaways: [
      'Mantenha a calma e identifique se o engasgo é total (ausência de som, choro ou tosse).',
      'Alterne 5 golpes nas costas (com o bebê inclinado para baixo) e 5 compressões torácicas.',
      'Peça a alguém para ligar imediatamente para o SAMU (192) ou Bombeiros (193).',
    ],
    content: [
      'Passo a Passo da Manobra para Bebês (< 1 ano):',
      '1. Posicione o bebê de bruços sobre o seu antebraço, com a cabeça mais baixa do que o tronco, apoiando a mandíbula com os dedos em V (sem apertar o pescoço).',
      '2. Apoie o antebraço na sua coxa para ter estabilidade.',
      '3. Aplique 5 golpes firmes no meio das costas do bebê (entre as escápulas) usando o calcanhar da sua mão livre.',
      '4. Vire o bebê de costas sobre o outro antebraço (mantendo a cabeça mais baixa que o corpo).',
      '5. Aplique 5 compressões torácicas no centro do peito (logo abaixo da linha dos mamilos) com 2 dedos (indicador e médio).',
      '6. Repita a sequência (5 tapas nas costas / 5 compressões no peito) até o bebê expelir o objeto ou chorar.',
      '7. Se o bebê perder a consciência, inicie a ressuscitação cardiopulmonar (RCP) e ligue imediatamente para o 192 (SAMU).',
    ],
    references: [
      'American Heart Association (AHA). Pediatric First Aid and CPR Guidelines.',
      'Cruz Vermelha Brasileira. Manual de Primeiros Socorros Infantil.',
    ],
  },
];

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filteredArticles = ARTICLES_DATABASE.filter((art) => {
    const matchesCategory = selectedCategory === 'ALL' || art.category === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.takeaways.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Banner */}
      <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs dark:shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/20">
              Base de Dados Baseada em Evidências
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2 flex items-center gap-2">
              <BookOpen size={26} className="text-rose-500 dark:text-indigo-400" />
              Acervo de Conhecimento Pediátrico
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-2xl">
              Conteúdo científico rigoroso, revisado com base nas diretrizes da OMS, Sociedade Brasileira de Pediatria (SBP) e American Academy of Pediatrics (AAP).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Fontes Validadas pela Ciência
            </span>
          </div>
        </div>

        {/* Search Bar & Categories */}
        <div className="pt-2 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar febre, amamentação, engasgo, sono, BLW..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-400 dark:focus:border-indigo-500 font-medium transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'Todos os Artigos', icon: '📚' },
              { id: 'breastfeeding', label: 'Amamentação', icon: '🍼' },
              { id: 'sleep', label: 'Sono Seguro', icon: '🌙' },
              { id: 'health', label: 'Saúde & Emergência', icon: '🩺' },
              { id: 'development', label: 'Desenvolvimento', icon: '🧠' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-rose-500 dark:bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-slate-800 text-slate-400 text-xs font-medium space-y-2">
            <AlertCircle size={28} className="mx-auto text-slate-400" />
            <p>Nenhum artigo encontrado para o termo pesquisado.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="text-xs font-bold text-rose-500 dark:text-indigo-400 hover:underline"
            >
              Limpar filtros de busca
            </button>
          </div>
        ) : (
          filteredArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 hover:border-rose-300 dark:hover:border-indigo-500 rounded-3xl p-5 space-y-3.5 shadow-xs dark:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{art.icon}</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                    {art.evidenceLevel}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-rose-500 dark:group-hover:text-indigo-400 transition-colors">
                  {art.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {art.subtitle}
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 font-medium">
                  {art.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-rose-50 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">
                  ⏱️ {art.readingTimeMin} min de leitura
                </span>

                <span className="text-xs font-bold text-rose-500 dark:text-indigo-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Ler Artigo <ChevronRight size={14} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-rose-100 dark:border-slate-800 pb-4">
              <div className="space-y-1 pr-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                  {selectedArticle.evidenceLevel}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 pt-1">
                  {selectedArticle.icon} {selectedArticle.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {selectedArticle.subtitle} • ⏱️ {selectedArticle.readingTimeMin} min de leitura
                </p>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Key Takeaways Box */}
            <div className="bg-rose-50/70 dark:bg-indigo-950/40 border border-rose-200/70 dark:border-indigo-800/50 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles size={14} /> Pontos-Chave ("Takeaways"):
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                {selectedArticle.takeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-500 dark:text-indigo-400 font-bold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Main Article Content */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {selectedArticle.content.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {/* Scientific References */}
            <div className="pt-4 border-t border-rose-100 dark:border-slate-800 space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                📚 Referências Científicas & Diretrizes Oficiais:
              </h4>
              <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {selectedArticle.references.map((ref, idx) => (
                  <li key={idx}>[{idx + 1}] {ref}</li>
                ))}
              </ul>
            </div>

            {/* Modal Footer */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-rose-400 to-pink-500 dark:from-indigo-600 dark:to-violet-600 rounded-2xl shadow-md hover:opacity-95 transition"
              >
                Fechar Artigo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
