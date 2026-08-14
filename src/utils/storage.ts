import { SurveyResponse, FormatType, FormatReport, SectionMetrics, QuestionMetrics, Question } from '../types';
import { GCFO0131_QUESTIONS, SAMPLE_SURVEY_RESPONSES, GCFO0131_TITLE } from '../data/initialQuestions';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_KEY = 'sedapal_survey_responses_v1';
const QUESTIONS_STORAGE_KEY = 'sedapal_custom_questions_v4';

export function getStoredQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(QUESTIONS_STORAGE_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      if (map && map['GCFO0131'] && Array.isArray(map['GCFO0131']) && map['GCFO0131'].length > 0) {
        return map['GCFO0131'];
      }
    }
  } catch (e) {
    console.error('Error reading custom questions from localStorage:', e);
  }
  return GCFO0131_QUESTIONS;
}

export async function fetchStoredQuestionsMap(): Promise<{ GCFO0131: Question[] }> {
  return {
    GCFO0131: getStoredQuestions()
  };
}

export async function saveQuestionsAsync(format: FormatType, questions: Question[]): Promise<Question[]> {
  try {
    const raw = localStorage.getItem(QUESTIONS_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[format] = questions;
    localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving questions:', e);
  }
  return questions;
}

export async function resetQuestionsAsync(format: FormatType): Promise<Question[]> {
  try {
    const raw = localStorage.getItem(QUESTIONS_STORAGE_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      delete map[format];
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(map));
    }
  } catch (e) {
    console.error('Error resetting questions:', e);
  }
  return getStoredQuestions();
}

// Guardar encuesta mapeando todos los campos completos hacia Supabase
export async function saveSurvey(survey: SurveyResponse): Promise<boolean> {
  try {
    const { error } = await supabase.from('evaluaciones').insert([
      {
        id: survey.id,
        formato: survey.formatType,
        created_at: survey.createdAt,
        nombre_cliente: survey.clientName,
        empresa: survey.companyName || null,
        expediente: survey.serviceOrderOrExpedient || null,
        inspector: survey.inspectorName || null,
        canal_servicio: survey.serviceChannel || null,
        tipo_servicio: survey.serviceProvidedType || null,
        puntaje: survey.averageScore,
        respuestas: survey.answers,
        comentarios: survey.generalComments || null,
        notas_bajas: survey.lowScoreCount,
      },
    ]);

    if (error) {
      console.error('Error al guardar en Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Excepción al guardar encuesta:', err);
    return false;
  }
}

// Cargar todas las encuestas desde Supabase mapeándolas a SurveyResponse
export async function loadSurveys(): Promise<SurveyResponse[]> {
  try {
    const { data, error } = await supabase
      .from('evaluaciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar desde Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((item: any) => ({
      id: item.id,
      formatType: item.formato || 'GCFO0131',
      createdAt: item.created_at,
      clientName: item.nombre_cliente || '',
      companyName: item.empresa || '',
      serviceOrderOrExpedient: item.expediente || '',
      inspectorName: item.inspector || '',
      serviceChannel: item.canal_servicio || 'Presencial',
      serviceProvidedType: item.tipo_servicio || 'No especificado',
      answers: item.respuestas || [],
      generalComments: item.comentarios || '',
      averageScore: item.puntaje || 0,
      lowScoreCount: item.notas_bajas || 0,
    }));
  } catch (err) {
    console.error('Excepción al cargar encuestas:', err);
    return [];
  }
}

// Eliminar encuesta en Supabase
export async function deleteSurvey(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('evaluaciones').delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar encuesta:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Excepción al eliminar encuesta:', err);
    return false;
  }
}

// Funciones locales de respaldo / cálculo de reportes
export async function getStoredSurveys(): Promise<SurveyResponse[]> {
  const remote = await loadSurveys();
  if (remote.length > 0) return remote;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return SAMPLE_SURVEY_RESPONSES;
}

