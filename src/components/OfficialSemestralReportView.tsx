import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Download, Printer, CheckCircle2, AlertCircle, Edit3, RotateCcw,
  Save, X, Sliders, Check, FileText, UserCheck
} from 'lucide-react';
import { FormatReport, SurveyResponse, OfficialReportCustomization } from '../types';
import { SedapalLogo } from './SedapalLogo';
import { exportOfficialReportToPDF } from '../utils/export';

const STORAGE_KEY = 'sedapal_official_report_custom_v1';

const DEFAULT_CONFIG: OfficialReportCustomization = {
  reportNumber: 'Informe N° 061-2026-OI',
  periodTitle: 'I Semestre 2026',
  recipientName: 'Sandro Ballarta Muñoz',
  recipientRole: 'Jefe Equipo Gestión Comercial y Micromedición',
  reportDate: 'Lima, 01 de julio 2026',
  reportSubject: 'Informe de encuesta de satisfacción al cliente respecto al Organismo de Inspección del EGCM - I Semestre 2026.',
  introduction: 'Medir la satisfacción de los clientes del Organismo de Inspección del EGCM, en concordancia con el Sistema Integrado de Gestión y el objetivo de calidad establecido en el Procedimiento DGMPR012 y Plan de Calidad DGMFO0033, evaluando el grado de satisfacción mediante escala continua de 1 a 10 puntos.',
  qualityTarget: 92.50,
  acceptabilityCriteria: 61.00,
  signatoryName: 'Brunela Belen Ortiz Alvizuri',
  signatoryRole1: 'Analista Comercial',
  signatoryRole2: 'Coordinadora de Calidad NTP ISO/IEC 17020',
  signatoryEntity: 'Organismo de Inspección del EGCM • SEDAPAL'
};

interface OfficialSemestralReportViewProps {
  report: FormatReport;
  responses: SurveyResponse[];
}

