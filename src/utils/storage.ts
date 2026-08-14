import { SurveyResponse, FormatType, FormatReport, SectionMetrics, QuestionMetrics, Question } from '../types';
import { GCFO0131_QUESTIONS, SAMPLE_SURVEY_RESPONSES, GCFO0131_TITLE } from '../data/initialQuestions';
import { createClient } from '@supabase/supabase-js';

// Inicialización de Supabase compatible con Vite y respaldos de seguridad
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

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

export async function saveQuestionsAsync(format: FormatType, questions: Question[]): Promise<{ GCFO0131: Question[] }> {
  let currentMap = {
    GCFO0131: questions
  };
  localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(currentMap));
  return currentMap;
}

export async function resetQuestionsAsync(): Promise<{ GCFO0131: Question[] }> {
  const defaultMap = {
    GCFO0131: GCFO0131_QUESTIONS
  };
  localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(defaultMap));
  return defaultMap;
}

export function getStoredResponses(): SurveyResponse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_SURVEY_RESPONSES));
      return SAMPLE_SURVEY_RESPONSES;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading localStorage survey responses:', error);
    return SAMPLE_SURVEY_RESPONSES;
  }
}

// Obtener encuestas directamente desde la tabla 'evaluaciones' de Supabase
export async function fetchStoredResponses(): Promise<SurveyResponse[]> {
  try {
    const { data, error } = await supabase
      .from('evaluaciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching from Supabase:', error);
      return getStoredResponses();
    }

    if (data && data.length > 0) {
      const formattedResponses: SurveyResponse[] = data.map((row: any) => ({
        id: row.id?.toString() || row.resp_id,
        createdAt: row.created_at,
        formatType: row.formato,
        clientName: row.nombre_cliente,
        score: row.puntaje,
        answers: typeof row.respuestas === 'string' ? JSON.parse(row.respuestas) : row.respuestas,
        ...row
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formattedResponses));
      return formattedResponses;
    }
  } catch (error) {
    console.warn('Network error fetching surveys from Supabase, using local fallback:', error);
  }
  return getStoredResponses();
}

// Guardar encuesta directamente en Supabase en la tabla 'evaluaciones'
export async function saveSurveyResponseAsync(response: SurveyResponse): Promise<SurveyResponse[]> {
  try {
    const payload = {
      formato: response.formatType,
      nombre_cliente: response.clientName,
      puntaje: response.score || 10,
      respuestas: response.answers
    };

    const { error } = await supabase
      .from('evaluaciones')
      .insert([payload]);

    if (error) {
      console.error('Error inserting survey into Supabase:', error);
    }
  } catch (err) {
    console.error('Error posting survey to Supabase:', err);
  }

  const current = getStoredResponses();
  const updated = [response, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// Actualizar una encuesta existente directamente en Supabase
export async function updateSurveyResponseAsync(response: SurveyResponse): Promise<SurveyResponse[]> {
  try {
    const payload = {
      formato: response.formatType,
      nombre_cliente: response.clientName,
      puntaje: response.score || 10,
      respuestas: response.answers
    };

    const { error } = await supabase
      .from('evaluaciones')
      .update(payload)
      .eq('id', response.id);

    if (error) {
      console.error('Error updating survey in Supabase:', error);
    }
  } catch (err) {
    console.error('Error posting update to Supabase:', err);
  }

  const current = getStoredResponses();
  const updated = current.map(r => (r.id === response.id ? response : r));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function saveSurveyResponse(response: SurveyResponse): SurveyResponse[] {
  const current = getStoredResponses();
  const updated = [response, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving survey response to localStorage:', error);
  }
  return updated;
}

export async function deleteSurveyResponseAsync(id: string): Promise<SurveyResponse[]> {
  try {
    await supabase
      .from('evaluaciones')
      .delete()
      .eq('id', id);
  } catch (err) {
    console.error('Error deleting survey from Supabase:', err);
  }

  const current = getStoredResponses().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return current;
}

export async function resetSurveyResponsesAsync(): Promise<SurveyResponse[]> {
  return resetSurveyResponses();
}

export function resetSurveyResponses(): SurveyResponse[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_SURVEY_RESPONSES));
  } catch (error) {
    console.error('Error resetting survey responses:', error);
  }
  return SAMPLE_SURVEY_RESPONSES;
}

export function clearAllSurveyResponses(): SurveyResponse[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing survey responses:', error);
  }
  return [];
}

