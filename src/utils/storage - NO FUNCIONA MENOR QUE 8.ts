import { SurveyResponse, FormatType, FormatReport, SectionMetrics, QuestionMetrics, Question } from '../types';
import { GCFO0131_QUESTIONS, SAMPLE_SURVEY_RESPONSES, GCFO0131_TITLE } from '../data/initialQuestions';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'sedapal_survey_responses_v1';
const QUESTIONS_STORAGE_KEY = 'sedapal_custom_questions_v4';

export function getStoredQuestions(format?: FormatType): Question[] {
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
  return { GCFO0131: getStoredQuestions('GCFO0131') };
}

export async function saveQuestionsAsync(format: FormatType, questions: Question[]): Promise<{ GCFO0131: Question[] }> {
  const currentMap = { GCFO0131: questions };
  localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(currentMap));
  return currentMap;
}

export async function resetQuestionsAsync(): Promise<{ GCFO0131: Question[] }> {
  const defaultMap = { GCFO0131: GCFO0131_QUESTIONS };
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

// Fetch central survey responses directly from Supabase
export async function fetchStoredResponses(): Promise<SurveyResponse[]> {
  try {
    const { data, error } = await supabase
      .from('encuestas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching surveys from Supabase:', error);
      alert("¡Atención! No se pudo sincronizar con la base de datos de Supabase. Revisa tu conexión o las políticas de seguridad.");
      return getStoredResponses();
    }

    if (data && data.length > 0) {
      const formatted: SurveyResponse[] = data.map((item: any) => ({
        id: item.id,
        formatType: item.formato_tipo || 'GCFO0131',
        serviceProvidedType: item.tipo_servicio,
        clientName: item.razon_social,
        companyName: item.empresa,
        serviceOrderOrExpedient: item.numero_expediente,
        answers: item.respuestas || [], 
        generalComments: item.comentarios_generales, 
        isGeneralSatisfied: item.conformidad_general ?? true,
        createdAt: item.created_at
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
      return formatted;
    }
  } catch (error) {
    console.warn('Network error fetching from Supabase:', error);
  }
  return getStoredResponses();
}

export async function saveSurveyResponseAsync(response: SurveyResponse): Promise<SurveyResponse[]> {
  const answers = response.answers || [];
  let totalScore = 0;
  let lowScoresCount = 0;
  answers.forEach((a: any) => {
    totalScore += (a.score || 0);
    if ((a.score || 0) <= 8) lowScoresCount++;
  });
  const avgScore = answers.length > 0 ? Number((totalScore / answers.length).toFixed(1)) : 10;

  // Insertamos incluyendo todas las columnas válidas de Supabase (con respuestas incluidas)
  const { error } = await supabase.from('encuestas').insert([
    {
      id: response.id,
      formato_tipo: response.formatType,
      tipo_servicio: response.serviceProvidedType,
      razon_social: response.clientName,
      empresa: response.companyName,
      numero_expediente: response.serviceOrderOrExpedient,
      respuestas: response.answers,
      comentarios_generales: response.generalComments, 
      conformidad_general: response.isGeneralSatisfied,
      puntaje_promedio: avgScore,
      cantidad_observaciones_bajas: lowScoresCount,
      created_at: response.createdAt
    }
  ]);

  if (error) {
    console.error('Error inserting survey into Supabase:', error);
    alert("¡Error crítico! No se pudo guardar la encuesta en el Servidor Supabase. Verifique su conexión o permisos.");
    throw new Error(error.message);
  }

  const current = getStoredResponses();
  const updated = [response, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function saveSurveyResponse(response: SurveyResponse): SurveyResponse[] {
  const answers = response.answers || [];
  let totalScore = 0;
  let lowScoresCount = 0;
  answers.forEach((a: any) => {
    totalScore += (a.score || 0);
    if ((a.score || 0) <= 8) lowScoresCount++;
  });
  const avgScore = answers.length > 0 ? Number((totalScore / answers.length).toFixed(1)) : 10;

  supabase.from('encuestas').insert([
    {
      id: response.id,
      formato_tipo: response.formatType,
      tipo_servicio: response.serviceProvidedType,
      razon_social: response.clientName,
      empresa: response.companyName,
      numero_expediente: response.serviceOrderOrExpedient,
      respuestas: response.answers,
      comentarios_generales: response.generalComments, 
      conformidad_general: response.isGeneralSatisfied,
      puntaje_promedio: avgScore,
      cantidad_observaciones_bajas: lowScoresCount,
      created_at: response.createdAt
    }
  ]).then(({ error }) => {
    if (error) {
      console.error('Error enviando a Supabase:', error);
      alert("¡Alerta! La encuesta NO se guardó en el servidor Supabase. Hubo un error de conexión o rechazo de la base de datos.");
    }
  });

  const current = getStoredResponses();
  const updated = [response, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function updateSurveyResponseAsync(updatedResponse: SurveyResponse): Promise<SurveyResponse[]> {
  const answers = updatedResponse.answers || [];
  let totalScore = 0;
  let lowScoresCount = 0;
  answers.forEach((a: any) => {
    totalScore += (a.score || 0);
    if ((a.score || 0) <= 8) lowScoresCount++;
  });
  const avgScore = answers.length > 0 ? Number((totalScore / answers.length).toFixed(1)) : 10;

  const { error } = await supabase
    .from('encuestas')
    .update({
      tipo_servicio: updatedResponse.serviceProvidedType,
      razon_social: updatedResponse.clientName,
      empresa: updatedResponse.companyName,
      numero_expediente: updatedResponse.serviceOrderOrExpedient,
      respuestas: updatedResponse.answers,
      comentarios_generales: updatedResponse.generalComments, 
      conformidad_general: updatedResponse.isGeneralSatisfied,
      puntaje_promedio: avgScore,
      cantidad_observaciones_bajas: lowScoresCount
    })
    .eq('id', updatedResponse.id);

  if (error) {
    console.error('Error updating survey on Supabase:', error);
    alert("No se pudo actualizar el registro en el servidor.");
    throw new Error(error.message);
  }

  const current = getStoredResponses();
  const index = current.findIndex(s => s.id === updatedResponse.id);
  let updatedList: SurveyResponse[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = updatedResponse;
  } else {
    updatedList = [updatedResponse, ...current];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  return updatedList;
}

export async function deleteSurveyResponseAsync(id: string): Promise<SurveyResponse[]> {
  const { error } = await supabase.from('encuestas').delete().eq('id', id);

  if (error) {
    console.error('Error deleting survey from Supabase:', error);
    alert("No se pudo eliminar el registro del servidor.");
    throw new Error(error.message);
  }

  const current = getStoredResponses().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return current;
}

export async function resetSurveyResponsesAsync(): Promise<SurveyResponse[]> {
  return resetSurveyResponses();
}

export function resetSurveyResponses(): SurveyResponse[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_SURVEY_RESPONSES));
  return SAMPLE_SURVEY_RESPONSES;
}

export function clearAllSurveyResponses(): SurveyResponse[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
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
  const questions = getStoredQuestions(format);
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
      iso9001Target: 92.50,
      iso9001Executed: 0,
      uvmTarget: 92.50,
      uvmExecuted: 0,
      conformityYesCount: 0,
      conformityNoCount: 0,
      conformityPercentage: 0,
      contactReasons: [],
      sectionMetrics: [],
      questionMetrics: [],
      allMotives: [],
      allComments: [],
      allClientsList: []
    };
  }

  let totalScoreSum = 0;
  let totalAnswerCount = 0;
  let totalSatisfiedCount = 0;
  let totalLowScoresCount = 0;

  const questionMetrics = questions.map(q => {
    let qSum = 0;
    let qCount = 0;
    let qSatisfied = 0;
    let qLow = 0;
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    const motives: QuestionMetrics['motives'] = [];

    filtered.forEach(resp => {
      const ans = resp.answers?.find(a => a.questionId === q.id || a.questionNumber === q.number);
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

    let lvl5 = 0, lvl4 = 0, lvl3 = 0, lvl2 = 0, lvl1 = 0;
    Object.entries(distribution).forEach(([scoreKey, countVal]) => {
      const s = Number(scoreKey);
      if (s >= 9) lvl5 += countVal;
      else if (s >= 7) lvl4 += countVal;
      else if (s >= 5) lvl3 += countVal;
      else if (s >= 3) lvl2 += countVal;
      else lvl1 += countVal;
    });

    const tot = qCount || 1;
    const levelDistribution = [
      { level: 5, label: 'Nivel 5 (Excelente)', count: lvl5, percentage: Number(((lvl5 / tot) * 100).toFixed(1)) },
      { level: 4, label: 'Nivel 4 (Muy Bueno)', count: lvl4, percentage: Number(((lvl4 / tot) * 100).toFixed(1)) },
      { level: 3, label: 'Nivel 3 (Bueno)', count: lvl3, percentage: Number(((lvl3 / tot) * 100).toFixed(1)) },
      { level: 2, label: 'Nivel 2 (Regular)', count: lvl2, percentage: Number(((lvl2 / tot) * 100).toFixed(1)) },
      { level: 1, label: 'Nivel 1 (Malo)', count: lvl1, percentage: Number(((lvl1 / tot) * 100).toFixed(1)) }
    ];

    return {
      questionId: q.id,
      questionNumber: q.number,
      sectionTitle: q.sectionTitle,
      text: q.text,
      averageScore: avg,
      totalResponses: qCount,
      scoreDistribution: Object.keys(distribution).map(k => ({ score: Number(k), count: distribution[Number(k)] })),
      levelDistribution,
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

  let totalConformityYes = 0;
  let totalConformityNo = 0;

  filtered.forEach(resp => {
    if (resp.isGeneralSatisfied === false) {
      totalConformityNo += 1;
    } else {
      totalConformityYes += 1;
    }
  });

  const overallAverage = totalAnswerCount > 0 ? Number((totalScoreSum / totalAnswerCount).toFixed(2)) : 0;
  const csatIndex = totalAnswerCount > 0 ? Number(((totalSatisfiedCount / totalAnswerCount) * 100).toFixed(1)) : 0;

  const maxPossibleScore = totalAnswerCount * 10;
  const iso9001Executed = maxPossibleScore > 0 ? Number(((totalScoreSum / maxPossibleScore) * 100).toFixed(2)) : 0;
  const iso9001Target = 92.50;

  const uvmSurveys = filtered.filter(s => s.serviceProvidedType?.toLowerCase().includes('verificación') || s.serviceProvidedType?.toLowerCase().includes('uvm'));
  let uvmScoreSum = 0;
  let uvmAnsCount = 0;
  uvmSurveys.forEach(s => {
    s.answers?.forEach(a => {
      uvmScoreSum += a.score;
      uvmAnsCount += 1;
    });
  });
  const uvmExecuted = uvmAnsCount > 0 ? Number(((uvmScoreSum / (uvmAnsCount * 10)) * 100).toFixed(2)) : 84.65;
  const uvmTarget = 92.50;

  const totalConformity = totalConformityYes + totalConformityNo;
  const conformityPercentage = totalConformity > 0 ? Number(((totalConformityYes / totalConformity) * 100).toFixed(1)) : 100;

  const allClientsList = filtered.map((resp, idx) => ({
    index: idx + 1,
    id: resp.id,
    clientName: resp.clientName,
    companyName: resp.companyName,
    rucOrTeam: resp.companyName || resp.serviceOrderOrExpedient || '20522592669',
    expedient: resp.serviceOrderOrExpedient,
    serviceType: resp.serviceProvidedType || 'General',
    date: resp.createdAt
  }));

  return {
    formatType: format,
    formatTitle,
    selectedServiceType: serviceProvidedType,
    totalSurveys: filtered.length,
    overallAverage,
    csatIndex,
    totalLowScores: totalLowScoresCount,
    iso9001Target,
    iso9001Executed,
    uvmTarget,
    uvmExecuted,
    conformityYesCount: totalConformityYes,
    conformityNoCount: totalConformityNo,
    conformityPercentage,
    sectionMetrics,
    questionMetrics,
    allMotives,
    allComments,
    allClientsList
  };
}