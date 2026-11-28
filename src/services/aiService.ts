import { CefrLevel, QuizPack, QuizQuestion, RoleplayScenario, SpeechEvaluationResult } from '../types';
import { OfflineRoleplayGenerator } from '../data/curatedContent';
import { isArabicText } from '../utils/constants';

export function buildOfflineQuizDraft({
  prompt,
  cefrLevel = CefrLevel.B1,
  questionCount = 5,
}: {
  prompt: string;
  cefrLevel?: CefrLevel | string;
  questionCount?: number;
}): QuizPack {
  const cleanPrompt = (prompt || '').trim() || 'Everyday English & Smart Clues';
  const count = Math.min(Math.max(Number(questionCount) || 5, 3), 12);
  const arabic = isArabicText(cleanPrompt);

  if (arabic) {
    const bank: QuizQuestion[] = [
      {
        prompt: `في لغز حول "${cleanPrompt}"، ما العنصر الأهم للتأكد من صحة الرواية؟`,
        options: ['مقارنة التوقيت والأدلة المادية', 'الاعتماد على الشائعات فقط', 'تجاهل الشهود', 'تخمين الإجابة عشوائياً'],
        correctIndex: 0,
        timeLimitSec: 20,
        tip: 'التحقق من الأدلة والتسلسل الزمني يكشف التناقضات فوراً.',
      },
      {
        prompt: `أي عبارة تصف العمل الجماعي الذكي عند دراسة موضوع "${cleanPrompt}"؟`,
        options: ['تقسيم الأدوار وتبادل الملاحظات', 'العمل دون خطة واضحة', 'إهمال التفاصيل', 'الاستعجال قبل الفهم'],
        correctIndex: 0,
        timeLimitSec: 20,
        tip: 'المشاركة المنظمة تسرّع الوصول للحل الصحيح.',
      },
      {
        prompt: `عند اكتشاف معلومة جديدة في "${cleanPrompt}"، ماذا تفعل أولاً؟`,
        options: ['التحقق من مصدرها ومطابقتها مع المعطيات', 'نسيانها مباشرة', 'رفضها دون فحص', 'تجاهل السياق'],
        correctIndex: 0,
        timeLimitSec: 20,
        tip: 'التثبت من السياق والمصدر أساس التفكير العلمي والتحقيقي.',
      },
      {
        prompt: 'أي من التالي يُعد مثالاً على ملاحظة دقيقة؟',
        options: ['تحديد وقت وتفاصيل الواقعة بوضوح', 'قول "ربما حدث شيء ما" فقط', 'تغيير القصة كل دقيقة', 'ترك الأسئلة بلا إجابة'],
        correctIndex: 0,
        timeLimitSec: 20,
        tip: 'التفاصيل الدقيقة تصنع الفرق في المسابقات والحوار.',
      },
      {
        prompt: 'كيف تختم جولة نقاش ممتعة مع فريقك؟',
        options: ['تلخيص أهم فكرتين تعلمناهما اليوم', 'إغلاق الجلسة بصمت تام', 'تكرار سؤال واحد بلا نهاية', 'إضاعة الوقت'],
        correctIndex: 0,
        timeLimitSec: 20,
        tip: 'الملخص السريع يثبّت المفاهيم الجديدة في الذاكرة.',
      },
    ];
    return {
      id: `draft_${Date.now()}`,
      title: cleanPrompt.slice(0, 56),
      topic: cleanPrompt.slice(0, 36),
      cefrLevel,
      language: 'AR',
      questions: bank.slice(0, count),
      source: 'OFFLINE',
      createdAtMs: Date.now(),
    };
  }

  const templates: QuizQuestion[] = [
    {
      prompt: `Imagine you are talking with friends about "${cleanPrompt}". Which opener sounds most natural at ${cefrLevel}?`,
      options: [
        'By the way, what is your take on this?',
        'Yesterday table window green.',
        'Speak immediately without listening.',
        'No one likes talking about anything.',
      ],
      correctIndex: 0,
      timeLimitSec: 20,
      tip: '"What is your take on..." invites friends naturally into conversation.',
    },
    {
      prompt: `In a lively scene about ${cleanPrompt}, what does "on the same page" mean?`,
      options: [
        'Agreeing on the main plan together',
        'Reading silently in a library',
        'Forgetting everyone’s name',
        'Leaving the room early',
      ],
      correctIndex: 0,
      timeLimitSec: 20,
      tip: 'Use "Let’s get on the same page" before teamwork or travel plans.',
    },
    {
      prompt: `Your teammate makes a sharp point during ${cleanPrompt}. How can you praise them naturally?`,
      options: [
        'You hit the nail on the head!',
        'You broke the table!',
        'Put off your umbrella!',
        'Once in a green chair!',
      ],
      correctIndex: 0,
      timeLimitSec: 18,
      tip: '"Hit the nail on the head" means getting something 100% right.',
    },
    {
      prompt: `Which phrasal verb best fits: "Let's ____ the details of ${cleanPrompt} step by step"?`,
      options: ['figure out', 'run away', 'spill over', 'turn off'],
      correctIndex: 0,
      timeLimitSec: 20,
      tip: '"Figure out" means solve or understand clearly.',
    },
    {
      prompt: `If plans for ${cleanPrompt} change unexpectedly, which phrase helps you adapt smoothly?`,
      options: [
        'Let’s play it by ear and stay flexible.',
        'We must freeze the calendar forever.',
        'I lost my shoes yesterday.',
        'Never speak again.',
      ],
      correctIndex: 0,
      timeLimitSec: 20,
      tip: '"Play it by ear" means improvising calmly as things unfold.',
    },
    {
      prompt: `To politely add a contrasting idea while discussing ${cleanPrompt}, say:`,
      options: [
        'On the other hand, we could try a different angle.',
        'Your idea is completely broken.',
        'Actually, stop speaking now.',
        'Because coffee yesterday.',
      ],
      correctIndex: 0,
      timeLimitSec: 20,
      tip: '"On the other hand" keeps group discussions friendly and fluent.',
    },
  ];

  const questions: QuizQuestion[] = [];
  for (let i = 0; i < count; i++) {
    questions.push(templates[i % templates.length]);
  }

  return {
    id: `draft_${Date.now()}`,
    title: cleanPrompt.slice(0, 56),
    topic: cleanPrompt.slice(0, 36),
    cefrLevel,
    language: 'EN',
    customPrompt: cleanPrompt,
    questions,
    source: 'OFFLINE',
    createdAtMs: Date.now(),
  };
}

