import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { SAMPLE_SURVEY_RESPONSES, GCFO0131_QUESTIONS } from './src/data/initialQuestions';

// --- Supabase client (server-side only, usa la service_role key) ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados en .env. La app funcionará solo con datos en memoria (no persistentes).');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// --- Fallback en memoria (por si Supabase no está configurado) ---
let memorySurveys = [...SAMPLE_SURVEY_RESPONSES];
let memoryQuestions: Record<string, any> = { GCFO0131: [...GCFO0131_QUESTIONS] };

// =========================================================
// Mapeo: SurveyResponse (app) <-> filas de Supabase
// =========================================================

function surveyToRow(s: any) {
  return {
    id: s.id,
    formato_tipo: s.formatType,
    created_at: s.createdAt,
    razon_social: s.clientName,
    empresa: s.companyName ?? null,
    ruc: s.ruc ?? null,
    numero_expediente: s.serviceOrderOrExpedient,
    nombre_inspector: s.inspectorName ?? null,
    canal_atencion: s.serviceChannel,
    tipo_servicio: s.serviceProvidedType ?? null,
    motivo_contacto: s.contactReason ?? null,
    conformidad_general: s.isGeneralSatisfied ?? null,
    puntaje_promedio: s.averageScore,
    cantidad_observaciones_bajas: s.lowScoreCount,
    comentarios_generales: s.generalComments ?? null,
  };
}

function answersToRows(surveyId: string, answers: any[]) {
  return answers.map((a: any) => ({
    encuesta_id: surveyId,
    pregunta_id: a.questionId,
    numero_pregunta: a.questionNumber,
    seccion_id: a.sectionId,
    calificacion: a.score,
    motivo: a.motive ?? null,
  }));
}

function rowToSurvey(row: any, answerRows: any[]): any {
  return {
    id: row.id,
    formatType: row.formato_tipo,
    createdAt: row.created_at,
    clientName: row.razon_social,
    companyName: row.empresa ?? undefined,
    ruc: row.ruc ?? undefined,
    serviceOrderOrExpedient: row.numero_expediente,
    inspectorName: row.nombre_inspector ?? undefined,
    serviceChannel: row.canal_atencion,
    serviceProvidedType: row.tipo_servicio ?? undefined,
    contactReason: row.motivo_contacto ?? undefined,
    isGeneralSatisfied: row.conformidad_general ?? undefined,
    generalComments: row.comentarios_generales ?? undefined,
    averageScore: Number(row.puntaje_promedio),
    lowScoreCount: row.cantidad_observaciones_bajas,
    answers: answerRows
      .filter((a: any) => a.encuesta_id === row.id)
      .map((a: any) => ({
        questionId: a.pregunta_id,
        questionNumber: a.numero_pregunta,
        sectionId: a.seccion_id,
        score: a.calificacion,
        motive: a.motivo ?? undefined,
      })),
  };
}

// =========================================================
// Acceso a datos: encuestas
// =========================================================

async function seedIfEmpty() {
  if (!supabase) return;

  const { count, error } = await supabase
    .from('encuestas')
    .select('*', { count: 'exact', head: true });

  if (!error && count === 0) {
    for (const s of SAMPLE_SURVEY_RESPONSES as any[]) {
      await upsertSurvey(s);
    }
    console.log(`Seed inicial: ${SAMPLE_SURVEY_RESPONSES.length} encuestas de ejemplo insertadas en Supabase.`);
  }

  const { count: qCount, error: qErr } = await supabase
    .from('preguntas_formato')
    .select('*', { count: 'exact', head: true });

  if (!qErr && qCount === 0) {
    await supabase.from('preguntas_formato').insert({ formato: 'GCFO0131', data: GCFO0131_QUESTIONS });
    console.log('Seed inicial: preguntas GCFO0131 insertadas en Supabase.');
  }
}

async function getAllSurveys(): Promise<any[]> {
  if (!supabase) return [...memorySurveys];

  const { data: encuestas, error: e1 } = await supabase
    .from('encuestas')
    .select('*')
    .order('created_at', { ascending: false });

  if (e1 || !encuestas) {
    console.error('Error leyendo encuestas de Supabase:', e1);
    return [];
  }

  const { data: respuestas, error: e2 } = await supabase
    .from('respuestas_preguntas')
    .select('*');

  if (e2) {
    console.error('Error leyendo respuestas_preguntas de Supabase:', e2);
    return encuestas.map((row: any) => rowToSurvey(row, []));
  }

  return encuestas.map((row: any) => rowToSurvey(row, respuestas || []));
}

