import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GCFO0192_QUESTIONS, GCFO0131_QUESTIONS } from './src/data/initialQuestions';

// Cargar variables del archivo .env
dotenv.config();

// Inicializar cliente de Supabase usando las variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Central server-side store for customized questions per format
let questionsStore = {
  GCFO0192: [...GCFO0192_QUESTIONS],
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

  // ==========================================
  // SUPABASE SURVEY API ENDPOINTS
  // ==========================================

  // Obtener todas las encuestas desde Supabase
  app.get('/api/surveys', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('evaluaciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar los datos de Supabase al formato que espera tu frontend
      const formattedSurveys = data.map((item: any) => ({
        id: item.id ? item.id.toString() : String(Date.now()),
        formato: item.formato,
        fecha: item.created_at,
        clientName: item.nombre_cliente,
        score: item.puntaje,
        ...(item.respuestas || {})
      }));

      res.json(formattedSurveys);
    } catch (err: any) {
      console.error('Error fetching surveys from Supabase:', err);
      res.status(500).json({ error: 'Error al obtener encuestas de la base de datos' });
    }
  });

  // Guardar o actualizar una encuesta en Supabase
  app.post('/api/surveys', async (req, res) => {
    const newSurvey = req.body;
    if (!newSurvey) {
      return res.status(400).json({ error: 'Encuesta no válida' });
    }

    try {
      const payload = {
        formato: newSurvey.format || newSurvey.formato || 'GCFO0192',
        nombre_cliente: newSurvey.clientName || newSurvey.nombre_cliente || 'Cliente Anónimo',
        puntaje: newSurvey.overallAverage || newSurvey.score || 10,
        respuestas: newSurvey
      };

      const { error } = await supabase
        .from('evaluaciones')
        .insert([payload]);

      if (error) throw error;

      // Retornar la lista actualizada completa
      const { data: updatedData, error: fetchError } = await supabase
        .from('evaluaciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedSurveys = updatedData.map((item: any) => ({
        id: item.id ? item.id.toString() : String(Date.now()),
        formato: item.formato,
        fecha: item.created_at,
        clientName: item.nombre_cliente,
        score: item.puntaje,
        ...(item.respuestas || {})
      }));

      res.json(formattedSurveys);
    } catch (err: any) {
      console.error('Error saving survey to Supabase:', err);
      res.status(500).json({ error: 'Error al guardar la encuesta en la base de datos' });
    }
  });

  // Eliminar encuesta en Supabase
  app.delete('/api/surveys/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase
        .from('evaluaciones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const { data: updatedData } = await supabase
        .from('evaluaciones')
        .select('*')
        .order('created_at', { ascending: false });

      const formattedSurveys = (updatedData || []).map((item: any) => ({
        id: item.id ? item.id.toString() : String(Date.now()),
        formato: item.formato,
        fecha: item.created_at,
        clientName: item.nombre_cliente,
        score: item.puntaje,
        ...(item.respuestas || {})
      }));

      res.json(formattedSurveys);
    } catch (err: any) {
      console.error('Error deleting survey from Supabase:', err);
      res.status(500).json({ error: 'Error al eliminar la encuesta' });
    }
  });

  // Reset de encuestas (opcional: limpia la tabla o la deja vacía)
  app.post('/api/surveys/reset', async (req, res) => {
    try {
      await supabase.from('evaluaciones').delete().neq('id', 0); // Borra todos los registros
      res.json([]);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al restablecer encuestas' });
    }
  });

  // ==========================================
  // QUESTIONS API ENDPOINTS
  // ==========================================
  app.get('/api/questions', (req, res) => {
    res.json(questionsStore);
  });

  app.post('/api/questions', (req, res) => {
    const { format, questions } = req.body;
    if (format && (format === 'GCFO0192' || format === 'GCFO0131') && Array.isArray(questions)) {
      questionsStore[format as 'GCFO0192' | 'GCFO0131'] = questions;
    }
    res.json(questionsStore);
  });

  app.post('/api/questions/reset', (req, res) => {
    questionsStore = {
      GCFO0192: [...GCFO0192_QUESTIONS],
      GCFO0131: [...GCFO0131_QUESTIONS]
    };
    res.json(questionsStore);
  });

  // API endpoint: AI Analysis of Survey Reports
  app.post('/api/analyze-report', async (req, res) => {
    const { formatType, formatTitle, totalSurveys, overallAverage, csatIndex, sectionMetrics, motives } = req.body;

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

#### 📋 Plan de Acción para Mejora Continua (ISO 17020 / ISO 9001):
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
- Promedio General: ${overallAverage} / 10
- Índice CSAT (% calificaciones >= 8): ${csatIndex}%

RESUMEN POR SECCIÓN:
${JSON.stringify(sectionMetrics, null, 2)}

MOTIVOS DE BAJAS CALIFICACIONES (<= 8):
${motives && motives.length > 0 ? JSON.stringify(motives, null, 2) : 'Ninguno. Todos los clientes puntuaron 9 o 10.'}

INSTRUCCIONES DE RESPUESTA:
Proporciona un diagnóstico ejecutivo breve, profesional y estructurado en Markdown (máximo 250 palabras):
1. **Resumen Ejecutivo**: Evaluación general del desempeño del formato ${formatType}.
2. **Puntos Críticos / Hallazgos**: Principales motivos de insatisfacción reportados en notas <= 8.
3. **Recomendaciones Operativas**: 3 acciones concretas y prioritarias para el equipo de inspección de SEDAPAL para elevar la satisfacción a >= 9.0.
Utiliza un tono corporativo, claro y orientado a la mejora continua ISO 17020 / ISO 9001.
`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });

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