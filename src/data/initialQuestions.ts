import { Question, FormatType, SurveyResponse } from '../types';

export const GCFO0131_TITLE = "Formato GCFO0131: Encuesta de Satisfacción respecto al Organismo de Inspección del EGCM";

export const GCFO0131_QUESTIONS: Question[] = [
  {
    id: 'g131_q1',
    number: 1,
    sectionId: 'sec_131',
    sectionTitle: 'Evaluación del Servicio',
    text: '¿Qué tan satisfecho(a) se encuentra con la información proporcionada por el Organismo de Inspección del EGCM antes y durante la prestación del servicio?'
  },
  {
    id: 'g131_q2',
    number: 2,
    sectionId: 'sec_131',
    sectionTitle: 'Evaluación del Servicio',
    text: '¿Qué tan satisfecho(a) se encuentra con la disposición y atención brindada por el personal del Organismo de Inspección del EGCM a través de los diferentes canales de comunicación (correo electrónico, teléfono o WhatsApp)?'
  },
  {
    id: 'g131_q3',
    number: 3,
    sectionId: 'sec_131',
    sectionTitle: 'Evaluación del Servicio',
    text: '¿Qué tan satisfecho(a) se encuentra con el tiempo de atención del servicio brindado?'
  },
  {
    id: 'g131_q4',
    number: 4,
    sectionId: 'sec_131',
    sectionTitle: 'Evaluación del Servicio',
    text: '¿Qué tan satisfecho(a) se encuentra con la competencia demostrada por el personal durante la prestación del servicio?'
  },
  {
    id: 'g131_q5',
    number: 5,
    sectionId: 'sec_131',
    sectionTitle: 'Evaluación del Servicio',
    text: '¿Qué tan satisfecho(a) se encuentra con la imparcialidad e independencia y la confidencialidad demostrada por el Organismo de Inspección del EGCM durante la prestación del servicio?'
  },
  {
    id: 'g131_q6',
    number: 6,
    sectionId: 'sec_131',
    sectionTitle: 'Evaluación del Servicio',
    text: '¿Qué tan satisfecho(a) se encuentra con la rapidez de respuesta del Organismo de Inspección del EGCM ante sus solicitudes iniciales?'
  },
  {
    id: 'g131_q7',
    number: 7,
    sectionId: 'sec_131',
    sectionTitle: 'Evaluación del Servicio',
    text: '¿Qué tan satisfecho(a) se encuentra con la confiabilidad de los resultados e informes emitidos por el Organismo de Inspección del EGCM?'
  },
  {
    id: 'g131_q8',
    number: 8,
    sectionId: 'sec_131',
    sectionTitle: 'Evaluación del Servicio',
    text: '¿Qué tan probable es que vuelva a solicitar los servicios del Organismo de Inspección del EGCM de SEDAPAL en futuras necesidades?'
  }
];

export function getQuestionsForFormat(format?: FormatType): Question[] {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('sedapal_custom_questions_v4');
      if (raw) {
        const map = JSON.parse(raw);
        if (map && map['GCFO0131'] && Array.isArray(map['GCFO0131']) && map['GCFO0131'].length > 0) {
          return map['GCFO0131'];
        }
      }
    }
  } catch (e) {
    console.error('Error reading custom questions from localStorage:', e);
  }
  return GCFO0131_QUESTIONS;
}

export const SAMPLE_SURVEY_RESPONSES: SurveyResponse[] = [
  {
    id: 'resp-104',
    formatType: 'GCFO0131',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    clientName: 'Ing. Rosa Paredes',
    companyName: 'Inversiones Inmobiliarias Nube',
    serviceOrderOrExpedient: 'ORD-2026-4421',
    inspectorName: 'Técnico Roberto Salas',
    serviceChannel: 'Correo',
    serviceProvidedType: 'Servicios de verificación acreditados / UVM (remesas de verificación posterior, verificación inicial)',
    averageScore: 8.8,
    lowScoreCount: 1,
    answers: [
      { questionId: 'g131_q1', questionNumber: 1, sectionId: 'sec_131', score: 9 },
      { questionId: 'g131_q2', questionNumber: 2, sectionId: 'sec_131', score: 9 },
      { questionId: 'g131_q3', questionNumber: 3, sectionId: 'sec_131', score: 9 },
      { questionId: 'g131_q4', questionNumber: 4, sectionId: 'sec_131', score: 7, motive: 'Hubo una ligera demora en la atención inicial de la remesa.' },
      { questionId: 'g131_q5', questionNumber: 5, sectionId: 'sec_131', score: 9 },
      { questionId: 'g131_q6', questionNumber: 6, sectionId: 'sec_131', score: 9 },
      { questionId: 'g131_q7', questionNumber: 7, sectionId: 'sec_131', score: 10 },
      { questionId: 'g131_q8', questionNumber: 8, sectionId: 'sec_131', score: 8, motive: 'El servicio técnico fue adecuado, aunque la coordinación de entrega se puede agilizar.' }
    ],
    generalComments: 'Buena atención del personal del Organismo de Inspección de Medidores.'
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
    serviceProvidedType: 'Servicios de Evaluación Metrológica de Medidores (evaluación de muestras, aguas subterráneas, control de calidad, etc.)',
    averageScore: 6.9,
    lowScoreCount: 3,
    answers: [
      { questionId: 'g131_q1', questionNumber: 1, sectionId: 'sec_131', score: 7, motive: 'Faltó mayor detalle en la información previa al servicio de evaluación metrológica.' },
      { questionId: 'g131_q2', questionNumber: 2, sectionId: 'sec_131', score: 8 },
      { questionId: 'g131_q3', questionNumber: 3, sectionId: 'sec_131', score: 8 },
      { questionId: 'g131_q4', questionNumber: 4, sectionId: 'sec_131', score: 5, motive: 'El tiempo de atención para la recepción de medidores superó lo coordinado.' },
      { questionId: 'g131_q5', questionNumber: 5, sectionId: 'sec_131', score: 6, motive: 'La entrega de los resultados emitidos demoró respecto al plazo indicado.' },
      { questionId: 'g131_q6', questionNumber: 6, sectionId: 'sec_131', score: 7, motive: 'Se sugiere capacitar al personal técnico en comunicación al cliente.' },
      { questionId: 'g131_q7', questionNumber: 7, sectionId: 'sec_131', score: 8 },
      { questionId: 'g131_q8', questionNumber: 8, sectionId: 'sec_131', score: 6, motive: 'El servicio cumplió parcialmente con las expectativas acordadas.' }
    ],
    generalComments: 'Sugerimos agilizar los plazos de entrega de los resultados emitidos.'
  }
];
