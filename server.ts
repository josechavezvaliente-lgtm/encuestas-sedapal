import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { SAMPLE_SURVEY_RESPONSES, GCFO0131_QUESTIONS } from './src/data/initialQuestions';

// Central server-side store for all submitted surveys across all clients/users
let surveysStore = [...SAMPLE_SURVEY_RESPONSES];

// Central server-side store for customized questions per format
let questionsStore = {
  GCFO0131: [...GCFO0131_QUESTIONS]
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Central Survey API Endpoints
  app.get('/api/surveys', (req, res) => {
    res.json(surveysStore);
  });

  app.post('/api/surveys', (req, res) => {
    const newSurvey = req.body;
    if (!newSurvey || !newSurvey.id) {
      return res.status(400).json({ error: 'Encuesta no válida' });
    }

    const index = surveysStore.findIndex(s => s.id === newSurvey.id);
    if (index >= 0) {
      surveysStore[index] = newSurvey;
    } else {
      surveysStore = [newSurvey, ...surveysStore];
    }

    res.json(surveysStore);
  });

  app.delete('/api/surveys/:id', (req, res) => {
    const { id } = req.params;
    surveysStore = surveysStore.filter(s => s.id !== id);
    res.json(surveysStore);
  });

  app.post('/api/surveys/reset', (req, res) => {
    surveysStore = [...SAMPLE_SURVEY_RESPONSES];
    res.json(surveysStore);
  });

  // Questions API Endpoints
  app.get('/api/questions', (req, res) => {
    res.json(questionsStore);
  });

  app.post('/api/questions', (req, res) => {
    const { format, questions } = req.body;
    if (format && format === 'GCFO0131' && Array.isArray(questions)) {
      questionsStore['GCFO0131'] = questions;
    }
    res.json(questionsStore);
  });

  app.post('/api/questions/reset', (req, res) => {
    questionsStore = {
      GCFO0131: [...GCFO0131_QUESTIONS]
    };
    res.json(questionsStore);
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
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `
Eres un Auditor Senior de Calidad y Experiencia del Cliente para el Organismo de Inspección de SEDAPAL.
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
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
          } catch (mErr) {
            console.warn('gemini-2.5-flash failed, attempting fallback to gemini-2.0-flash:', mErr);
            response = await ai.models.generateContent({
              model: 'gemini-2.0-flash',
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

      // Return structured local diagnostic if key is absent or Gemini call failed
      return res.json({ summary: generateLocalDiagnostic() });
    } catch (error: any) {
      console.error('Error generating AI analysis:', error);
      return res.json({ summary: generateLocalDiagnostic() });
    }
  });

  // Vite middleware in development or static serve in production
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