async function upsertSurvey(survey: any) {
  if (!supabase) {
    const idx = memorySurveys.findIndex((s: any) => s.id === survey.id);
    if (idx >= 0) memorySurveys[idx] = survey;
    else memorySurveys = [survey, ...memorySurveys];
    return;
  }

  const { error: e1 } = await supabase.from('encuestas').upsert(surveyToRow(survey));
  if (e1) {
    console.error('Error guardando encuesta en Supabase:', e1);
    return;
  }

  // Reemplaza las respuestas existentes de esta encuesta (borra e inserta de nuevo)
  await supabase.from('respuestas_preguntas').delete().eq('encuesta_id', survey.id);
  if (survey.answers && survey.answers.length > 0) {
    const { error: e2 } = await supabase
      .from('respuestas_preguntas')
      .insert(answersToRows(survey.id, survey.answers));
    if (e2) console.error('Error guardando respuestas en Supabase:', e2);
  }
}

async function deleteSurveyById(id: string) {
  if (!supabase) {
    memorySurveys = memorySurveys.filter((s: any) => s.id !== id);
    return;
  }
  // ON DELETE CASCADE se encarga de borrar las respuestas asociadas
  const { error } = await supabase.from('encuestas').delete().eq('id', id);
  if (error) console.error('Error borrando encuesta en Supabase:', error);
}

async function resetSurveys() {
  if (!supabase) {
    memorySurveys = [...SAMPLE_SURVEY_RESPONSES];
    return;
  }
  await supabase.from('encuestas').delete().neq('id', '');
  for (const s of SAMPLE_SURVEY_RESPONSES as any[]) {
    await upsertSurvey(s);
  }
}

// =========================================================
// Acceso a datos: preguntas por formato
// =========================================================

async function getAllQuestions(): Promise<Record<string, any>> {
  if (!supabase) return { ...memoryQuestions };

  const { data, error } = await supabase.from('preguntas_formato').select('formato, data');
  if (error || !data || data.length === 0) {
    return { GCFO0131: [...GCFO0131_QUESTIONS] };
  }
  const result: Record<string, any> = {};
  for (const row of data) result[row.formato] = row.data;
  return result;
}

async function upsertQuestions(format: string, questions: any) {
  if (!supabase) {
    memoryQuestions[format] = questions;
    return;
  }
  const { error } = await supabase
    .from('preguntas_formato')
    .upsert({ formato: format, data: questions, updated_at: new Date().toISOString() });
  if (error) console.error('Error guardando preguntas en Supabase:', error);
}

async function resetQuestions() {
  if (!supabase) {
    memoryQuestions = { GCFO0131: [...GCFO0131_QUESTIONS] };
    return;
  }
  await supabase
    .from('preguntas_formato')
    .upsert({ formato: 'GCFO0131', data: GCFO0131_QUESTIONS, updated_at: new Date().toISOString() });
}

