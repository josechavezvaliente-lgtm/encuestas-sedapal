import { Question, FormatType, SurveyResponse } from '../types';

export const GCFO0192_TITLE = "Formato GCFO0192: Encuesta de Satisfacción del Cliente - Organismo de Inspección";
export const GCFO0131_TITLE = "Formato GCFO0131: Encuesta de Satisfacción respecto al Organismo de Inspección de Medidores de Agua Potable";

export const GCFO0192_QUESTIONS: Question[] = [
  // I. Atención y comunicación
  {
    id: 'g192_q1',
    number: 1,
    sectionId: 'sec_1',
    sectionTitle: 'I. Atención y comunicación',
    text: '¿Qué tan satisfecho(a) se encuentra con la información proporcionada por el Organismo de Inspección antes y durante la prestación del servicio?'
  },
  {
    id: 'g192_q2',
    number: 2,
    sectionId: 'sec_1',
    sectionTitle: 'I. Atención y comunicación',
    text: '¿Qué tan satisfecho(a) se encuentra con la atención brindada por el personal del Organismo de Inspección a través de los diferentes canales de comunicación (correo electrónico, teléfono o WhatsApp)?'
  },
  {
    id: 'g192_q3',
    number: 3,
    sectionId: 'sec_1',
    sectionTitle: 'I. Atención y comunicación',
    text: '¿Qué tan satisfecho(a) se encuentra con la disposición del personal para atender sus consultas y requerimientos?'
  },
  // II. Oportunidad del servicio
  {
    id: 'g192_q4',
    number: 4,
    sectionId: 'sec_2',
    sectionTitle: 'II. Oportunidad del servicio',
    text: '¿Qué tan satisfecho(a) se encuentra con el tiempo de atención del servicio de verificación posterior?'
  },
  {
    id: 'g192_q5',
    number: 5,
    sectionId: 'sec_2',
    sectionTitle: 'II. Oportunidad del servicio',
    text: '¿Qué tan satisfecho(a) se encuentra con la oportunidad en la entrega del certificado o informe de inspección?'
  },
  // III. Competencia técnica y confianza
  {
    id: 'g192_q6',
    number: 6,
    sectionId: 'sec_3',
    sectionTitle: 'III. Competencia técnica y confianza',
    text: '¿Qué tan satisfecho(a) se encuentra con la competencia técnica demostrada por el personal durante la prestación del servicio?'
  },
  {
    id: 'g192_q7',
    number: 7,
    sectionId: 'sec_3',
    sectionTitle: 'III. Competencia técnica y confianza',
    text: '¿Qué tan satisfecho(a) se encuentra con la imparcialidad e independencia demostradas por el Organismo de Inspección durante la prestación del servicio?'
  },
  {
    id: 'g192_q8',
    number: 8,
    sectionId: 'sec_3',
    sectionTitle: 'III. Competencia técnica y confianza',
    text: '¿Qué tan satisfecho(a) se encuentra con el tratamiento confidencial de la información proporcionada al Organismo de Inspección?'
  },
  // IV. Calidad del servicio
  {
    id: 'g192_q9',
    number: 9,
    sectionId: 'sec_4',
    sectionTitle: 'IV. Calidad del servicio',
    text: 'Considerando su experiencia durante la prestación del servicio, ¿qué tan satisfecho(a) se encuentra con el servicio brindado por el Organismo de Inspección de SEDAPAL, en relación con la calidad de la atención y el cumplimiento de sus expectativas?'
  }
];

