import React, { useState } from 'react';
import { Search, Trash2, Eye, FileText, Calendar, User, Building, Hash, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { SurveyResponse, FormatType } from '../types';
import { getQuestionsForFormat } from '../data/initialQuestions';

interface SurveyHistoryProps {
  responses: SurveyResponse[];
  onDeleteResponse: (id: string) => void;
  selectedFormatFilter: FormatType | 'ALL';
  setSelectedFormatFilter: (fmt: FormatType | 'ALL') => void;
}

export const SurveyHistory: React.FC<SurveyHistoryProps> = ({
  responses,
  onDeleteResponse,
  selectedFormatFilter,
  setSelectedFormatFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);

  const filtered = responses.filter(r => {
    const matchesFormat = selectedFormatFilter === 'ALL' || r.formatType === selectedFormatFilter;
    const matchesSearch =
      r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.serviceOrderOrExpedient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.companyName && r.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.inspectorName && r.inspectorName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFormat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Search & Filter Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Historial de Evaluaciones Registradas
          </h1>
          <p className="text-xs text-slate-500">
            Monitoree individualmente cada encuesta ingresada para los formatos GCFO0131 y GCFO0192.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Format Filter */}
          <select
            value={selectedFormatFilter}
            onChange={e => setSelectedFormatFilter(e.target.value as any)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 bg-white font-medium"
          >
            <option value="ALL">Todos los Formatos ({responses.length})</option>
            <option value="GCFO0192">Formato GCFO0192</option>
            <option value="GCFO0131">Formato GCFO0131</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, expediente..."
              className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 w-52 sm:w-64"
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
                  <th className="py-3.5 px-4">Formato</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Cliente / Empresa</th>
                  <th className="py-3.5 px-4">Expediente / Orden</th>
                  <th className="py-3.5 px-4">Inspector</th>
                  <th className="py-3.5 px-4 text-center">Promedio</th>
                  <th className="py-3.5 px-4 text-center">Motivos (&le;8)</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span className="bg-sky-50 text-sky-700 px-2.5 py-1 rounded-md border border-sky-100">
                        {r.formatType}
                      </span>
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
                    <td className="py-3.5 px-4 text-slate-600">
                      {r.inspectorName || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                        r.averageScore >= 8 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.averageScore} / 10
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {r.lowScoreCount > 0 ? (
                        <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 text-[11px]">
                          {r.lowScoreCount} observadas
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedResponse(r)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4 text-sky-600" />
                      </button>
                      <button
                        onClick={() => onDeleteResponse(r.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
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
              <button
                onClick={() => setSelectedResponse(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Metadata */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Cliente:</p>
                <p className="font-bold text-slate-800">{selectedResponse.clientName}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Empresa:</p>
                <p className="font-bold text-slate-800">{selectedResponse.companyName || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Inspector a cargo:</p>
                <p className="font-bold text-slate-800">{selectedResponse.inspectorName || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Canal de atención:</p>
                <p className="font-bold text-slate-800">{selectedResponse.serviceChannel}</p>
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
                Respuestas a las Preguntas
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

            {selectedResponse.generalComments && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-800 mb-1">Comentarios Generales del Cliente:</p>
                <p className="text-slate-600 italic">"{selectedResponse.generalComments}"</p>
              </div>
            )}

            <div className="text-right border-t border-slate-100 pt-3">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