// =========================================================
// Servidor
// =========================================================

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  await seedIfEmpty();

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), supabase: !!supabase });
  });

  app.get('/api/surveys', async (req, res) => {
    res.json(await getAllSurveys());
  });

  app.post('/api/surveys', async (req, res) => {
    const newSurvey = req.body;
    if (!newSurvey || !newSurvey.id) {
      return res.status(400).json({ error: 'Encuesta no válida' });
    }
    await upsertSurvey(newSurvey);
    res.json(await getAllSurveys());
  });

  app.delete('/api/surveys/:id', async (req, res) => {
    await deleteSurveyById(req.params.id);
    res.json(await getAllSurveys());
  });

  app.post('/api/surveys/reset', async (req, res) => {
    await resetSurveys();
    res.json(await getAllSurveys());
  });

  app.get('/api/questions', async (req, res) => {
    res.json(await getAllQuestions());
  });

  app.post('/api/questions', async (req, res) => {
    const { format, questions } = req.body;
    if (format && format === 'GCFO0131' && Array.isArray(questions)) {
      await upsertQuestions(format, questions);
    }
    res.json(await getAllQuestions());
  });

  app.post('/api/questions/reset', async (req, res) => {
    await resetQuestions();
    res.json(await getAllQuestions());
  });

  // API endpoint: AI Analysis of Survey Reports
  app.post('/api/analyze-report', async (req, res) => {
    const { formatType, formatTitle, serviceProvidedType, totalSurveys, overallAverage, csatIndex, sectionMetrics, motives } = req.body;

    const generateLocalDiagnostic = () => {
      const fallbackMotivesSummary = motives && motives.length > 0
        ? motives.map((m: any) => `• P${m.questionNumber || 'Obs'} (${m.score}/10): "${m.motive}"`).join('\n')
        : '• No se registran observaciones ni motivos de baja calificación para este periodo.';

      return `### 📊 Diagnóstico Ejecutivo de Calidad (${formatType})

- **Total Evaluaciones:** ${totalSurveys}
- **Puntaje Promedio General:** ${overallAverage} / 10
- **Índice CSAT (Notas ≥ 8):** ${csatIndex}%

#### 🔍 Hallazgos y Diagnóstico Principal:
${overallAverage >= 8.5
  ? `El servicio del formato **${formatTitle} (${formatType})** mantiene un desempeño sobresaliente. Las áreas de atención y rigor técnico muestran cumplimiento satisfactorio.`
  : `Se identifican oportunidades de atención prioritaria. Se han registrado ${motives?.length || 0} observaciones justificadas para calificaciones menores o iguales a 8.`}

#### 💬 Observaciones y Motivos Reportados (≤ 8):
${fallbackMotivesSummary}

#### 📋 Plan de Acción para Mejora Continua:
1. **Atención y Seguimiento:** Reducir tiempos de espera y optimizar el canal de comunicación (correo/WhatsApp).
2. **Claridad en Inspección:** Reforzar la explicación previa de requisitos al cliente antes de la ejecución del servicio.
3. **Monitoreo Quincenal:** Realizar revisiones periódicas a los ítems con notas inferiores a 8 para asegurar el cumplimiento del estándar SEDAPAL.`;
    };

    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });
          const prompt = `
Eres un Auditor Senior de Calidad y Experiencia del Cliente para el Organismo de Inspección del EGCM de SEDAPAL.
Analiza el siguiente reporte de encuestas de satisfacción correspondiente al ${formatTitle} (${formatType}).

DATOS DEL REPORTE:
- Total Encuestas Evaluadas: ${totalSurveys}
${serviceProvidedType && serviceProvidedType !== 'all' ? `- Tipo de Servicio Brindado: ${serviceProvidedType}\n` : ''}- Promedio General: ${overallAverage} / 10
- Índice CSAT (% calificaciones >= 8): ${csatIndex}%

RESUMEN POR SECCIÓN:
${JSON.stringify(sectionMetrics, null, 2)}

MOTIVOS DE BAJAS CALIFICACIONES (<= 8):
${motives && motives.length > 0 ? JSON.stringify(motives, null, 2) : 'Ninguno. Todos los clientes puntuaron 9 o 10.'}

INSTRUCCIONES DE RESPUESTA:
Proporciona un diagnóstico ejecutivo breve, profesional y estructurado en Markdown (máximo 250 palabras):
1. **Resumen Ejecutivo**: Evaluación general del desempeño del formato ${formatType}${serviceProvidedType && serviceProvidedType !== 'all' ? ` para el servicio de "${serviceProvidedType}"` : ''}.
2. **Puntos Críticos / Hallazgos**: Principales motivos de insatisfacción reportados en notas <= 8.
3. **Recomendaciones Operativas**: 3 acciones concretas y prioritarias para el equipo de inspección de SEDAPAL para elevar la satisfacción a >= 9.0.
Utiliza un tono corporativo, claro y orientado a la mejora continua institucional.
`;

          let response;
          try {
            response = await ai.models.generateContent({
              model: 'gemini-3.7-flash',
              contents: prompt,
            });
          } catch (mErr) {
            console.warn('gemini-3.7-flash failed, attempting fallback to gemini-3.6-flash:', mErr);
            response = await ai.models.generateContent({
              model: 'gemini-3.6-flash',
              contents: prompt,
            });
          }

          if (response && response.text) {
            return res.json({ summary: response.text });
          }
        } catch (geminiError) {
          console.warn('Gemini API call failed, falling back to structured executive report:', geminiError);
        }
      }

      return res.json({ summary: generateLocalDiagnostic() });
    } catch (error: any) {
      console.error('Error generating AI analysis:', error);
      return res.json({ summary: generateLocalDiagnostic() });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