export const GCFO0131_QUESTIONS: Question[] = [
  {
    id: 'g131_q1',
    number: 1,
    sectionId: 'sec_131_1',
    sectionTitle: 'Evaluación del Servicio de Inspección de Medidores',
    text: 'Nuestro protocolo de bioseguridad'
  },
  {
    id: 'g131_q2',
    number: 2,
    sectionId: 'sec_131_1',
    sectionTitle: 'Evaluación del Servicio de Inspección de Medidores',
    text: 'La atención recibida del personal (trato, cordialidad).'
  },
  {
    id: 'g131_q3',
    number: 3,
    sectionId: 'sec_131_1',
    sectionTitle: 'Evaluación del Servicio de Inspección de Medidores',
    text: 'El tiempo de espera para ser atendido.'
  },
  {
    id: 'g131_q4',
    number: 4,
    sectionId: 'sec_131_1',
    sectionTitle: 'Evaluación del Servicio de Inspección de Medidores',
    text: 'El plazo utilizado para atender su requerimiento o consulta.'
  }
];

export function getQuestionsForFormat(format: FormatType): Question[] {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('sedapal_custom_questions_v1');
      if (raw) {
        const map = JSON.parse(raw);
        if (map && map[format] && Array.isArray(map[format]) && map[format].length > 0) {
          return map[format];
        }
      }
    }
  } catch (e) {
    console.error('Error reading custom questions from localStorage:', e);
  }
  return format === 'GCFO0192' ? GCFO0192_QUESTIONS : GCFO0131_QUESTIONS;
}

