import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.APP_PORT || (process.env.PORT === '8080' ? 3000 : process.env.PORT) || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';
const MODEL_NAME = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
}

function clampQuestionCount(n: unknown): number {
  const val = Number(n);
  if (!Number.isFinite(val)) return 10;
  return Math.max(3, Math.min(60, Math.round(val)));
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, aiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()) });
  });

  app.post('/api/ai/quiz', async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({ error: 'Server AI key not configured' });
      return;
    }

    const { topic, cefrLevel = 'B1', questionCount = 10, language = 'EN', customPrompt = '' } = req.body || {};
    const count = clampQuestionCount(questionCount);
    const isArabic = language === 'AR';

    try {
      const batchSize = 20;
      const batches = Math.ceil(count / batchSize);
      const allQuestions: any[] = [];
      let detectedTitle = `${topic || (isArabic ? 'اختبار تفاعلي' : 'LingoClub Quiz')} (${cefrLevel})`;

      for (let b = 0; b < batches; b++) {
        const needed = Math.min(batchSize, count - allQuestions.length);
        const promptText = isArabic
          ? [
              `أنشئ اختباراً تفاعلياً ممتعاً باللغة العربية الفصحى المبسطة من ${needed} سؤال متعدد الخيارات.`,
              `المجال: ${topic || 'ألغاز الجرائم والعلوم والفضاء'}`,
              customPrompt ? `تعليمات إضافية: ${customPrompt}` : '',
              `تجنب أسئلة الإعراب والنحو المعقد تماماً. ركّز على المعلومات المشوقة والمنطق والاكتشافات.`,
              `لكل سؤال: prompt واضح، 4 خيارات (options)، فهرس الإجابة الصحيحة (correctIndex من 0 إلى 3)، وقت (timeLimitSec = 20)، وتلميح قصير (tip).`
            ]
              .filter(Boolean)
              .join('\n')
          : [
              `Create an engaging CEFR ${cefrLevel} English learning quiz with exactly ${needed} multiple-choice questions.`,
              `Topic: ${topic || 'Everyday English & Idioms'}`,
              customPrompt ? `Extra instructions: ${customPrompt}` : '',
              `Each question must have a clear prompt, 4 distinct options, correctIndex (0-3), timeLimitSec (15-25), and a friendly teaching tip.`
            ]
              .filter(Boolean)
              .join('\n');

        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: promptText,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      prompt: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctIndex: { type: Type.INTEGER },
                      timeLimitSec: { type: Type.INTEGER },
                      tip: { type: Type.STRING }
                    },
                    required: ['prompt', 'options', 'correctIndex']
                  }
                }
              },
              required: ['questions']
            }
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        if (b === 0 && parsed.title) {
          detectedTitle = String(parsed.title).slice(0, 80);
        }
        if (Array.isArray(parsed.questions)) {
          for (const q of parsed.questions) {
            if (q?.prompt && Array.isArray(q?.options) && q.options.length >= 2) {
              const opts = q.options.slice(0, 4).map(String);
              while (opts.length < 4) opts.push(`Option ${opts.length + 1}`);
              const correctIndex = Math.max(0, Math.min(3, Number(q.correctIndex || 0)));
              allQuestions.push({
                prompt: String(q.prompt),
                options: opts,
                correctIndex,
                timeLimitSec: Number(q.timeLimitSec || 20),
                tip: String(q.tip || '')
              });
            }
          }
        }
      }

      if (allQuestions.length === 0) {
        res.status(502).json({ error: 'AI returned no valid questions' });
        return;
      }

      res.json({
        title: detectedTitle,
        topic: String(topic || (isArabic ? 'ثقافة وعلوم' : 'English')),
        cefrLevel,
        language: isArabic ? 'AR' : 'EN',
        customPrompt: String(customPrompt || ''),
        questions: allQuestions.slice(0, count),
        source: 'AI'
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'AI quiz generation failed' });
    }
  });

  app.post('/api/ai/roleplay', async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({ error: 'Server AI key not configured' });
      return;
    }

    const { topic = 'Café & Bakery Order', cefrLevel = 'B1', tone = 'Friendly' } = req.body || {};
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Generate a realistic two-speaker English roleplay script for CEFR ${cefrLevel} learners. Topic: "${topic}". Tone: ${tone}. Include 6 alternating dialogue lines (speakerRole A or B, text, keyHint), 1-2 helpful vocabulary highlights per line when useful, and 2 fun plot twists.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              setting: { type: Type.STRING },
              roleAName: { type: Type.STRING },
              roleBName: { type: Type.STRING },
              goal: { type: Type.STRING },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speakerRole: { type: Type.STRING },
                    text: { type: Type.STRING },
                    keyHint: { type: Type.STRING },
                    highlights: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          phrase: { type: Type.STRING },
                          meaning: { type: Type.STRING },
                          example: { type: Type.STRING }
                        }
                      }
                    }
                  },
                  required: ['speakerRole', 'text']
                }
              },
              plotTwists: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['title', 'setting', 'roleAName', 'roleBName', 'goal', 'lines']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        id: `ai_rp_${Date.now().toString(36)}`,
        cefrLevel,
        source: 'AI',
        ...parsed
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'AI roleplay generation failed' });
    }
  });

  app.post('/api/ai/evaluate-speech', async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({ error: 'Server AI key not configured' });
      return;
    }

    const body = req.body || {};
    const targetLine = String(body.expected ?? body.targetLine ?? '');
    const spokenText = String(body.spoken ?? body.spokenText ?? '');
    const cefrLevel = String(body.cefrLevel ?? 'B1');
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Evaluate a CEFR ${cefrLevel} English learner speaking practice.\nTarget sentence: "${targetLine}"\nLearner said: "${spokenText}"\nReturn accuracyPct (0-100), short encouraging feedback, and one pronunciation or fluency tip.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              accuracyPct: { type: Type.INTEGER },
              feedback: { type: Type.STRING },
              tip: { type: Type.STRING }
            },
            required: ['accuracyPct', 'feedback', 'tip']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'AI speech evaluation failed' });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LingoClub] Server listening on http://0.0.0.0:${PORT} (${IS_PROD ? 'production' : 'development'})`);
  });
}

startServer();