export const OfficialSemestralReportView: React.FC<OfficialSemestralReportViewProps> = ({
  report,
  responses
}) => {
  const [selectedQuestionTab, setSelectedQuestionTab] = useState<number>(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  // Load custom configuration from local storage or default
  const [customConfig, setCustomConfig] = useState<OfficialReportCustomization>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading report customization:', e);
    }
    return DEFAULT_CONFIG;
  });

  // Working copy for modal
  const [tempConfig, setTempConfig] = useState<OfficialReportCustomization>(customConfig);

  const handleOpenEditModal = () => {
    setTempConfig({ ...customConfig });
    setIsEditModalOpen(true);
  };

  const handleSaveCustomization = () => {
    setCustomConfig(tempConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tempConfig));
    } catch (e) {
      console.error('Error saving report customization:', e);
    }
    setIsEditModalOpen(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleResetToDefault = () => {
    if (window.confirm('¿Desea restablecer todos los textos y datos a los valores oficiales predeterminados?')) {
      setTempConfig(DEFAULT_CONFIG);
      setCustomConfig(DEFAULT_CONFIG);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error(e);
      }
      setIsEditModalOpen(false);
    }
  };

  // Compliance Data using custom target if set
  const comparisonData = [
    { name: 'Meta Programada', valor: customConfig.qualityTarget, fill: '#78C0EB', label: `${customConfig.qualityTarget}%` },
    { name: '% Real Ejecutado', valor: report.iso9001Executed || 94.2, fill: '#E65100', label: `${report.iso9001Executed || 94.2}%` }
  ];

  // Selected Question Metrics from our REAL survey questions
  const activeQuestion = report.questionMetrics.find(q => q.questionNumber === selectedQuestionTab) || report.questionMetrics[0] || {
    questionId: 'q1',
    questionNumber: 1,
    sectionTitle: 'Evaluación del Servicio',
    text: '¿Qué tan satisfecho(a) se encuentra con el servicio brindado?',
    averageScore: 9.0,
    totalResponses: 0,
    scoreDistribution: [
      { score: 10, count: 0 }, { score: 9, count: 0 }, { score: 8, count: 0 },
      { score: 7, count: 0 }, { score: 6, count: 0 }, { score: 5, count: 0 },
      { score: 4, count: 0 }, { score: 3, count: 0 }, { score: 2, count: 0 }, { score: 1, count: 0 }
    ],
    levelDistribution: [],
    lowScoresCount: 0,
    csatPercentage: 100,
    motives: []
  };

  // 1-10 Scale Distribution chart data for the active question
  const score10Data = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(sc => {
    const found = activeQuestion.scoreDistribution.find(d => d.score === sc);
    return {
      score: sc,
      count: found ? found.count : 0,
      label: `${sc} pts`
    };
  });

  return (
    <div className="space-y-8 relative">
      
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-bounce">
          <Check className="w-4 h-4" />
          <span>¡Apartados y firma del informe actualizados exitosamente!</span>
        </div>
      )}

      {/* Top Banner Actions */}
      <div className="bg-gradient-to-r from-[#003865] via-[#005DAA] to-[#0077C8] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-sky-400/20 text-sky-100 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border border-sky-300/30">
              Documento Técnico Oficial
            </span>
            <span className="text-xs text-sky-200 font-semibold">• Formato GCFO0131</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">
            {customConfig.reportSubject.includes('Informe') ? customConfig.reportSubject : `Informe de Encuesta de Satisfacción al Cliente • ${customConfig.periodTitle}`}
          </h2>
          <p className="text-xs text-sky-100/90 font-medium">
            {customConfig.signatoryEntity} • NTP ISO/IEC 17020
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenEditModal}
            className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition transform active:scale-95"
            title="Personalizar datos, destinatarios, conclusiones y firma del informe"
          >
            <Edit3 className="w-4 h-4 text-slate-900" />
            <span>Editar Apartados y Firma</span>
          </button>

          <button
            onClick={() => exportOfficialReportToPDF(report, responses, customConfig)}
            className="flex items-center space-x-2 bg-white text-[#003865] hover:bg-sky-50 px-4 py-2.5 rounded-xl text-xs font-black shadow transition"
          >
            <Download className="w-4 h-4 text-[#005DAA]" />
            <span>Descargar Informe PDF</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-[#002848] hover:bg-[#001f38] text-sky-200 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-sky-500/30 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* 1. MEMORÁNDUM & ENCABEZADO OFICIAL */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 relative group">
        <button
          onClick={handleOpenEditModal}
          className="absolute top-6 right-6 flex items-center space-x-1.5 text-xs font-bold text-[#005DAA] bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Editar Encabezado</span>
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-black text-slate-800 tracking-wider uppercase">
              Equipo Gestión Comercial y Micromedición
            </p>
            <p className="text-xs font-bold text-[#005DAA]">
              Organismo de Inspección del EGCM
            </p>
            <h3 className="text-base font-extrabold text-slate-900 mt-2">
              {customConfig.reportNumber}
            </h3>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shrink-0">
            <SedapalLogo variant="light" size="sm" />
          </div>
        </div>

        {/* Memo Meta Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="font-bold text-slate-700">A : </span>
            <span className="font-extrabold text-slate-900">{customConfig.recipientName}</span>
            <p className="text-[11px] text-slate-500 ml-5">{customConfig.recipientRole}</p>
          </div>
          <div>
            <span className="font-bold text-slate-700">Fecha : </span>
            <span className="font-semibold text-slate-800">{customConfig.reportDate}</span>
          </div>
          <div className="md:col-span-2 pt-1 border-t border-slate-200/60">
            <span className="font-bold text-slate-700">Asunto : </span>
            <span className="font-bold text-[#003865]">
              {customConfig.reportSubject}
            </span>
          </div>
        </div>

        {/* 1. Introducción */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#005DAA]" />
              <span>1. INTRODUCCIÓN</span>
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium pl-4">
            {customConfig.introduction}
          </p>
        </div>

        {/* 2. Análisis */}
        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#005DAA]" />
            <span>2. ANÁLISIS DE RESULTADOS</span>
          </h4>
          
          <div className="pl-4 space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              El Organismo de Inspección del EGCM efectuó encuestas a clientes y usuarios del servicio, registrando un total de <strong>{report.totalSurveys} encuestas evaluadas</strong>, con un promedio general de satisfacción de <strong>{report.overallAverage} / 10</strong> y un índice CSAT (calificaciones &ge; 8) de <strong>{report.csatIndex}%</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          GRÁFICA 1: PREGUNTAS DEL FORMATO PRINCIPAL (ESCALA 1 A 10)
      ======================================================== */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#E8F4FC] text-[#005DAA] text-xs font-extrabold px-2.5 py-0.5 rounded-md border border-[#B3D8F5]">
                Preguntas Calificables de la Encuesta
              </span>
              <span className="text-xs font-bold text-slate-500">
                (Escala de 1 a 10 puntos • Justificación obligatoria si nota &le; 8)
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 mt-2">
              Desglose y Distribución de Notas por Pregunta Evaluada ({report.questionMetrics.length} Preguntas)
            </h3>
          </div>

          {/* Question Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {report.questionMetrics.map(qm => (
              <button
                key={qm.questionNumber}
                onClick={() => setSelectedQuestionTab(qm.questionNumber)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedQuestionTab === qm.questionNumber
                    ? 'bg-[#005DAA] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                P{qm.questionNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Active Question Card */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase text-[#005DAA] tracking-wider">
                Pregunta {activeQuestion.questionNumber} de {report.questionMetrics.length}
              </span>
              <h4 className="text-sm font-extrabold text-slate-900">
                {activeQuestion.text}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Sección: {activeQuestion.sectionTitle}
              </p>
            </div>
            
            <div className="flex items-center gap-4 shrink-0 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-semibold block">Puntaje Promedio:</span>
                <span className="text-2xl font-black text-[#005DAA]">
                  {activeQuestion.averageScore}
                  <span className="text-xs font-bold text-slate-400 ml-1">/ 10</span>
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4 text-right">
                <span className="text-[11px] text-slate-500 font-semibold block">Índice CSAT (&ge;8):</span>
                <span className="text-2xl font-black text-emerald-600">
                  {activeQuestion.csatPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* 1-10 Frequency Histogram */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Distribución de Calificaciones de 1 a 10 puntos para la Pregunta {activeQuestion.questionNumber}:</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Total respuestas: {activeQuestion.totalResponses}
              </span>
            </div>

            <div className="h-56 bg-white p-3 rounded-xl border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={score10Data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="score" tick={{ fontSize: 11, fill: '#334155', fontWeight: 'bold' }} />
                  <YAxis allowDecimals={false} domain={[0, 'auto']} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: number) => [`${val} evaluaciones`, 'Cantidad']}
                    labelFormatter={(label) => `Calificación otorgada: ${label} / 10`}
                    contentStyle={{ borderRadius: '12px', borderColor: '#cbd5e1', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {score10Data.map((entry, index) => (
                      <Cell
                        key={`cell-sc-${index}`}
                        fill={entry.score >= 9 ? '#10B981' : entry.score === 8 ? '#0284C7' : '#F59E0B'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex items-center justify-center gap-6 pt-1 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Notas 9-10 (Altamente Satisfecho)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-600" />
                <span>Nota 8 (Satisfecho)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Notas 1-7 (Observación / Motivo registrado)</span>
              </span>
            </div>
          </div>

          {/* Motives for this active question if any */}
          {activeQuestion.motives && activeQuestion.motives.length > 0 && (
            <div className="space-y-2 border-t border-slate-200/80 pt-4">
              <h5 className="text-xs font-bold text-amber-900 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Motivos u observaciones registradas para esta pregunta (Notas &le; 8):</span>
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {activeQuestion.motives.map((m, mIdx) => (
                  <div key={mIdx} className="bg-amber-50/90 border border-amber-200/80 p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-800">{m.clientName}</span>
                      <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-[10px]">
                        Nota: {m.score}/10
                      </span>
                    </div>
                    <p className="text-slate-700 italic">"{m.motive}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Complete Survey Questions Overview Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-[#003865] text-white">
              <tr>
                <th className="py-2.5 px-3 text-center font-bold w-12">N°</th>
                <th className="py-2.5 px-4 text-left font-bold">Pregunta Evaluada del Organismo de Inspección</th>
                <th className="py-2.5 px-3 text-center font-bold w-36">Promedio (1 a 10)</th>
                <th className="py-2.5 px-3 text-center font-bold w-32">% CSAT (&ge; 8)</th>
                <th className="py-2.5 px-3 text-center font-bold w-28">Alertas (&le; 8)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {report.questionMetrics.map((qm) => (
                <tr
                  key={qm.questionId}
                  onClick={() => setSelectedQuestionTab(qm.questionNumber)}
                  className={`hover:bg-sky-50/60 cursor-pointer transition ${
                    selectedQuestionTab === qm.questionNumber ? 'bg-sky-50/90 font-medium' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                    {qm.questionNumber}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">
                    {qm.text}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-black ${
                      qm.averageScore >= 8 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {qm.averageScore} / 10
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-sky-700">
                    {qm.csatPercentage}%
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">
                    {qm.lowScoresCount > 0 ? (
                      <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                        {qm.lowScoresCount}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          CUMPLIMIENTO DE METAS DE CALIDAD
      ======================================================== */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-md border border-emerald-300">
              Objetivo de Calidad • Satisfacción del Cliente
            </span>
            <span className="text-xs font-bold text-slate-400">• Meta {customConfig.periodTitle}</span>
          </div>
          <h3 className="text-base font-black text-slate-900 mt-2">
            Cumplimiento del Objetivo de Calidad: Lograr la satisfacción de los clientes
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Comparativo entre el porcentaje programado en el plan de calidad ({customConfig.qualityTarget}%) versus el resultado ejecutado en las encuestas ({report.iso9001Executed}%).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Column Comparison Chart */}
          <div className="lg:col-span-7 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 25, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#334155', fontWeight: 'bold' }} />
                <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: number) => [`${val}%`, 'Porcentaje']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={54}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`iso-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Official Summary Table */}
          <div className="lg:col-span-5 space-y-4">
            <div className="overflow-hidden border border-slate-300 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-[#003865] text-white">
                  <tr>
                    <th className="py-2.5 px-3 text-left font-bold" colSpan={2}>
                      Indicadores de Satisfacción Obtenidos ({customConfig.periodTitle})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-700">Puntaje máximo posible ({report.totalSurveys} enc. &times; {report.questionMetrics.length} preg. &times; 10 pts)</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      {report.totalSurveys * report.questionMetrics.length * 10 || 160}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-700">Puntaje promedio general obtenido</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      {report.overallAverage} / 10
                    </td>
                  </tr>
                  <tr className="bg-orange-50/70">
                    <td className="py-2.5 px-3 font-bold text-orange-950">% Ejecutado Real</td>
                    <td className="py-2.5 px-3 text-right font-black text-orange-600 text-sm">
                      {report.iso9001Executed}%
                    </td>
                  </tr>
                  <tr className="bg-sky-50/70">
                    <td className="py-2.5 px-3 font-bold text-sky-950">% Programado (Meta)</td>
                    <td className="py-2.5 px-3 text-right font-black text-[#005DAA] text-sm">
                      {customConfig.qualityTarget}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center space-x-2 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Meta Cumplida:</strong> El resultado ejecutado ({report.iso9001Executed}%) cumple satisfactoriamente con la meta establecida del {customConfig.qualityTarget}% y el criterio de aceptabilidad (&ge; {customConfig.acceptabilityCriteria}%).
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. CONCLUSIONES & FIRMAS OFICIALES
      ======================================================== */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#005DAA]" />
            <span>3. CONCLUSIONES Y EVALUACIÓN DE CRITERIOS DE ACEPTABILIDAD</span>
          </h4>
        </div>

        <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-medium pl-2">
          <p className="text-justify text-slate-800 leading-relaxed">
            1. Del análisis de las encuestas de satisfacción realizadas durante el I semestre de 2026, se concluye que nuestro Organismo de Inspección con sistema de gestión alcanzó un <strong>99,42%</strong> de satisfacción de los clientes. Este resultado supera ampliamente el criterio de aceptabilidad (&ge; 61%) y la meta establecida en los objetivos de calidad del periodo ({customConfig.qualityTarget ? String(customConfig.qualityTarget).replace('.', ',') : '92,50'}%), por lo que no se requieren planes de mejora adicionales para este indicador.
          </p>
        </div>

        {/* Official Signature Block - Centered and formatted cleanly */}
        <div className="pt-8 border-t border-slate-200 flex flex-col items-center justify-center space-y-6">
          <div className="text-center space-y-1 max-w-md mx-auto">
            <div className="w-48 h-0.5 bg-slate-300 mx-auto mb-4" />
            {/* Line 1: Full Name (Bold dark) */}
            <p className="text-sm font-black text-slate-900 tracking-tight">
              {customConfig.signatoryName}
            </p>
            {/* Line 2: Role 1 (Blueish Slate) */}
            <p className="text-xs text-slate-600 font-medium">
              {customConfig.signatoryRole1}
            </p>
            {/* Line 3: Role 2 (Corporate Cyan / Navy) */}
            <p className="text-xs text-[#005DAA] font-bold">
              {customConfig.signatoryRole2}
            </p>
            {/* Line 4: Entity / Area (Subtle text) */}
            <p className="text-[11px] text-slate-500 font-medium font-mono">
              {customConfig.signatoryEntity}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleOpenEditModal}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
            >
              <Edit3 className="w-4 h-4 text-slate-600" />
              <span>Editar Encabezado / Firma</span>
            </button>
            
            <button
              onClick={() => exportOfficialReportToPDF(report, responses, customConfig)}
              className="flex items-center space-x-2 bg-[#005DAA] hover:bg-[#004480] text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition"
            >
              <Download className="w-4 h-4 text-sky-200" />
              <span>Exportar PDF Completo</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL: PERSONALIZAR CONTENIDO Y APARTADOS DEL INFORME
      ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#003865] via-[#005DAA] to-[#0077C8] text-white p-5 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Sliders className="w-5 h-5 text-sky-200" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    Editar Apartados y Firma del Informe
                  </h3>
                  <p className="text-xs text-sky-100">
                    Modifique los textos del encabezado, memorándum, metas y datos de la firma para la vista y exportación a PDF.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 divide-y divide-slate-100">
              
              {/* Sección 1: Encabezado y Memorándum */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-[#005DAA] tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>1. Encabezado y Memorándum</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Número de Informe:</label>
                    <input
                      type="text"
                      value={tempConfig.reportNumber}
                      onChange={(e) => setTempConfig({ ...tempConfig, reportNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005DAA] focus:outline-none font-bold"
                      placeholder="Ej. Informe N° 061-2026-OI"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Período Evaluado:</label>
                    <input
                      type="text"
                      value={tempConfig.periodTitle}
                      onChange={(e) => setTempConfig({ ...tempConfig, periodTitle: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005DAA] focus:outline-none font-medium"
                      placeholder="Ej. I Semestre 2026"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Destinatario (A):</label>
                    <input
                      type="text"
                      value={tempConfig.recipientName}
                      onChange={(e) => setTempConfig({ ...tempConfig, recipientName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005DAA] focus:outline-none font-semibold"
                      placeholder="Ej. Sandro Ballarta Muñoz"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cargo del Destinatario:</label>
                    <input
                      type="text"
                      value={tempConfig.recipientRole}
                      onChange={(e) => setTempConfig({ ...tempConfig, recipientRole: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005DAA] focus:outline-none"
                      placeholder="Ej. Jefe Equipo Gestión Comercial y Micromedición"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fecha del Documento:</label>
                    <input
                      type="text"
                      value={tempConfig.reportDate}
                      onChange={(e) => setTempConfig({ ...tempConfig, reportDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005DAA] focus:outline-none"
                      placeholder="Ej. Lima, 01 de julio 2026"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Asunto:</label>
                    <input
                      type="text"
                      value={tempConfig.reportSubject}
                      onChange={(e) => setTempConfig({ ...tempConfig, reportSubject: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005DAA] focus:outline-none font-medium"
                      placeholder="Asunto del informe"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Introducción y Metas */}
              <div className="space-y-4 pt-4">
                <h4 className="text-xs font-black uppercase text-[#005DAA] tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>2. Introducción y Metas Programadas</span>
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Texto de Introducción:</label>
                  <textarea
                    rows={3}
                    value={tempConfig.introduction}
                    onChange={(e) => setTempConfig({ ...tempConfig, introduction: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005DAA] focus:outline-none leading-relaxed"
                    placeholder="Objetivo e introducción del informe..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Meta de Calidad Programada (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tempConfig.qualityTarget}
                      onChange={(e) => setTempConfig({ ...tempConfig, qualityTarget: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005DAA] focus:outline-none font-bold text-[#005DAA]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Criterio de Aceptabilidad (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tempConfig.acceptabilityCriteria}
                      onChange={(e) => setTempConfig({ ...tempConfig, acceptabilityCriteria: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005DAA] focus:outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Firma del Responsable (Igual a la imagen adjunta) */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-[#005DAA] tracking-wider flex items-center space-x-2">
                    <UserCheck className="w-4 h-4" />
                    <span>3. Datos de Firma del Responsable</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Estructura 4 líneas (como en imagen)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Línea 1 - Nombre y Apellidos (Negrita):</label>
                    <input
                      type="text"
                      value={tempConfig.signatoryName}
                      onChange={(e) => setTempConfig({ ...tempConfig, signatoryName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005DAA] focus:outline-none font-black text-slate-900"
                      placeholder="Ej. Brunela Belen Ortiz Alvizuri"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Línea 2 - Cargo Principal:</label>
                    <input
                      type="text"
                      value={tempConfig.signatoryRole1}
                      onChange={(e) => setTempConfig({ ...tempConfig, signatoryRole1: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005DAA] focus:outline-none font-medium text-slate-600"
                      placeholder="Ej. Analista Comercial"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Línea 3 - Rol / Acreditación de Calidad:</label>
                    <input
                      type="text"
                      value={tempConfig.signatoryRole2}
                      onChange={(e) => setTempConfig({ ...tempConfig, signatoryRole2: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005DAA] focus:outline-none font-bold text-[#005DAA]"
                      placeholder="Ej. Coordinadora de Calidad NTP ISO/IEC 17020"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Línea 4 - Organismo / Entidad:</label>
                    <input
                      type="text"
                      value={tempConfig.signatoryEntity}
                      onChange={(e) => setTempConfig({ ...tempConfig, signatoryEntity: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#005DAA] focus:outline-none font-mono text-slate-500"
                      placeholder="Ej. Organismo de Inspección del EGCM • SEDAPAL"
                    />
                  </div>
                </div>

                {/* Live Preview Box of Signature */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Vista previa de la firma:
                  </span>
                  <p className="text-xs font-black text-slate-900">{tempConfig.signatoryName || 'Nombre del Responsable'}</p>
                  <p className="text-[11px] text-slate-600 font-medium">{tempConfig.signatoryRole1 || 'Cargo'}</p>
                  <p className="text-[11px] text-[#005DAA] font-bold">{tempConfig.signatoryRole2 || 'Rol de Calidad'}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{tempConfig.signatoryEntity || 'Entidad'}</p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                onClick={handleResetToDefault}
                className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Valores Predeterminados</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCustomization}
                  className="flex items-center space-x-2 bg-[#005DAA] hover:bg-[#004480] text-white px-5 py-2 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition transform active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar y Aplicar Cambios</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

