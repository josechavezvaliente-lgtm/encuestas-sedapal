import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Building,
  Hash,
  User,
  Calendar,
  FileText,
  MessageSquare,
  Award,
  Layers,
  HelpCircle
} from 'lucide-react';
import { SurveyResponse, QuestionAnswer } from '../types';
import { getQuestionsForFormat, GCFO0131_TITLE } from '../data/initialQuestions';
import { SedapalLogo } from './SedapalLogo';

interface EditSurveyModalProps {
  response: SurveyResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: SurveyResponse) => Promise<void> | void;
}

export const EditSurveyModal: React.FC<EditSurveyModalProps> = ({
  response,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen || !response) return null;

  const questions = getQuestionsForFormat(response.formatType);

  // Form states initialized with existing response data
  const [clientName, setClientName] = useState(response.clientName || '');
  const [serviceOrder, setServiceOrder] = useState(response.serviceOrderOrExpedient || '');
  const [companyName, setCompanyName] = useState(response.companyName || '');
  const [inspectorName, setInspectorName] = useState(response.inspectorName || '');
  const [serviceType, setServiceType] = useState(response.serviceProvidedType || 'Evaluación Metrológica de Medidores de Agua Potable');
  const [createdAtDate, setCreatedAtDate] = useState(() => {
    try {
      const d = new Date(response.createdAt);
      return !isNaN(d.getTime()) ? d.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);
    } catch {
      return new Date().toISOString().slice(0, 16);
    }
  });

  const [scores, setScores] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    response.answers.forEach(a => {
      map[a.questionId] = a.score;
    });
    return map;
  });

  const [motives, setMotives] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    response.answers.forEach(a => {
      if (a.motive) {
        map[a.questionId] = a.motive;
      }
    });
    return map;
  });

  const [generalComments, setGeneralComments] = useState(response.generalComments || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Recalculate average live
  const answeredScores: number[] = Object.values(scores);
  const liveAverage = answeredScores.length > 0
    ? Number((answeredScores.reduce((a, b) => a + b, 0) / answeredScores.length).toFixed(1))
    : 0;

  const lowScoreCount = answeredScores.filter((s: number) => s <= 8).length;

  const handleScoreChange = (qId: string, scoreVal: number) => {
    setScores(prev => ({ ...prev, [qId]: scoreVal }));
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[`score_${qId}`];
      if (scoreVal > 8) {
        delete copy[`motive_${qId}`];
      }
      return copy;
    });
  };

  const handleMotiveChange = (qId: string, text: string) => {
    setMotives(prev => ({ ...prev, [qId]: text }));
    if (text.trim()) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[`motive_${qId}`];
        return copy;
      });
    }
  };

  const handleValidateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!clientName.trim()) {
      newErrors.clientName = 'La Razón Social o Equipo de SEDAPAL es obligatorio';
    }
    if (!serviceOrder.trim()) {
      newErrors.serviceOrder = 'El número de expediente / remesa es obligatorio';
    }

    // Validate all questions answered
    questions.forEach(q => {
      const s = scores[q.id];
      if (s === undefined || s === null) {
        newErrors[`score_${q.id}`] = `Falta responder la pregunta ${q.number}`;
      } else if (s <= 8) {
        const m = motives[q.id];
        if (!m || !m.trim()) {
          newErrors[`motive_${q.id}`] = `Es obligatorio justificar el motivo para la calificación de ${s}/10`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstKey = Object.keys(newErrors)[0];
      const el = document.getElementById(`edit_${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSaving(true);

    try {
      const updatedAnswers: QuestionAnswer[] = questions.map(q => ({
        questionId: q.id,
        questionNumber: q.number,
        sectionId: q.sectionId,
        score: scores[q.id] !== undefined ? scores[q.id] : 10,
        motive: (scores[q.id] !== undefined ? scores[q.id] : 10) <= 8 ? (motives[q.id]?.trim() || undefined) : undefined
      }));

      const updatedSurvey: SurveyResponse = {
        ...response,
        clientName: clientName.trim(),
        serviceOrderOrExpedient: serviceOrder.trim(),
        companyName: companyName.trim() || undefined,
        inspectorName: inspectorName.trim() || undefined,
        serviceProvidedType: serviceType.trim() || undefined,
        createdAt: new Date(createdAtDate).toISOString(),
        answers: updatedAnswers,
        averageScore: liveAverage,
        lowScoreCount: lowScoreCount,
        generalComments: generalComments.trim() || undefined
      };

      await onSave(updatedSurvey);
      setShowSuccessToast(true);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error al guardar la edición de la encuesta:', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
      >
        {/* Header */}
        <div className="bg-[#003865] text-white p-5 sm:p-6 flex items-center justify-between border-b border-sky-900 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="bg-white p-1.5 rounded-xl hidden sm:block">
              <SedapalLogo variant="light" size="sm" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-[#0099DD] text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
                  MODO EDICIÓN
                </span>
                <span className="text-xs text-sky-200 font-mono">
                  ID: {response.id.slice(0, 8)}...
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Editar Encuesta: {GCFO0131_TITLE}
              </h3>
              <p className="text-xs text-sky-200/90">
                Modifique los campos, calificaciones o motivos y guarde los cambios en el sistema central.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-sky-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Summary Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Promedio recalculado:</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                liveAverage >= 9 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                liveAverage >= 7 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                'bg-red-100 text-red-800 border border-red-300'
              }`}>
                {liveAverage} / 10
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Observadas (&le;8):</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                lowScoreCount > 0 ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {lowScoreCount}
              </span>
            </div>
          </div>

          <span className="text-slate-400 text-[11px]">
            * Los cambios actualizarán métricas, reportes y descargas en tiempo real.
          </span>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleValidateAndSubmit} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          
          {/* I. DATOS IDENTIFICATORIOS */}
          <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-[#005DAA] font-bold text-sm border-b border-slate-200 pb-2.5">
              <Building className="w-4 h-4 text-[#005DAA]" />
              <span>I. DATOS IDENTIFICATORIOS DE LA INSPECCIÓN / CLIENTE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1) Razón Social / Equipo */}
              <div id="edit_clientName" className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  1) Razón Social o Equipo de SEDAPAL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => {
                      setClientName(e.target.value);
                      if (e.target.value.trim()) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.clientName;
                          return copy;
                        });
                      }
                    }}
                    placeholder="Ej: Gerencia de Servicios Comerciales / Ing. Juan Pérez"
                    className={`w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border ${
                      errors.clientName ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-200 focus:border-sky-500'
                    } focus:outline-none`}
                  />
                </div>
                {errors.clientName && (
                  <p className="text-[11px] text-red-600 font-semibold">{errors.clientName}</p>
                )}
              </div>

              {/* 2) Número de expediente / Remesa */}
              <div id="edit_serviceOrder" className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  2) Número de expediente / Remesa / Documento <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={serviceOrder}
                    onChange={e => {
                      setServiceOrder(e.target.value);
                      if (e.target.value.trim()) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.serviceOrder;
                          return copy;
                        });
                      }
                    }}
                    placeholder="Ej: EXP-2026-00491 / REM-881"
                    className={`w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border ${
                      errors.serviceOrder ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-200 focus:border-sky-500'
                    } focus:outline-none`}
                  />
                </div>
                {errors.serviceOrder && (
                  <p className="text-[11px] text-red-600 font-semibold">{errors.serviceOrder}</p>
                )}
              </div>

              {/* 3) Tipo de Servicio Brindado */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  3) Tipo de Servicio Brindado
                </label>
                <select
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Evaluación Metrológica de Medidores de Agua Potable">
                    Evaluación Metrológica de Medidores de Agua Potable
                  </option>
                  <option value="Verificación Inicial / Posterior UVM">
                    Verificación Inicial / Posterior UVM
                  </option>
                  <option value="Inspección Técnica de Calidad y Muestreo">
                    Inspección Técnica de Calidad y Muestreo
                  </option>
                  <option value="Servicio Especial de Contrastación In Situ">
                    Servicio Especial de Contrastación In Situ
                  </option>
                </select>
              </div>

              {/* 4) Empresa o Contratista (Opcional) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  4) Empresa / Contratista <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Ej: Consorcio Agua Lima SAC"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 5) Inspector / Personal */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  5) Inspector / Personal Responsable <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={e => setInspectorName(e.target.value)}
                  placeholder="Ej: Lic. Marcos Rivas (UVM)"
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* 6) Fecha y Hora de Registro */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  6) Fecha y Hora de Registro
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={createdAtDate}
                    onChange={e => setCreatedAtDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 1. CUESTIONARIO DE PREGUNTAS (ESCALA 1-10) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-[#005DAA]" />
                <span>1. Cuestionario de Evaluación ({questions.length} preguntas)</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Escala 1 (Muy Insatisfecho) a 10 (Muy Satisfecho)
              </span>
            </div>

            <div className="space-y-4">
              {questions.map(q => {
                const currentScore = scores[q.id];
                const hasScore = currentScore !== undefined;
                const isLow = hasScore && currentScore <= 8;
                const scoreErr = errors[`score_${q.id}`];
                const motiveErr = errors[`motive_${q.id}`];

                return (
                  <div
                    key={q.id}
                    id={`edit_score_${q.id}`}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all ${
                      scoreErr || motiveErr ? 'border-red-400 ring-2 ring-red-100 bg-red-50/20' : 'border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start space-x-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#005DAA] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {q.number}
                        </span>
                        <div>
                          {q.sectionTitle && (
                            <span className="text-[10px] uppercase font-bold text-[#0099DD] tracking-wide block">
                              {q.sectionTitle}
                            </span>
                          )}
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                            {q.text}
                          </p>
                        </div>
                      </div>

                      {/* Selected Pill Badge */}
                      {hasScore && (
                        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isLow ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}>
                          {currentScore} / 10
                        </span>
                      )}
                    </div>

                    {/* Scale Buttons 1-10 */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-1.5 px-1">
                        <span>1 = Muy Insatisfecho</span>
                        <span>5 = Regular</span>
                        <span>10 = Muy Satisfecho</span>
                      </div>

                      <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => {
                          const isSelected = currentScore === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleScoreChange(q.id, val)}
                              className={`py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                                isSelected
                                  ? val >= 9
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400 scale-105'
                                    : val >= 7
                                    ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300 scale-105'
                                    : 'bg-red-600 text-white shadow-sm ring-2 ring-red-400 scale-105'
                                  : 'bg-slate-50 hover:bg-sky-50 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>

                      {scoreErr && (
                        <p className="text-[11px] text-red-600 font-semibold mt-1.5 flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{scoreErr}</span>
                        </p>
                      )}
                    </div>

                    {/* Motive for <= 8 */}
                    {isLow && (
                      <div id={`edit_motive_${q.id}`} className="mt-4 pt-3 border-t border-amber-200/80 bg-amber-50/70 p-3.5 rounded-xl">
                        <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center space-x-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Justificación del motivo de la calificación ({currentScore}/10) <strong className="text-red-600">*</strong></span>
                        </label>
                        <p className="text-[11px] text-amber-800 mb-2">
                          Las calificaciones &le; 8 requieren especificar la justificación o causa.
                        </p>
                        <textarea
                          rows={2}
                          value={motives[q.id] || ''}
                          onChange={e => handleMotiveChange(q.id, e.target.value)}
                          placeholder="Indique el motivo de la calificación..."
                          className={`w-full p-2.5 text-xs bg-white rounded-xl border ${
                            motiveErr ? 'border-red-500 ring-2 ring-red-200' : 'border-amber-300 focus:border-amber-500'
                          } focus:outline-none`}
                        />
                        {motiveErr && (
                          <p className="text-[11px] text-red-600 font-semibold mt-1">{motiveErr}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. COMENTARIOS Y SUGERENCIAS */}
          <div className="bg-[#E8F4FC] p-5 sm:p-6 rounded-2xl border border-[#B3D8F5] space-y-3">
            <div className="flex items-center space-x-2 text-[#003865] font-bold text-xs sm:text-sm">
              <MessageSquare className="w-4 h-4 text-[#005DAA]" />
              <span>2. COMENTARIOS Y SUGERENCIAS: ¿Qué aspectos del servicio considera que deberían mejorarse?</span>
            </div>
            <p className="text-xs text-slate-600">
              Campo abierto para sugerencias de mejora emitidas por el cliente evaluador.
            </p>
            <textarea
              rows={3}
              value={generalComments}
              onChange={e => setGeneralComments(e.target.value)}
              placeholder="Escriba aquí los aspectos a mejorar o comentarios generales..."
              className="w-full p-3 text-xs bg-white rounded-xl border border-sky-200 focus:border-sky-500 focus:outline-none shadow-2xs"
            />
          </div>

          {/* Agradecimiento Institucional al Final */}
          <div className="bg-gradient-to-r from-sky-50 via-[#E8F4FC] to-blue-50/60 p-4 rounded-2xl border border-[#B3D8F5] text-center shadow-2xs">
            <p className="text-xs sm:text-sm font-bold text-[#003865]">
              “Muchas gracias por haber llenado nuestra encuesta, su opinión es importante para nosotros”.
            </p>
          </div>

          {/* Errors Banner if any */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-300 p-4 rounded-xl text-red-800 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">No se puede guardar la edición:</p>
                <p>Por favor revise los campos y motivos resaltados en rojo antes de guardar.</p>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#005DAA] hover:bg-[#004780] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <span>Guardando cambios...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Success Toast */}
        <AnimatePresence>
          {showSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold z-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>¡Encuesta actualizada exitosamente!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