export function evaluateSpeechDeterministically(expected: string, spoken: string): SpeechEvaluationResult {
  const norm = (s: string) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

  const targetTokens = norm(expected);
  const spokenTokens = norm(spoken);
  if (!spokenTokens.length) {
    return {
      score: 0,
      summary: 'No spoken words detected yet.',
      clarityFeedback: 'Speak aloud near your microphone or type your sentence above.',
      naturalnessFeedback: 'Aim for steady pacing and clear pauses between phrases.',
      practiceTip: 'Listen once with the speaker button, then shadow the sentence out loud.',
    };
  }

  const spokenSet = new Set(spokenTokens);
  const matched = targetTokens.filter((t) => spokenSet.has(t)).length;
  const accuracyPct = targetTokens.length
    ? Math.min(100, Math.round((matched / targetTokens.length) * 100))
    : 75;

  return {
    score: accuracyPct,
    summary:
      accuracyPct >= 85
        ? 'Crisp delivery! Nearly every key word landed accurately.'
        : accuracyPct >= 60
        ? 'Good flow! A few target words can be pronounced more clearly.'
        : 'Nice start! Try slowing down slightly on each stressed word.',
    clarityFeedback: `${matched} of ${targetTokens.length} target words matched (${accuracyPct}%).`,
    naturalnessFeedback:
      accuracyPct >= 80
        ? 'Smooth conversational rhythm.'
        : 'Practice linking phrases smoothly without rushing.',
    practiceTip:
      accuracyPct >= 85
        ? 'Try delivering the same line again with expressive tone or a plot twist!'
        : `Shadow-read "${expected}" slowly once, then try at normal speed.`,
  };
}

