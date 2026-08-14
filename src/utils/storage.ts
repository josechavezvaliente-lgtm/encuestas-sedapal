import { createClient } from '@supabase/supabase-js';
import { SurveyResponse } from '../types';

// Configura tus credenciales de Supabase (o usa variables de entorno)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Guardar encuesta mapeando todos los campos completos
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

// Cargar todas las encuestas mapeándolas de vuelta al formato SurveyResponse
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

    if (!data) return [];

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

// Eliminar encuesta
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