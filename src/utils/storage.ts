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