export const aiService = {
  async generateQuiz({
    prompt,
    cefrLevel = CefrLevel.B1,
    questionCount = 5,
  }: {
    prompt: string;
    cefrLevel?: CefrLevel | string;
    questionCount?: number;
  }): Promise<QuizPack> {
    const cleanPrompt = (prompt || '').trim();
    if (!cleanPrompt) throw new Error('Enter a quiz topic or prompt first.');

    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: cleanPrompt, cefrLevel, questionCount }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.questions) && data.questions.length > 0) {
          return {
            id: `ai_quiz_${Date.now()}`,
            title: String(data.title || cleanPrompt).slice(0, 70),
            topic: String(data.topic || cleanPrompt).slice(0, 40),
            cefrLevel: data.cefrLevel || cefrLevel,
            language: data.language === 'AR' || isArabicText(cleanPrompt) ? 'AR' : 'EN',
            customPrompt: cleanPrompt,
            questions: data.questions.slice(0, 20),
            source: 'AI',
            createdAtMs: Date.now(),
          };
        }
      }
    } catch {
      // Fallback smoothly to offline generator
    }

    return buildOfflineQuizDraft({ prompt: cleanPrompt, cefrLevel, questionCount });
  },

  async generateRoleplay({
    topic,
    cefrLevel = CefrLevel.B1,
    tone = 'Friendly',
  }: {
    topic: string;
    cefrLevel?: CefrLevel | string;
    tone?: string;
  }): Promise<RoleplayScenario> {
    const cleanTopic = (topic || '').trim() || 'Café & Bakery Order';
    try {
      const res = await fetch('/api/ai/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: cleanTopic, cefrLevel, tone }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.lines) && data.lines.length > 0) {
          return {
            id: `ai_rp_${Date.now()}`,
            title: String(data.title || cleanTopic).slice(0, 80),
            setting: String(data.setting || `${cleanTopic} (${tone})`),
            cefrLevel: data.cefrLevel || cefrLevel,
            roleAName: String(data.roleAName || 'Speaker A'),
            roleBName: String(data.roleBName || 'Speaker B'),
            goal: String(data.goal || 'Practice natural turn-taking and idioms.'),
            source: 'AI',
            lines: data.lines,
            plotTwists: Array.isArray(data.plotTwists) ? data.plotTwists : [],
            createdAtMs: Date.now(),
          };
        }
      }
    } catch {
      // Fallback smoothly to offline generator
    }
    return OfflineRoleplayGenerator.generate(cleanTopic, cefrLevel, tone);
  },

  async evaluateSpeech({
    expected,
    spoken,
    cefrLevel = CefrLevel.B1,
  }: {
    expected: string;
    spoken: string;
    cefrLevel?: CefrLevel | string;
  }): Promise<SpeechEvaluationResult> {
    try {
      const res = await fetch('/api/ai/evaluate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expected, spoken, cefrLevel }),
      });
      if (res.ok) {
        const data = await res.json();
        const accuracy = Number(data?.accuracyPct);
        if (Number.isFinite(accuracy)) {
          return {
            score: Math.min(100, Math.max(0, Math.round(accuracy))),
            summary: String(data.feedback || 'Nice spoken attempt!'),
            clarityFeedback: `Matched ${Math.round(accuracy)}% of target words cleanly.`,
            naturalnessFeedback: accuracy >= 80 ? 'Natural pacing and clear stress.' : 'Keep steady pacing between phrases.',
            practiceTip: String(data.tip || 'Replay the prompt and shadow the rhythm once more.'),
          };
        }
      }
    } catch {
      // Fallback to deterministic local evaluation
    }
    return evaluateSpeechDeterministically(expected, spoken);
  },
};
