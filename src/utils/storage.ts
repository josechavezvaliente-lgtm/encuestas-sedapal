// Guardar encuesta asegurando el mapeo completo de campos hacia Supabase
export async function saveSurvey(survey: SurveyResponse): Promise<boolean> {
  try {
    const { error } = await supabase.from('evaluaciones').insert([
      {
        id: survey.id,
        formato: survey.formatType || 'GCFO0131',
        created_at: survey.createdAt || new Date().toISOString(),
        nombre_cliente: survey.clientName || 'Sin nombre',
        empresa: survey.companyName || (survey as any).empresa || null,
        expediente: survey.serviceOrderOrExpedient || (survey as any).expediente || (survey as any).serviceOrder || null,
        inspector: survey.inspectorName || (survey as any).inspector || null,
        canal_servicio: survey.serviceChannel || (survey as any).canalServicio || 'Presencial',
        tipo_servicio: survey.serviceProvidedType || (survey as any).tipoServicio || (survey as any).serviceType || 'No especificado',
        puntaje: survey.averageScore || 0,
        respuestas: survey.answers || [],
        comentarios: survey.generalComments || (survey as any).comentarios || null,
        notas_bajas: survey.lowScoreCount || 0,
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