export const SAMPLE_SURVEY_RESPONSES: SurveyResponse[] = [
  {
    id: 'resp-101',
    formatType: 'GCFO0192',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    clientName: 'Ing. Carlos Mendoza',
    companyName: 'Constructora del Sur S.A.C.',
    serviceOrderOrExpedient: 'EXP-2026-0891',
    inspectorName: 'Ing. Fernando Quispe',
    serviceChannel: 'Correo',
    averageScore: 9.1,
    lowScoreCount: 0,
    answers: [
      { questionId: 'g192_q1', questionNumber: 1, sectionId: 'sec_1', score: 9 },
      { questionId: 'g192_q2', questionNumber: 2, sectionId: 'sec_1', score: 10 },
      { questionId: 'g192_q3', questionNumber: 3, sectionId: 'sec_1', score: 9 },
      { questionId: 'g192_q4', questionNumber: 4, sectionId: 'sec_2', score: 8 },
      { questionId: 'g192_q5', questionNumber: 5, sectionId: 'sec_2', score: 9 },
      { questionId: 'g192_q6', questionNumber: 6, sectionId: 'sec_3', score: 10 },
      { questionId: 'g192_q7', questionNumber: 7, sectionId: 'sec_3', score: 9 },
      { questionId: 'g192_q8', questionNumber: 8, sectionId: 'sec_3', score: 10 },
      { questionId: 'g192_q9', questionNumber: 9, sectionId: 'sec_4', score: 8 }
    ],
    generalComments: 'Excelente atención en general. El informe llegó dentro del plazo esperado.'
  },
  {
    id: 'resp-102',
    formatType: 'GCFO0192',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    clientName: 'Arq. Elena Rostagno',
    companyName: 'Consorcio Hidráulico Lima',
    serviceOrderOrExpedient: 'EXP-2026-0744',
    inspectorName: 'Ing. María Torres',
    serviceChannel: 'WhatsApp',
    averageScore: 6.9,
    lowScoreCount: 3,
    answers: [
      { questionId: 'g192_q1', questionNumber: 1, sectionId: 'sec_1', score: 8 },
      { questionId: 'g192_q2', questionNumber: 2, sectionId: 'sec_1', score: 9 },
      { questionId: 'g192_q3', questionNumber: 3, sectionId: 'sec_1', score: 8 },
      { questionId: 'g192_q4', questionNumber: 4, sectionId: 'sec_2', score: 5, motive: 'La reprogramación de la verificación posterior tomó más de 5 días hábiles sin previo aviso.' },
      { questionId: 'g192_q5', questionNumber: 5, sectionId: 'sec_2', score: 6, motive: 'El informe de inspección demoró 3 días adicionales respecto a la fecha coordinada.' },
      { questionId: 'g192_q6', questionNumber: 6, sectionId: 'sec_3', score: 9 },
      { questionId: 'g192_q7', questionNumber: 7, sectionId: 'sec_3', score: 8 },
      { questionId: 'g192_q8', questionNumber: 8, sectionId: 'sec_3', score: 9 },
      { questionId: 'g192_q9', questionNumber: 9, sectionId: 'sec_4', score: 6, motive: 'Aunque la parte técnica fue correcta, la falta de oportunidad en el plazo afectó nuestro cronograma de obra.' }
    ],
    generalComments: 'Sugerimos mejorar los tiempos de emisión de certificados.'
  },
  {
    id: 'resp-103',
    formatType: 'GCFO0192',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    clientName: 'Lic. Jorge Valdivia',
    companyName: 'Servicios Industriales Arequipa',
    serviceOrderOrExpedient: 'EXP-2026-0612',
    inspectorName: 'Ing. Fernando Quispe',
    serviceChannel: 'Presencial',
    averageScore: 9.8,
    lowScoreCount: 0,
    answers: [
      { questionId: 'g192_q1', questionNumber: 1, sectionId: 'sec_1', score: 10 },
      { questionId: 'g192_q2', questionNumber: 2, sectionId: 'sec_1', score: 10 },
      { questionId: 'g192_q3', questionNumber: 3, sectionId: 'sec_1', score: 10 },
      { questionId: 'g192_q4', questionNumber: 4, sectionId: 'sec_2', score: 9 },
      { questionId: 'g192_q5', questionNumber: 5, sectionId: 'sec_2', score: 10 },
      { questionId: 'g192_q6', questionNumber: 6, sectionId: 'sec_3', score: 10 },
      { questionId: 'g192_q7', questionNumber: 7, sectionId: 'sec_3', score: 9 },
      { questionId: 'g192_q8', questionNumber: 8, sectionId: 'sec_3', score: 10 },
      { questionId: 'g192_q9', questionNumber: 9, sectionId: 'sec_4', score: 9 }
    ]
  },
  {
    id: 'resp-104',
    formatType: 'GCFO0131',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    clientName: 'Ing. Rosa Paredes',
    companyName: 'Inversiones Inmobiliarias Nube',
    serviceOrderOrExpedient: 'ORD-2026-4421',
    inspectorName: 'Técnico Roberto Salas',
    serviceChannel: 'Correo',
    averageScore: 8.3,
    lowScoreCount: 1,
    answers: [
      { questionId: 'g131_q1', questionNumber: 1, sectionId: 'sec_131_1', score: 9 },
      { questionId: 'g131_q2', questionNumber: 2, sectionId: 'sec_131_1', score: 9 },
      { questionId: 'g131_q3', questionNumber: 3, sectionId: 'sec_131_1', score: 9 },
      { questionId: 'g131_q4', questionNumber: 4, sectionId: 'sec_131_1', score: 6, motive: 'Hubo una demora adicional en el plazo de atención para nuestro requerimiento.' }
    ]
  },
  {
    id: 'resp-105',
    formatType: 'GCFO0131',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    clientName: 'Sr. Dante Alarcón',
    companyName: 'Manufacturas del Norte',
    serviceOrderOrExpedient: 'ORD-2026-3890',
    inspectorName: 'Ing. María Torres',
    serviceChannel: 'Teléfono',
    averageScore: 6.3,
    lowScoreCount: 3,
    answers: [
      { questionId: 'g131_q1', questionNumber: 1, sectionId: 'sec_131_1', score: 6, motive: 'El protocolo de bioseguridad no se mostró adecuadamente visible al ingreso.' },
      { questionId: 'g131_q2', questionNumber: 2, sectionId: 'sec_131_1', score: 8 },
      { questionId: 'g131_q3', questionNumber: 3, sectionId: 'sec_131_1', score: 5, motive: 'El tiempo de espera en ventanilla para la recepción superó los 40 minutos.' },
      { questionId: 'g131_q4', questionNumber: 4, sectionId: 'sec_131_1', score: 6, motive: 'Se excedió el plazo estipulado para la atención de nuestra consulta.' }
    ]
  }
];
