import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Bot, CheckCircle, AlertCircle } from 'lucide-react';
import { FormatReport } from '../types';

interface AiExecutiveSummaryProps {
  report: FormatReport;
}

export const AiExecutiveSummary: React.FC<AiExecutiveSummaryProps> = ({ report }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAiSummary = async () => {
    if (report.totalSurveys === 0) {
      setSummary('No hay suficientes respuestas registradas para generar un análisis ejecutivo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formatType: report.formatType,
          formatTitle: report.formatTitle,
          totalSurveys: report.totalSurveys,
          overallAverage: report.overallAverage,
          csatIndex: report.csatIndex,
          sectionMetrics: report.sectionMetrics,
          motives: report.allMotives
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.summary) {
          setSummary(data.summary);
          return;
        }
      }
      throw new Error('Respuesta del servidor no válida');
    } catch (err: any) {
      console.warn('Falling back to local client-side executive summary:', err);
      const fallbackMotives = report.allMotives && report.allMotives.length > 0 
        ? report.allMotives.map(m => `• P${m.questionNumber || 'Obs'} (${m.score}/10): "${m.motive}"`).join('\n')
        : '• No se registran motivos de baja calificación para este periodo.';

      setSummary(
        `### 📊 Diagnóstico Ejecutivo de Calidad (${report.formatType})\n\n` +
        `- **Total Evaluaciones:** ${report.totalSurveys}\n` +
        `- **Puntaje Promedio General:** ${report.overallAverage} / 10\n` +
        `- **Índice CSAT (Notas ≥ 8):** ${report.csatIndex}%\n\n` +
        `#### 🔍 Hallazgos y Diagnóstico Principal:\n` +
        (report.overallAverage >= 8.5
          ? `El servicio del formato **${report.formatTitle} (${report.formatType})** mantiene un desempeño sobresaliente.`
          : `Se identifican oportunidades de atención prioritaria. Se han registrado ${report.allMotives?.length || 0} observaciones justificadas para calificaciones menores o iguales a 8.`) +
        `\n\n#### 💬 Observaciones y Motivos Reportados (≤ 8):\n` +
        fallbackMotives +
        `\n\n#### 📋 Plan de Acción Recomendado (ISO 17020 / ISO 9001):\n` +
        `1. **Atención y Seguimiento:** Optimizar tiempos de respuesta e información directa al cliente.\n` +
        `2. **Comunicación Directa:** Reforzar el canal corporativo para absolución de dudas previas.\n` +
        `3. **Monitoreo Continuo:** Evaluaciones quincenales a los ítems con observaciones registradas.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiSummary();
  }, [report.formatType, report.totalSurveys]);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-lg border border-slate-700/80">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-sky-500/20 text-sky-400 p-2 rounded-xl border border-sky-400/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Diagnóstico e Insights Automatizados por IA</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-medium">
                Gemini 2.5
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Análisis ejecutivo cualitativo y cuantitativo para {report.formatType}
            </p>
          </div>
        </div>

        <button
          onClick={fetchAiSummary}
          disabled={loading}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-600 text-xs font-semibold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar Diagnóstico</span>
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center space-y-3">
          <Bot className="w-8 h-8 text-sky-400 animate-bounce mx-auto" />
          <p className="text-xs text-slate-300 font-medium">
            Procesando tendencias y motivos de insatisfacción para {report.formatType}...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="prose prose-invert prose-xs max-w-none text-slate-200 text-xs leading-relaxed space-y-3">
          {summary ? (
            <div className="whitespace-pre-line font-sans">
              {summary}
            </div>
          ) : (
            <p className="text-slate-400">Haga clic en actualizar para generar el informe.</p>
          )}
        </div>
      )}
    </div>
  );
};
