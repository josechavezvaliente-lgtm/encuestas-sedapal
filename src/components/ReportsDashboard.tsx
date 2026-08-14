import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { FileText, Download, AlertCircle, CheckCircle2, Search, Filter, Printer, ArrowUpRight, Award, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { FormatType, FormatReport, SurveyResponse } from '../types';
import { generateFormatReport } from '../utils/storage';
import { exportReportToCSV, exportReportToPDF } from '../utils/export';
import { AiExecutiveSummary } from './AiExecutiveSummary';
import { SedapalLogo } from './SedapalLogo';

interface ReportsDashboardProps {
  responses: SurveyResponse[];
  selectedFormat: FormatType;
  setSelectedFormat: (format: FormatType) => void;
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({
  responses,
  selectedFormat,
  setSelectedFormat
}) => {
  const [motiveSearch, setMotiveSearch] = useState('');
  const [commentsSearch, setCommentsSearch] = useState('');
  const [selectedScoreFilter, setSelectedScoreFilter] = useState<number | 'all'>('all');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const activeReport = generateFormatReport('GCFO0131', responses, selectedServiceType);

  // Filter motives
  const filteredMotives = activeReport.allMotives.filter(m => {
    const matchesSearch =
      m.motive.toLowerCase().includes(motiveSearch.toLowerCase()) ||
      m.clientName.toLowerCase().includes(motiveSearch.toLowerCase()) ||
      m.questionText.toLowerCase().includes(motiveSearch.toLowerCase());
    
    const matchesScore = selectedScoreFilter === 'all' || m.score === selectedScoreFilter;

    return matchesSearch && matchesScore;
  });

  // Filter comments
  const filteredComments = (activeReport.allComments || []).filter(c => {
    return (
      c.comment.toLowerCase().includes(commentsSearch.toLowerCase()) ||
      c.clientName.toLowerCase().includes(commentsSearch.toLowerCase()) ||
      c.serviceOrder.toLowerCase().includes(commentsSearch.toLowerCase())
    );
  });

  // Chart data: per-question averages
  const questionChartData = activeReport.questionMetrics.map(qm => ({
    name: `Pregunta ${qm.questionNumber}`,
    shortName: `P${qm.questionNumber}`,
    fullName: `P${qm.questionNumber}: ${qm.text}`,
    promedio: qm.averageScore,
    csat: qm.csatPercentage,
    lowScoresCount: qm.lowScoresCount
  }));

  // Chart data: rating distribution (1 to 10)
  const scoreDistributionMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
  activeReport.questionMetrics.forEach(qm => {
    qm.scoreDistribution.forEach(sd => {
      scoreDistributionMap[sd.score] = (scoreDistributionMap[sd.score] || 0) + sd.count;
    });
  });

  const ratingHistData = Object.keys(scoreDistributionMap).map(sc => ({
    score: `Nota ${sc}`,
    valScore: Number(sc),
    count: scoreDistributionMap[Number(sc)],
    isLow: Number(sc) <= 8
  }));

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#0284c7', '#2563eb'];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      
      {/* Top Header & Export Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#E8F4FC] text-[#005DAA] text-xs font-extrabold px-2.5 py-0.5 rounded-md border border-[#B3D8F5]">
              Reporte Automatizado de Gestión SEDAPAL
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Actualizado en tiempo real
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Resultados para {activeReport.formatTitle}
          </h1>
          
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 bg-[#E8F4FC] text-[#003865] border border-[#B3D8F5] px-3 py-1 rounded-lg text-xs font-semibold">
              <Filter className="w-3.5 h-3.5 text-[#005DAA]" />
              <span>
                Tipo de Servicio Evaluado:{' '}
                <strong className="font-extrabold text-[#003865]">
                  {!selectedServiceType || selectedServiceType === 'all'
                    ? 'Todos los Tipos de Servicio (Consolidado General)'
                    : selectedServiceType}
                </strong>
              </span>
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1.5">
            Consolidado estadístico, distribución de respuestas, e índice de justificaciones para notas &le; 8.
          </p>
        </div>

        {/* SEDAPAL Logo & Export Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 hidden lg:block">
            <SedapalLogo variant="light" size="sm" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportReportToPDF(activeReport)}
              disabled={activeReport.totalSurveys === 0}
              className="flex items-center space-x-1.5 bg-[#005DAA] hover:bg-[#004880] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-sky-200" />
              <span>PDF Oficial SEDAPAL</span>
            </button>

            <button
              onClick={() => exportReportToCSV(activeReport, responses)}
              disabled={activeReport.totalSurveys === 0}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-700 shadow transition disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel / CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar by Tipo de Servicio Brindado */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span>Filtrar Reportes por Tipo de Servicio Brindado:</span>
          </label>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {activeReport.totalSurveys} encuesta(s) coincidente(s)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedServiceType('all')}
            className={`p-3 rounded-xl border text-left text-xs font-semibold transition flex items-center justify-between ${
              selectedServiceType === 'all'
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Todos los tipos de servicio</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
              selectedServiceType === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              Consolidado
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedServiceType('Servicios de Evaluación Metrológica de Medidores (evaluación de muestras, aguas subterráneas, control de calidad, etc.)')}
            className={`p-3 rounded-xl border text-left text-xs font-semibold transition flex items-center justify-between ${
              selectedServiceType === 'Servicios de Evaluación Metrológica de Medidores (evaluación de muestras, aguas subterráneas, control de calidad, etc.)'
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="line-clamp-2">Evaluación Metrológica de Medidores</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ml-1.5 ${
              selectedServiceType === 'Servicios de Evaluación Metrológica de Medidores (evaluación de muestras, aguas subterráneas, control de calidad, etc.)' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              Metrología
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedServiceType('Servicios de verificación acreditados / UVM (remesas de verificación posterior, verificación inicial)')}
            className={`p-3 rounded-xl border text-left text-xs font-semibold transition flex items-center justify-between ${
              selectedServiceType === 'Servicios de verificación acreditados / UVM (remesas de verificación posterior, verificación inicial)'
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="line-clamp-2">Verificación Acreditada / UVM</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ml-1.5 ${
              selectedServiceType === 'Servicios de verificación acreditados / UVM (remesas de verificación posterior, verificación inicial)' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              UVM
            </span>
          </button>
        </div>
      </div>

      {activeReport.totalSurveys === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            No se han registrado evaluaciones para el formato {selectedFormat}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Realice su primera evaluación o utilice la opción "Cargar Encuestas Demo" en el menú superior para visualizar inmediatamente los gráficos y reportes.
          </p>
        </div>
      ) : (
        <>
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Surveys */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Encuestas Evaluadas</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{activeReport.totalSurveys}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Respuestas totales registradas</p>
              </div>
              <div className="bg-sky-50 text-sky-600 p-3 rounded-2xl border border-sky-100">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Promedio General */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Puntaje Promedio</p>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <h3 className={`text-2xl font-black ${
                    activeReport.overallAverage >= 8 ? 'text-emerald-600' : activeReport.overallAverage >= 7 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {activeReport.overallAverage}
                  </h3>
                  <span className="text-xs text-slate-400 font-bold">/ 10</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Escala continua 1 a 10</p>
              </div>
              <div className={`p-3 rounded-2xl border ${
                activeReport.overallAverage >= 8
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                <Award className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: CSAT Index (% >= 8) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Índice CSAT (≥ 8)</p>
                <h3 className="text-2xl font-black text-sky-700 mt-1">{activeReport.csatIndex}%</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">% respuestas altamente satisfechas</p>
              </div>
              <div className="bg-sky-50 text-sky-600 p-3 rounded-2xl border border-sky-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Low Scores (< 8) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Observaciones (&lt; 8)</p>
                <h3 className={`text-2xl font-black mt-1 ${activeReport.totalLowScores > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {activeReport.totalLowScores}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Respuestas con motivo justificado</p>
              </div>
              <div className={`p-3 rounded-2xl border ${
                activeReport.totalLowScores > 0
                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* AI Executive Diagnostic */}
          <AiExecutiveSummary report={activeReport} />

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Promedio por Pregunta */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Puntaje Promedio por Pregunta
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Desempeño en escala de 1 a 10 para cada una de las {activeReport.questionMetrics.length} preguntas evaluadas
              </p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={questionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      interval={0}
                    />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val: number) => [`${val} / 10`, 'Promedio']}
                      labelFormatter={(label, items) => items[0]?.payload?.fullName || label}
                      contentStyle={{ borderRadius: '12px', borderColor: '#cbd5e1', fontSize: '12px' }}
                    />
                    <Bar dataKey="promedio" radius={[6, 6, 0, 0]} barSize={36}>
                      {questionChartData.map((entry, index) => (
                        <Cell
                          key={`qcell-${index}`}
                          fill={entry.promedio >= 8 ? '#0284c7' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Distribución de Frecuencia de Notas (1 a 10) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Distribución de Frecuencia de Valoraciones (1 a 10)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Notas en <span className="text-amber-600 font-bold">rojo/ámbar (&lt;8)</span> requirieron captura de motivo
              </p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingHistData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="valScore" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val: number) => [`${val} respuestas`, 'Frecuencia']}
                      labelFormatter={(label) => `Nota asignada: ${label}/10`}
                      contentStyle={{ borderRadius: '12px', borderColor: '#cbd5e1', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {ratingHistData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.valScore < 8 ? '#f59e0b' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Section: REGISTRO CONSOLIDADO DE MOTIVOS (< 8) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-md border border-amber-300">
                    Control de Calidad
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    Motivos de Bajas Calificaciones (&lt; 8)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Listado consolidado de justificaciones ingresadas obligatoriamente por los usuarios cuando asignaron puntaje menor a 8.
                </p>
              </div>

              {/* Search & Score Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={motiveSearch}
                    onChange={e => setMotiveSearch(e.target.value)}
                    placeholder="Buscar motivo, cliente..."
                    className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500 w-48 sm:w-60"
                  />
                </div>

                <select
                  value={selectedScoreFilter}
                  onChange={e => setSelectedScoreFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 bg-white"
                >
                  <option value="all">Todas las notas &le; 8</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sc => (
                    <option key={sc} value={sc}>Nota {sc}/10</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredMotives.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  No se encontraron observaciones de calificaciones menores o iguales a 8 con los filtros aplicados.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {activeReport.allMotives.length === 0
                    ? '¡Excelente! Todas las evaluaciones otorgaron notas de 9 o 10.'
                    : 'Intente borrar la búsqueda para ver todas las observaciones.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMotives.map((m, idx) => (
                  <div
                    key={`${m.responseId}_${m.questionNumber}_${idx}`}
                    className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-amber-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-xs">
                          P{m.questionNumber} • Nota: {m.score}/10
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {new Date(m.date).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-800 line-clamp-1">
                        {m.questionText}
                      </p>
                      <p className="text-[11px] text-slate-500 italic mb-2">
                        {m.sectionTitle}
                      </p>

                      <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs text-slate-800 italic leading-relaxed">
                        "{m.motive}"
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between border-t border-amber-200/60 pt-2">
                      <span>Cliente: <strong className="text-slate-900">{m.clientName}</strong></span>
                      <span className="text-sky-700 font-semibold">{m.sectionTitle.split('.')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: 2. COMENTARIOS Y SUGERENCIAS DE LOS CLIENTES */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-[#E8F4FC] text-[#005DAA] p-1.5 rounded-lg border border-[#B3D8F5]">
                    <MessageSquare className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    2. Comentarios y Sugerencias de los Clientes ({activeReport.allComments?.length || 0})
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Aspectos del servicio que los clientes sugieren mejorar en las encuestas evaluadas.
                </p>
              </div>

              {/* Comments Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en sugerencias o cliente..."
                  value={commentsSearch}
                  onChange={e => setCommentsSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 w-full sm:w-64 bg-slate-50"
                />
              </div>
            </div>

            {filteredComments.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  {(activeReport.allComments?.length || 0) === 0
                    ? 'No se registraron comentarios ni sugerencias en las encuestas de este período/filtro.'
                    : 'No se encontraron sugerencias con los términos de búsqueda actuales.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {(activeReport.allComments?.length || 0) === 0
                    ? 'Los comentarios adicionales ingresados en el campo 2 aparecerán aquí.'
                    : 'Intente buscar con otro nombre de cliente o palabra clave.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredComments.map((c, idx) => (
                  <div
                    key={`${c.responseId}_${idx}`}
                    className="bg-[#F4F9FD] border border-[#CDE5F8] rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-2xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="bg-[#005DAA] text-white font-bold text-[11px] px-2.5 py-0.5 rounded-md">
                          Doc: {c.serviceOrder}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {new Date(c.date).toLocaleDateString()}
                        </span>
                      </div>

                      {c.serviceType && (
                        <span className="inline-block text-[10px] font-semibold text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded-md">
                          {c.serviceType}
                        </span>
                      )}

                      <div className="bg-white p-3 rounded-xl border border-sky-200 text-xs text-slate-900 italic leading-relaxed shadow-2xs">
                        "{c.comment}"
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between border-t border-sky-200/60 pt-2">
                      <span>Cliente: <strong className="text-slate-900">{c.clientName}</strong></span>
                      {c.companyName && (
                        <span className="text-slate-400 text-[10px]">{c.companyName}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: DETALLE PREGUNTA POR PREGUNTA */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Detalle y Desglose por Pregunta ({activeReport.questionMetrics.length} Preguntas)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-3 w-12 text-center">N°</th>
                    <th className="py-3 px-3">Pregunta</th>
                    <th className="py-3 px-3">Sección</th>
                    <th className="py-3 px-3 text-center">Promedio</th>
                    <th className="py-3 px-3 text-center">CSAT (≥8)</th>
                    <th className="py-3 px-3 text-center">Alertas (&lt;8)</th>
                    <th className="py-3 px-3 text-right">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {activeReport.questionMetrics.map(qm => {
                    const isExpanded = expandedQuestionId === qm.questionId;

                    return (
                      <React.Fragment key={qm.questionId}>
                        <tr className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 text-center font-bold text-slate-900">
                            {qm.questionNumber}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800 max-w-xs sm:max-w-md">
                            {qm.text}
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-[11px]">
                            {qm.sectionTitle}
                          </td>
                          <td className="py-3 px-3 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded-lg text-xs ${
                              qm.averageScore >= 8 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {qm.averageScore} / 10
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-sky-700">
                            {qm.csatPercentage}%
                          </td>
                          <td className="py-3 px-3 text-center font-bold">
                            {qm.lowScoresCount > 0 ? (
                              <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                {qm.lowScoresCount}
                              </span>
                            ) : (
                              <span className="text-emerald-600">0</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setExpandedQuestionId(isExpanded ? null : qm.questionId)}
                              className="text-sky-600 hover:text-sky-800 font-semibold text-xs inline-flex items-center space-x-1"
                            >
                              <span>{isExpanded ? 'Ocultar' : 'Ver Distribución'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Distribution Row */}
                        {isExpanded && (
                          <tr className="bg-slate-50/90">
                            <td colSpan={7} className="p-4">
                              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                <h4 className="text-xs font-bold text-slate-800">
                                  Distribución de Notas (1-10) para Pregunta {qm.questionNumber}
                                </h4>

                                <div className="grid grid-cols-10 gap-1.5 text-center text-xs">
                                  {qm.scoreDistribution.map(sd => (
                                    <div
                                      key={sd.score}
                                      className={`p-2 rounded-lg border ${
                                        sd.score < 8 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
                                      }`}
                                    >
                                      <p className="text-[10px] text-slate-500 font-bold">{sd.score} pts</p>
                                      <p className={`font-black text-sm ${sd.score < 8 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                        {sd.count}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                {qm.motives.length > 0 && (
                                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                                    <p className="text-xs font-bold text-amber-800 flex items-center space-x-1">
                                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Motivos registrados para esta pregunta (&lt; 8):</span>
                                    </p>
                                    {qm.motives.map((m, mIdx) => (
                                      <div key={mIdx} className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 text-xs">
                                        <span className="font-bold text-slate-800">{m.clientName} ({m.score}/10): </span>
                                        <span className="text-slate-700 italic">"{m.motive}"</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