export async function saveSurveyResponse(survey: SurveyResponse): Promise<void> {
  await saveSurvey(survey);
  try {
    const current = await getStoredSurveys();
    const updated = [survey, ...current.filter(s => s.id !== survey.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
}

export async function deleteStoredSurvey(id: string): Promise<void> {
  await deleteSurvey(id);
  try {
    const current = await getStoredSurveys();
    const updated = current.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
}

// Funciones requeridas y exportadas para App.tsx
export async function fetchStoredResponses(): Promise<SurveyResponse[]> {
  return await getStoredSurveys();
}

export async function saveSurveyResponseAsync(survey: SurveyResponse): Promise<void> {
  await saveSurveyResponse(survey);
}

export async function updateSurveyResponseAsync(survey: SurveyResponse): Promise<void> {
  await saveSurveyResponse(survey);
}

export async function deleteSurveyResponseAsync(id: string): Promise<void> {
  await deleteStoredSurvey(id);
}

export async function resetSurveyResponsesAsync(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
}

export async function generateFormatReport(formatType: FormatType, selectedServiceType?: string): Promise<FormatReport> {
  const allSurveys = await getStoredSurveys();
  const surveys = allSurveys.filter(s => {
    const matchesFormat = s.formatType === formatType;
    if (!matchesFormat) return false;
    if (selectedServiceType && selectedServiceType !== 'TODOS') {
      return s.serviceProvidedType === selectedServiceType;
    }
    return true;
  });

  const questions = getStoredQuestions();
  const totalSurveys = surveys.length;

  let totalScoreSum = 0;
  let totalAnswersCount = 0;
  let totalLowScores = 0;

  const sectionMap: { [key: string]: { title: string; scores: number[]; lowCount: number; totalQ: number } } = {};
  const questionMap: { [key: string]: { questionId: string; number: number; sectionTitle: string; text: string; scores: number[]; lowCount: number; motives: any[] } } = {};

  questions.forEach(q => {
    if (!sectionMap[q.sectionId]) {
      sectionMap[q.sectionId] = { title: q.sectionTitle, scores: [], lowCount: 0, totalQ: 0 };
    }
    sectionMap[q.sectionId].totalQ++;

    questionMap[q.id] = {
      questionId: q.id,
      number: q.number,
      sectionTitle: q.sectionTitle,
      text: q.text,
      scores: [],
      lowCount: 0,
      motives: []
    };
  });

  surveys.forEach(survey => {
    survey.answers.forEach(ans => {
      totalScoreSum += ans.score;
      totalAnswersCount++;
      if (ans.score < 8) totalLowScores++;

      const qMeta = questions.find(q => q.id === ans.questionId);
      const secId = qMeta ? qMeta.sectionId : 'general';

      if (sectionMap[secId]) {
        sectionMap[secId].scores.push(ans.score);
        if (ans.score < 8) sectionMap[secId].lowCount++;
      }

      if (questionMap[ans.questionId]) {
        questionMap[ans.questionId].scores.push(ans.score);
        if (ans.score < 8) {
          questionMap[ans.questionId].lowCount++;
          questionMap[ans.questionId].motives.push({
            responseId: survey.id,
            clientName: survey.clientName,
            date: new Date(survey.createdAt).toLocaleDateString(),
            score: ans.score,
            motive: ans.motive || 'Sin motivo especificado'
          });
        }
      }
    });
  });

  const overallAverage = totalAnswersCount > 0 ? Number((totalScoreSum / totalAnswersCount).toFixed(2)) : 0;
  
  let highOrEqual8Count = 0;
  surveys.forEach(s => {
    s.answers.forEach(a => {
      if (a.score >= 8) highOrEqual8Count++;
    });
  });
  const csatIndex = totalAnswersCount > 0 ? Number(((highOrEqual8Count / totalAnswersCount) * 100).toFixed(1)) : 0;

  const sectionMetrics: SectionMetrics[] = Object.keys(sectionMap).map(secId => {
    const data = sectionMap[secId];
    const avg = data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0;
    const highScoresSec = data.scores.filter(s => s.score >= 8).length;
    const csatSec = data.scores.length > 0 ? (highScoresSec / data.scores.length) * 100 : 0;

    return {
      sectionId: secId,
      sectionTitle: data.title,
      averageScore: Number(avg.toFixed(2)),
      totalQuestions: data.totalQ,
      lowScoreCount: data.lowCount,
      csatPercentage: Number(csatSec.toFixed(1))
    };
  });

  const questionMetrics: QuestionMetrics[] = Object.keys(questionMap).map(qId => {
    const qData = questionMap[qId];
    const avg = qData.scores.length > 0 ? qData.scores.reduce((a, b) => a + b, 0) / qData.scores.length : 0;
    
    const distMap: { [score: number]: number } = {};
    for (let i = 1; i <= 10; i++) distMap[i] = 0;
    qData.scores.forEach(s => { distMap[s] = (distMap[s] || 0) + 1; });
    const scoreDistribution = Object.keys(distMap).map(scoreStr => ({
      score: Number(scoreStr),
      count: distMap[Number(scoreStr)]
    }));

    const highScoresQ = qData.scores.filter(s => s >= 8).length;
    const csatQ = qData.scores.length > 0 ? (highScoresQ / qData.scores.length) * 100 : 0;

    return {
      questionId: qData.questionId,
      questionNumber: qData.number,
      sectionTitle: qData.sectionTitle,
      text: qData.text,
      averageScore: Number(avg.toFixed(2)),
      totalResponses: qData.scores.length,
      scoreDistribution,
      lowScoresCount: qData.lowCount,
      csatPercentage: Number(csatQ.toFixed(1)),
      motives: qData.motives
    };
  });

  const allMotives: any[] = [];
  questionMetrics.forEach(qm => {
    qm.motives.forEach(m => {
      allMotives.push({
        questionNumber: qm.questionNumber,
        questionText: qm.text,
        sectionTitle: qm.sectionTitle,
        clientName: m.clientName,
        date: m.date,
        score: m.score,
        motive: m.motive,
        responseId: m.responseId
      });
    });
  });

  const allComments = surveys
    .filter(s => s.generalComments && s.generalComments.trim() !== '')
    .map(s => ({
      responseId: s.id,
      clientName: s.clientName,
      companyName: s.companyName,
      serviceOrder: s.serviceOrderOrExpedient,
      date: new Date(s.createdAt).toLocaleDateString(),
      serviceType: s.serviceProvidedType,
      comment: s.generalComments!
    }));

  return {
    formatType,
    formatTitle: GCFO0131_TITLE,
    selectedServiceType,
    totalSurveys,
    overallAverage,
    csatIndex,
    totalLowScores,
    sectionMetrics,
    questionMetrics,
    allMotives,
    allComments
  };
}