export type FormatType = 'GCFO0131';

export interface Question {
  id: string;
  number: number;
  sectionId: string;
  sectionTitle: string;
  text: string;
}

export interface QuestionAnswer {
  questionId: string;
  questionNumber: number;
  sectionId: string;
  score: number; // 1 to 10
  motive?: string; // Required if score < 8
}

export interface SurveyResponse {
  id: string;
  formatType: FormatType;
  createdAt: string; // ISO date string
  clientName: string;
  companyName?: string;
  serviceOrderOrExpedient: string;
  inspectorName?: string;
  serviceChannel: 'Correo' | 'Teléfono' | 'WhatsApp' | 'Presencial' | 'Portal Web';
  serviceProvidedType?: string;
  answers: QuestionAnswer[];
  generalComments?: string;
  averageScore: number;
  lowScoreCount: number; // Count of answers < 8
}

export interface SectionMetrics {
  sectionId: string;
  sectionTitle: string;
  averageScore: number;
  totalQuestions: number;
  lowScoreCount: number;
  csatPercentage: number; // % of scores >= 8
}

export interface QuestionMetrics {
  questionId: string;
  questionNumber: number;
  sectionTitle: string;
  text: string;
  averageScore: number;
  totalResponses: number;
  scoreDistribution: { score: number; count: number }[];
  lowScoresCount: number;
  csatPercentage: number;
  motives: { responseId: string; clientName: string; date: string; score: number; motive: string }[];
}

export interface FormatReport {
  formatType: FormatType;
  formatTitle: string;
  selectedServiceType?: string;
  totalSurveys: number;
  overallAverage: number;
  csatIndex: number; // % of all answers across all surveys >= 8
  totalLowScores: number; // Total answers < 8
  sectionMetrics: SectionMetrics[];
  questionMetrics: QuestionMetrics[];
  allMotives: {
    questionNumber: number;
    questionText: string;
    sectionTitle: string;
    clientName: string;
    date: string;
    score: number;
    motive: string;
    responseId: string;
  }[];
  allComments: {
    responseId: string;
    clientName: string;
    companyName?: string;
    serviceOrder: string;
    date: string;
    serviceType?: string;
    comment: string;
  }[];
}
