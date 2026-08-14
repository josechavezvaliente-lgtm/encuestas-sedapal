import { SurveyResponse, FormatType, FormatReport, SectionMetrics, QuestionMetrics, Question } from '../types';
import { GCFO0131_QUESTIONS, SAMPLE_SURVEY_RESPONSES, GCFO0131_TITLE } from '../data/initialQuestions';

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
  const fallback = {
    GCFO0131: getStoredQuestions('GCFO0131')
  };
  try {
    const res = await fetch('/api/questions');
    if (res.ok) {
      const data = await res.json();
      if (data && data.GCFO0131) {
        localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('Network error fetching central questions:', err);
  }
  return fallback;
}

export async function saveQuestionsAsync(format: FormatType, questions: Question[]): Promise<{ GCFO0131: Question[] }> {
  try {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format, questions })
    });
    if (res.ok) {
      const updated = await res.json();
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
  } catch (err) {
    console.error('Error saving custom questions to server:', err);
  }
  
  // Local fallback
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
  try {
    const res = await fetch('/api/questions/reset', { method: 'POST' });
    if (res.ok) {
      const reseted = await res.json();
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(reseted));
      return reseted;
    }
  } catch (err) {
    console.error('Error resetting questions on server:', err);
  }
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

// Fetch central survey responses from backend server
export async function fetchStoredResponses(): Promise<SurveyResponse[]> {
  try {
    const res = await fetch('/api/surveys');
    if (res.ok) {
      const data: SurveyResponse[] = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (error) {
    console.warn('Network error fetching central surveys, using fallback:', error);
  }
  return getStoredResponses();
}

export function saveSurveyResponse(response: SurveyResponse): SurveyResponse[] {
  const current = getStoredResponses();
  const updated = [response, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving survey response to localStorage:', error);
  }
  
  // Post asynchronously to server backend
  fetch('/api/surveys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response)
  }).catch(err => console.error('Error syncing response to server:', err));

  return updated;
}

export async function saveSurveyResponseAsync(response: SurveyResponse): Promise<SurveyResponse[]> {
  try {
    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    });
    if (res.ok) {
      const updated: SurveyResponse[] = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
  } catch (err) {
    console.error('Error posting survey to server:', err);
  }
  return saveSurveyResponse(response);
}

export async function updateSurveyResponseAsync(updatedResponse: SurveyResponse): Promise<SurveyResponse[]> {
  try {
    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedResponse)
    });
    if (res.ok) {
      const updatedList: SurveyResponse[] = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      return updatedList;
    }
  } catch (err) {
    console.error('Error updating survey on server:', err);
  }

  // Fallback to local storage
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
  try {
    const res = await fetch(`/api/surveys/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const updated: SurveyResponse[] = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
  } catch (err) {
    console.error('Error deleting survey from server:', err);
  }
  const current = getStoredResponses().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return current;
}

export async function resetSurveyResponsesAsync(): Promise<SurveyResponse[]> {
  try {
    const res = await fetch('/api/surveys/reset', { method: 'POST' });
    if (res.ok) {
      const reseted: SurveyResponse[] = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reseted));
      return reseted;
    }
  } catch (err) {
    console.error('Error resetting surveys on server:', err);
  }
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
      sectionMetrics: [],
      questionMetrics: [],
      allMotives: [],
      allComments: []
    };
  }

  let totalScoreSum = 0;
  let totalAnswerCount = 0;
  let totalSatisfiedCount = 0; // score >= 8
  let totalLowScoresCount = 0; // score < 8

  // Calculate per-question metrics
  const questionMetrics: QuestionMetrics[] = questions.map(q => {
    let qSum = 0;
    let qCount = 0;
    let qSatisfied = 0;
    let qLow = 0;
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    const motives: QuestionMetrics['motives'] = [];

    filtered.forEach(resp => {
      const ans = resp.answers.find(a => a.questionId === q.id || a.questionNumber === q.number);
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

  // Calculate per-section metrics
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

  // All motives aggregated
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

  // All comments aggregated (Section 2: Comentarios y sugerencias)
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