export function generateFormatReport(
  format: FormatType,
  responses: SurveyResponse[],
  serviceProvidedType?: string
): FormatReport {
  const filtered = responses.filter(r => {
    const matchesFormat = r.formatType === format;
    const matchesService =
      !serviceProvidedType ||
      serviceProvidedType === 'all' ||
      r.serviceProvidedType === serviceProvidedType;
    return matchesFormat && matchesService;
  });
  const questions = getStoredQuestions();
  const formatTitle = GCFO0131_TITLE;

  if (filtered.length === 0) {
    return {
      formatType: format,
      formatTitle,
      selectedServiceType: serviceProvidedType,
      totalSurveys: 0,
      overallAverage: 0,
      csatIndex: 0,
      totalLowScores: 0,
      sectionMetrics: [],
      questionMetrics: [],
      allMotives: [],
      allComments: []
    };
  }

  let totalScoreSum = 0;
  let totalAnswerCount = 0;
  let totalSatisfiedCount = 0;
  let totalLowScoresCount = 0;

  const questionMetrics: QuestionMetrics[] = questions.map(q => {
    let qSum = 0;
    let qCount = 0;
    let qSatisfied = 0;
    let qLow = 0;
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    const motives: QuestionMetrics['motives'] = [];

    filtered.forEach(resp => {
      if (!resp.answers || !Array.isArray(resp.answers)) return;
      const ans = resp.answers.find((a: any) => a.questionId === q.id || a.questionNumber === q.number);
      if (ans) {
        qSum += ans.score;
        qCount += 1;
        totalScoreSum += ans.score;
        totalAnswerCount += 1;

        distribution[ans.score] = (distribution[ans.score] || 0) + 1;

        if (ans.score > 8) {
          qSatisfied += 1;
          totalSatisfiedCount += 1;
        } else {
          qLow += 1;
          totalLowScoresCount += 1;
        }

        if (ans.score <= 8 && ans.motive && ans.motive.trim()) {
          motives.push({
            responseId: resp.id,
            clientName: resp.clientName,
            date: resp.createdAt,
            score: ans.score,
            motive: ans.motive.trim()
          });
        }
      }
    });

    const avg = qCount > 0 ? Number((qSum / qCount).toFixed(1)) : 0;
    const csat = qCount > 0 ? Number(((qSatisfied / qCount) * 100).toFixed(1)) : 0;

    return {
      questionId: q.id,
      questionNumber: q.number,
      sectionTitle: q.sectionTitle,
      text: q.text,
      averageScore: avg,
      totalResponses: qCount,
      scoreDistribution: Object.keys(distribution).map(k => ({ score: Number(k), count: distribution[Number(k)] })),
      lowScoresCount: qLow,
      csatPercentage: csat,
      motives
    };
  });

  const sectionsMap = new Map<string, { title: string; questions: QuestionMetrics[] }>();
  questionMetrics.forEach(qm => {
    if (!sectionsMap.has(qm.sectionTitle)) {
      sectionsMap.set(qm.sectionTitle, { title: qm.sectionTitle, questions: [] });
    }
    sectionsMap.get(qm.sectionTitle)!.questions.push(qm);
  });

  const sectionMetrics: SectionMetrics[] = Array.from(sectionsMap.entries()).map(([secTitle, data]) => {
    let secSum = 0;
    let secTotalAns = 0;
    let secSatisfiedAns = 0;
    let secLowCount = 0;

    data.questions.forEach(q => {
      secSum += q.averageScore * q.totalResponses;
      secTotalAns += q.totalResponses;
      secLowCount += q.lowScoresCount;
      secSatisfiedAns += Math.round((q.csatPercentage / 100) * q.totalResponses);
    });

    const secAvg = secTotalAns > 0 ? Number((secSum / secTotalAns).toFixed(1)) : 0;
    const secCsat = secTotalAns > 0 ? Number(((secSatisfiedAns / secTotalAns) * 100).toFixed(1)) : 0;

    return {
      sectionId: secTitle.replace(/[^a-zA-Z0-9]/g, '_'),
      sectionTitle: secTitle,
      averageScore: secAvg,
      totalQuestions: data.questions.length,
      lowScoreCount: secLowCount,
      csatPercentage: secCsat
    };
  });

  const allMotives: FormatReport['allMotives'] = [];
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

  const allComments: FormatReport['allComments'] = [];
  filtered.forEach(resp => {
    if (resp.generalComments && resp.generalComments.trim()) {
      allComments.push({
        responseId: resp.id,
        clientName: resp.clientName,
        companyName: resp.companyName,
        serviceOrder: resp.serviceOrderOrExpedient,
        date: resp.createdAt,
        serviceType: resp.serviceProvidedType,
        comment: resp.generalComments.trim()
      });
    }
  });

  const overallAverage = totalAnswerCount > 0 ? Number((totalScoreSum / totalAnswerCount).toFixed(1)) : 0;
  const csatIndex = totalAnswerCount > 0 ? Number(((totalSatisfiedCount / totalAnswerCount) * 100).toFixed(1)) : 0;

  return {
    formatType: format,
    formatTitle,
    selectedServiceType: serviceProvidedType,
    totalSurveys: filtered.length,
    overallAverage,
    csatIndex,
    totalLowScores: totalLowScoresCount,
    sectionMetrics,
    questionMetrics,
    allMotives,
    allComments
  };
}