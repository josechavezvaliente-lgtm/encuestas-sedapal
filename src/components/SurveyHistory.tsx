import React, { useState } from 'react';
import { Search, Trash2, Eye, Pencil, FileText, Calendar, User, Building, Hash, AlertCircle, CheckCircle2, X, Filter, Download, FileSpreadsheet, MessageSquare } from 'lucide-react';
import { SurveyResponse, FormatType } from '../types';
import { getQuestionsForFormat } from '../data/initialQuestions';
import { exportSingleSurveyToPDF, exportSingleSurveyToExcel, exportAllSurveysToExcel } from '../utils/export';
import { SedapalLogo } from './SedapalLogo';
import { EditSurveyModal } from './EditSurveyModal';

interface SurveyHistoryProps {
  responses: SurveyResponse[];
  onDeleteResponse: (id: string) => void;
  onUpdateResponse?: (updated: SurveyResponse) => Promise<void> | void;
  selectedFormatFilter: FormatType | 'ALL';
  setSelectedFormatFilter: (fmt: FormatType | 'ALL') => void;
}

export const SurveyHistory: React.FC<SurveyHistoryProps> = ({
  responses,
  onDeleteResponse,
  onUpdateResponse,
  selectedFormatFilter,
  setSelectedFormatFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [editingResponse, setEditingResponse] = useState<SurveyResponse | null>(null);

  const filtered = responses.filter(r => {
    const matchesFormat = selectedFormatFilter === 'ALL' || r.formatType === selectedFormatFilter;

    let matchesService = true;
    if (serviceFilter === 'METROLOGIA') {
      matchesService = !!r.serviceProvidedType && r.serviceProvidedType.includes('Metrológica');
    } else if (serviceFilter === 'UVM') {
      matchesService = !!r.serviceProvidedType && (
        r.serviceProvidedType.includes('verificación') ||
        r.serviceProvidedType.includes('UVM')
      );
    }

    const matchesSearch =
      r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.serviceOrderOrExpedient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.companyName && r.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.inspectorName && r.inspectorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.serviceProvidedType && r.serviceProvidedType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.generalComments && r.generalComments.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFormat && matchesService && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Search & Filter Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 hidden sm:block">
            <SedapalLogo variant="light" size="sm" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#E8F4FC] text-[#005DAA] text-xs font-extrabold px-2 py-0.5 rounded-md border border-[#B3D8F5]">
                SEDAPAL • Historial GCFO0131
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Historial de Evaluaciones Registradas
            </h1>
            <p className="text-xs text-slate-500">
              Monitoree, descargue en PDF/Excel e inspeccione individualmente cada encuesta ingresada.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Export All Excel Button */}
          {filtered.length > 0 && (
            <button
              onClick={() => exportAllSurveysToExcel(filtered, 'Historial_Evaluaciones_SEDAPAL_GCFO0131')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition shadow-xs"
              title="Descargar listado completo filtrado en formato Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Todo (Excel)</span>
            </button>
          )}

          {/* Service Type Filter Dropdown */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 cursor-pointer appearance-none"
            >
              <option value="ALL">Todos los Tipos de Servicio</option>
              <option value="METROLOGIA">Evaluación Metrológica de Medidores</option>
              <option value="UVM">Verificación Acreditada / UVM</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, expediente, servicio..."
              className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 w-52 sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* History Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">
            No se encontraron encuestas registradas
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Intente cambiar el filtro de formato o el término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tipo de Servicio</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Razón Social / Equipo</th>
                  <th className="py-3.5 px-4">Expediente / Remesa</th>
                  <th className="py-3.5 px-4 text-center">Promedio</th>
                  <th className="py-3.5 px-4 text-center">Motivos (&le;8)</th>
                  <th className="py-3.5 px-4">2. Sugerencias / Comentarios</th>
                  <th className="py-3.5 px-4 text-center">Descargar Ficha</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-medium">
                      {r.serviceProvidedType ? (
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-block whitespace-nowrap ${
                            r.serviceProvidedType.includes('Metrológica')
                              ? 'bg-sky-100 text-sky-900 border border-sky-200'
                              : 'bg-teal-100 text-teal-900 border border-teal-200'
                          }`}
                          title={r.serviceProvidedType}
                        >
                          {r.serviceProvidedType.includes('Metrológica')
                            ? 'Evaluación Metrológica'
                            : r.serviceProvidedType.includes('verificación') || r.serviceProvidedType.includes('UVM')
                            ? 'Verificación UVM'
                            : r.serviceProvidedType}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">No especificado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{r.clientName}</div>
                      {r.companyName && (
                        <div className="text-[11px] text-slate-400">{r.companyName}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {r.serviceOrderOrExpedient}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                        r.averageScore >= 8 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.averageScore} / 10
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {r.lowScoreCount > 0 ? (
                        <span className="inline-flex items-center justify-center space-x-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-lg border border-rose-200 text-xs font-bold whitespace-nowrap shadow-2xs">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{r.lowScoreCount} {r.lowScoreCount === 1 ? 'observada' : 'observadas'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center space-x-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-200 text-xs font-semibold whitespace-nowrap shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>0 observadas</span>
                        </span>
                      )}
                    </td>
                    {/* 2. Sugerencias / Comentarios Column */}
                    <td className="py-3.5 px-4">
                      {r.generalComments ? (
                        <button
                          type="button"
                          onClick={() => setSelectedResponse(r)}
                          className="flex items-start space-x-1.5 p-2 rounded-xl bg-sky-50 hover:bg-sky-100/90 border border-sky-200/80 transition text-left max-w-[240px] group shadow-2xs cursor-pointer"
                          title="Clic para ver comentario completo"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#005DAA] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                          <span className="text-[11px] text-slate-800 font-medium italic line-clamp-2 leading-snug">
                            "{r.generalComments}"
                          </span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Sin sugerencias</span>
                      )}
                    </td>
                    {/* Individual Download Options (PDF & Excel) */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center space-x-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <button
                          onClick={() => exportSingleSurveyToPDF(r)}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 rounded-md border border-slate-200 hover:border-rose-300 transition text-[11px] font-bold shadow-2xs"
                          title="Descargar Ficha individual en PDF"
                        >
                          <FileText className="w-3.5 h-3.5 text-rose-600" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => exportSingleSurveyToExcel(r)}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 rounded-md border border-slate-200 hover:border-emerald-300 transition text-[11px] font-bold shadow-2xs"
                          title="Descargar Ficha individual en Excel (.xlsx)"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Excel</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedResponse(r)}
                        className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition border border-sky-200"
                        title="Ver detalle de la evaluación"
                      >
                        <Eye className="w-4 h-4 text-sky-600" />
                      </button>
                      <button
                        onClick={() => setEditingResponse(r)}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition border border-amber-200"
                        title="Editar campos y respuestas de la encuesta"
                      >
                        <Pencil className="w-4 h-4 text-amber-600" />
                      </button>
                      <button
                        onClick={() => onDeleteResponse(r.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition border border-red-200"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-0.5 rounded-md">
                  Formato {selectedResponse.formatType}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Detalle de Evaluación #{selectedResponse.serviceOrderOrExpedient}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {/* Edit Button in Detail Modal */}
                <button
                  onClick={() => {
                    const toEdit = selectedResponse;
                    setSelectedResponse(null);
                    setEditingResponse(toEdit);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-300 transition"
                  title="Editar los datos y respuestas de esta evaluación"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-600" />
                  <span>Editar</span>
                </button>
                {/* Download Actions in Modal Header */}
                <button
                  onClick={() => exportSingleSurveyToPDF(selectedResponse)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition"
                  title="Descargar Ficha en PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => exportSingleSurveyToExcel(selectedResponse)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition"
                  title="Descargar Ficha en Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Metadata */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="col-span-2 bg-white p-2.5 rounded-lg border border-slate-200">
                <p className="text-slate-400 font-medium">Tipo de Servicio Brindado:</p>
                <p className="font-bold text-sky-950 mt-0.5">{selectedResponse.serviceProvidedType || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">1) Razón Social / Equipo SEDAPAL:</p>
                <p className="font-bold text-slate-800">{selectedResponse.clientName}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">2) N° Expediente / Remesa / Doc. Ref.:</p>
                <p className="font-bold text-slate-800">{selectedResponse.serviceOrderOrExpedient}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Fecha de registro:</p>
                <p className="font-bold text-slate-800">{new Date(selectedResponse.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Puntaje Promedio:</p>
                <p className="font-black text-sky-700 text-sm">{selectedResponse.averageScore} / 10</p>
              </div>
            </div>

            {/* Answers List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Respuestas a las Preguntas del Cuestionario
              </h4>

              {getQuestionsForFormat(selectedResponse.formatType).map(q => {
                const ans = selectedResponse.answers.find(a => a.questionId === q.id || a.questionNumber === q.number);
                const score = ans ? ans.score : 0;
                const isLow = score <= 8;

                return (
                  <div key={q.id} className={`p-3 rounded-xl border text-xs ${
                    isLow ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">
                        Pregunta {q.number}
                      </span>
                      <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
                        isLow ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {score} / 10
                      </span>
                    </div>

                    <p className="text-slate-700 mb-2">{q.text}</p>

                    {isLow && ans?.motive && (
                      <div className="bg-white p-2.5 rounded-lg border border-amber-300 text-amber-900 text-xs italic">
                        <strong>Motivo reportado:</strong> "{ans.motive}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sección 2: Comentarios y Sugerencias (Aspectos a mejorar) */}
            <div className="bg-[#E8F4FC]/80 p-4 rounded-xl border border-[#B3D8F5] text-xs space-y-2.5">
              <div className="flex items-center space-x-2 text-[#003865] font-bold">
                <MessageSquare className="w-4 h-4 text-[#005DAA]" />
                <span className="uppercase tracking-wide text-xs">
                  2. Comentarios y sugerencias: ¿Qué aspectos del servicio considera que deberían mejorarse?
                </span>
              </div>
              
              {selectedResponse.generalComments ? (
                <div className="bg-white p-3.5 rounded-xl border border-sky-200 text-slate-800 italic leading-relaxed shadow-2xs">
                  "{selectedResponse.generalComments}"
                </div>
              ) : (
                <div className="bg-white/70 p-3 rounded-lg border border-slate-200 text-slate-400 italic text-xs">
                  El cliente no registró comentarios ni sugerencias adicionales en esta evaluación.
                </div>
              )}
            </div>

            {/* Agradecimiento Institucional al Final de la Ficha */}
            <div className="bg-gradient-to-r from-sky-50 via-[#E8F4FC] to-blue-50/60 p-3.5 rounded-xl border border-[#B3D8F5] text-center">
              <p className="text-xs sm:text-[13px] font-bold text-[#003865]">
                “Muchas gracias por haber llenado nuestra encuesta, su opinión es importante para nosotros”.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportSingleSurveyToPDF(selectedResponse)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Descargar Ficha PDF</span>
                </button>
                <button
                  onClick={() => exportSingleSurveyToExcel(selectedResponse)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Descargar Ficha Excel (.xlsx)</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const toEdit = selectedResponse;
                    setSelectedResponse(null);
                    setEditingResponse(toEdit);
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editar Evaluación</span>
                </button>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="px-5 py-2 bg-slate-200 text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-300 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Edit Survey Modal */}
      {editingResponse && (
        <EditSurveyModal
          response={editingResponse}
          isOpen={!!editingResponse}
          onClose={() => setEditingResponse(null)}
          onSave={async (updated) => {
            if (onUpdateResponse) {
              await onUpdateResponse(updated);
            }
            setEditingResponse(null);
          }}
        />
      )}

    </div>
  );
};
