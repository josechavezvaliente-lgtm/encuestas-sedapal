import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { AlertCircle, CheckCircle2, Send, FileText, User, Building, Hash, Radio, MessageSquare, Info } from 'lucide-react';
import { FormatType, Question, SurveyResponse, QuestionAnswer } from '../types';
import { getQuestionsForFormat, GCFO0192_TITLE, GCFO0131_TITLE } from '../data/initialQuestions';

interface SurveyFormProps {
  format: FormatType;
  setFormat: (format: FormatType) => void;
  onSaveSurvey: (response: SurveyResponse) => void;
  onGoToReports: () => void;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({
  format,
  setFormat,
  onSaveSurvey,
  onGoToReports
}) => {
  const questions = getQuestionsForFormat(format);
  const title = format === 'GCFO0192' ? GCFO0192_TITLE : GCFO0131_TITLE;

  // Metadata form states
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [serviceOrder, setServiceOrder] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [serviceChannel, setServiceChannel] = useState<'Correo' | 'Teléfono' | 'WhatsApp' | 'Presencial' | 'Portal Web'>('Correo');
  const [generalComments, setGeneralComments] = useState('');

  // Scores state: key = question.id, value = score (1-10)
  const [scores, setScores] = useState<Record<string, number>>({});
  // Motives state: key = question.id, value = string
  const [motives, setMotives] = useState<Record<string, string>>({});

  // Validation errors
  const [errors, setErrors] = useState<{
    clientName?: string;
    serviceOrder?: string;
    unansweredQuestions?: string[];
    missingMotives?: string[];
  }>({});

  const [submittedSuccess, setSubmittedSuccess] = useState<SurveyResponse | null>(null);

  // Group questions by section
  const sectionsMap = new Map<string, Question[]>();
  questions.forEach(q => {
    if (!sectionsMap.has(q.sectionTitle)) {
      sectionsMap.set(q.sectionTitle, []);
    }
    sectionsMap.get(q.sectionTitle)!.push(q);
  });

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(scores).length;
  const progressPercentage = Math.round((answeredCount / totalQuestions) * 100);

  const handleScoreSelect = (questionId: string, score: number) => {
    setScores(prev => ({ ...prev, [questionId]: score }));
    
    // Clear motive if score is updated to > 8 (only 9 and 10 do not require motive)
    if (score > 8) {
      setMotives(prev => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    }

    // Clear error for this question if any
    setErrors(prev => {
      const copy = { ...prev };
      if (copy.unansweredQuestions) {
        copy.unansweredQuestions = copy.unansweredQuestions.filter(id => id !== questionId);
      }
      if (copy.missingMotives) {
        copy.missingMotives = copy.missingMotives.filter(id => id !== questionId);
      }
      return copy;
    });
  };

  const handleMotiveChange = (questionId: string, value: string) => {
    setMotives(prev => ({ ...prev, [questionId]: value }));
    if (value.trim()) {
      setErrors(prev => {
        const copy = { ...prev };
        if (copy.missingMotives) {
          copy.missingMotives = copy.missingMotives.filter(id => id !== questionId);
        }
        return copy;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    if (!clientName.trim()) {
      newErrors.clientName = 'Por favor ingrese el nombre del cliente o usuario.';
    }
    if (!serviceOrder.trim()) {
      newErrors.serviceOrder = 'Por favor ingrese el número de Expediente u Orden de Servicio.';
    }

    // Check unanswered questions
    const unanswered = questions.filter(q => !scores[q.id]).map(q => q.id);
    if (unanswered.length > 0) {
      newErrors.unansweredQuestions = unanswered;
    }

    // Check missing motives for scores <= 8
    const missingMotiveIds: string[] = [];
    questions.forEach(q => {
      const s = scores[q.id];
      if (s && s <= 8) {
        if (!motives[q.id] || !motives[q.id].trim()) {
          missingMotiveIds.push(q.id);
        }
      }
    });

    if (missingMotiveIds.length > 0) {
      newErrors.missingMotives = missingMotiveIds;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstUnanswered = unanswered[0] || missingMotiveIds[0];
      if (firstUnanswered) {
        const el = document.getElementById(`q_box_${firstUnanswered}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    // Build question answers array
    let sumScore = 0;
    let lowCount = 0;
    const answersList: QuestionAnswer[] = questions.map(q => {
      const sc = scores[q.id];
      sumScore += sc;
      if (sc <= 8) lowCount += 1;
      return {
        questionId: q.id,
        questionNumber: q.number,
        sectionId: q.sectionId,
        score: sc,
        motive: sc <= 8 ? motives[q.id]?.trim() : undefined
      };
    });

    const averageScore = Number((sumScore / totalQuestions).toFixed(1));

    const responseObj: SurveyResponse = {
      id: `resp_${Date.now()}`,
      formatType: format,
      createdAt: new Date().toISOString(),
      clientName: clientName.trim(),
      companyName: companyName.trim() || undefined,
      serviceOrderOrExpedient: serviceOrder.trim(),
      inspectorName: inspectorName.trim() || undefined,
      serviceChannel,
      answers: answersList,
      generalComments: generalComments.trim() || undefined,
      averageScore,
      lowScoreCount: lowCount
    };

    onSaveSurvey(responseObj);
    setSubmittedSuccess(responseObj);

    // Trigger confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleReset = () => {
    setClientName('');
    setCompanyName('');
    setServiceOrder('');
    setInspectorName('');
    setScores({});
    setMotives({});
    setGeneralComments('');
    setErrors({});
    setSubmittedSuccess(null);
  };

  if (submittedSuccess) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            ¡Evaluación Registrada con Éxito!
          </h2>
          <p className="text-slate-600 text-sm max-w-lg mx-auto mb-6">
            La encuesta para el formato <span className="font-semibold text-sky-700">{format}</span> se ha guardado en el sistema de gestión de calidad de SEDAPAL.
          </p>

          {/* Results Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 text-left max-w-md mx-auto space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Cliente:</span>
              <span className="font-semibold text-slate-800">{submittedSuccess.clientName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Expediente/Orden:</span>
              <span className="font-semibold text-slate-800">{submittedSuccess.serviceOrderOrExpedient}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Puntaje Promedio:</span>
              <span className={`font-bold text-base ${submittedSuccess.averageScore >= 8 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {submittedSuccess.averageScore} / 10
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Alertas (&lt; 8 con motivo):</span>
              <span className="font-semibold text-slate-800">
                {submittedSuccess.lowScoreCount > 0 ? (
                  <span className="text-red-600 font-bold">{submittedSuccess.lowScoreCount} preguntas</span>
                ) : (
                  <span className="text-emerald-600 font-medium">Sin observaciones</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Registrar Otra Evaluación</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Format Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
            Formato de Encuesta
          </span>
          <h1 className="text-lg font-bold text-slate-900 mt-1">
            {title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Escala de evaluación del 1 al 10 (10 = Más alto, 1 = Más bajo). Si selecciona un valor menor a 8, deberá justificar el motivo.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => { setFormat('GCFO0192'); handleReset(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              format === 'GCFO0192' ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GCFO0192
          </button>
          <button
            type="button"
            onClick={() => { setFormat('GCFO0131'); handleReset(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              format === 'GCFO0131' ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GCFO0131
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section A: Datos del Servicio y Cliente */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-5">
            <User className="w-5 h-5 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              I. Datos Identificatorios de la Inspección / Cliente
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Nombre del Cliente */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nombre del Cliente / Evaluador <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={clientName}
                  onChange={e => {
                    setClientName(e.target.value);
                    if (errors.clientName) setErrors(prev => ({ ...prev, clientName: undefined }));
                  }}
                  placeholder="Ej: Ing. Juan Carlos Pérez"
                  className={`w-full pl-9 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
                    errors.clientName
                      ? 'border-red-300 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:ring-sky-200 focus:border-sky-500'
                  }`}
                />
              </div>
              {errors.clientName && (
                <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.clientName}</p>
              )}
            </div>

            {/* Empresa */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Empresa / Razón Social <span className="text-slate-400 text-[10px] font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Ej: Consorcio Agua Lima S.A.C."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
                />
              </div>
            </div>

            {/* N° Expediente / Orden de Servicio */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                N° de Expediente / Orden de Servicio <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={serviceOrder}
                  onChange={e => {
                    setServiceOrder(e.target.value);
                    if (errors.serviceOrder) setErrors(prev => ({ ...prev, serviceOrder: undefined }));
                  }}
                  placeholder="Ej: EXP-2026-0912 / ORD-3341"
                  className={`w-full pl-9 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
                    errors.serviceOrder
                      ? 'border-red-300 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:ring-sky-200 focus:border-sky-500'
                  }`}
                />
              </div>
              {errors.serviceOrder && (
                <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.serviceOrder}</p>
              )}
            </div>

            {/* Nombre del Inspector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Inspector / Evaluador a Cargo <span className="text-slate-400 text-[10px] font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={e => setInspectorName(e.target.value)}
                placeholder="Ej: Ing. Fernando Quispe"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
              />
            </div>

            {/* Canal de Atención */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1.5">
                Canal Principal de Comunicación / Servicio
              </label>
              <div className="flex flex-wrap gap-2">
                {(['Correo', 'Teléfono', 'WhatsApp', 'Presencial', 'Portal Web'] as const).map(channel => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => setServiceChannel(channel)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center space-x-1.5 ${
                      serviceChannel === channel
                        ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Radio className={`w-3.5 h-3.5 ${serviceChannel === channel ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span>{channel}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section Progress Sticky Bar */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="bg-sky-500 text-white p-2 rounded-lg font-bold">
              {answeredCount}/{totalQuestions}
            </div>
            <div>
              <p className="font-bold">Progreso de la Cuestionario</p>
              <p className="text-slate-400 text-[11px]">
                {answeredCount === totalQuestions
                  ? '¡Todas las preguntas han sido respondidas!'
                  : `Faltan ${totalQuestions - answeredCount} preguntas por responder`}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-48 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Validation Alert Header if errors present */}
        {(errors.unansweredQuestions || errors.missingMotives) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 flex items-start space-x-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-900">Por favor verifique los siguientes aspectos:</h4>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {errors.unansweredQuestions && errors.unansweredQuestions.length > 0 && (
                  <li>Hay {errors.unansweredQuestions.length} pregunta(s) sin calificar.</li>
                )}
                {errors.missingMotives && errors.missingMotives.length > 0 && (
                  <li>Debe ingresar el motivo de la calificación para las preguntas marcadas (valoración menor o igual a 8).</li>
                )}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Section B: Questions */}
        {Array.from(sectionsMap.entries()).map(([secTitle, secQuestions]) => (
          <div key={secTitle} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>{secTitle}</span>
              <span className="text-xs text-slate-400 font-normal lowercase">({secQuestions.length} preguntas)</span>
            </h3>

            <div className="space-y-6">
              {secQuestions.map(q => {
                const currentScore = scores[q.id];
                const isLowScore = currentScore !== undefined && currentScore <= 8;
                const isUnansweredErr = errors.unansweredQuestions?.includes(q.id);
                const isMissingMotiveErr = errors.missingMotives?.includes(q.id);

                return (
                  <div
                    key={q.id}
                    id={`q_box_${q.id}`}
                    className={`p-5 rounded-2xl border transition-all ${
                      isMissingMotiveErr || isUnansweredErr
                        ? 'border-red-300 bg-red-50/20 shadow-xs'
                        : isLowScore
                        ? 'border-amber-200 bg-amber-50/20'
                        : currentScore !== undefined
                        ? 'border-slate-200 bg-slate-50/30'
                        : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start space-x-3">
                        <span className="bg-slate-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          {q.number}
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                          {q.text}
                        </p>
                      </div>

                      {/* Selected Badge */}
                      {currentScore !== undefined && (
                        <div className="shrink-0">
                          {isLowScore ? (
                            <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-300">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>{currentScore}/10 - Requiere motivo</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{currentScore}/10 - Satisfactorio</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Scale 1 to 10 Pills */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1.5 px-0.5">
                        <span>1 = Muy Insatisfecho</span>
                        <span>5 = Regular</span>
                        <span>10 = Muy Satisfecho</span>
                      </div>

                      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => {
                          const isSelected = currentScore === val;
                          let btnStyle = 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';

                          if (isSelected) {
                            if (val <= 8) {
                              btnStyle = 'bg-amber-600 text-white border-amber-700 font-extrabold shadow-md scale-105';
                            } else {
                              btnStyle = 'bg-emerald-600 text-white border-emerald-700 font-extrabold shadow-md scale-105';
                            }
                          } else if (val <= 8) {
                            btnStyle = 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300';
                          } else {
                            btnStyle = 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300';
                          }

                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleScoreSelect(q.id, val)}
                              className={`py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all text-center focus:outline-none ${btnStyle}`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CONDITIONAL MOTIVE FIELD (<= 8) */}
                    <AnimatePresence>
                      {isLowScore && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden"
                        >
                          <div className={`p-4 rounded-xl border ${
                            isMissingMotiveErr ? 'bg-red-50 border-red-300' : 'bg-amber-50/80 border-amber-200'
                          }`}>
                            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs mb-1.5">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>
                                Motivo de la calificación ({currentScore}/10) <span className="text-red-600">* Obligatorio</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-800 mb-2">
                              Al haber asignado una puntuación igual o menor a 8, especifique por favor las razones o aspectos a mejorar para el reporte de calidad:
                            </p>
                            <textarea
                              rows={2}
                              value={motives[q.id] || ''}
                              onChange={e => handleMotiveChange(q.id, e.target.value)}
                              placeholder="Ej: Hubo demoras en la entrega del certificado, falta de respuesta rápida por WhatsApp, etc."
                              className={`w-full p-2.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                                isMissingMotiveErr
                                  ? 'border-red-400 focus:ring-red-200'
                                  : 'border-amber-300 focus:ring-amber-200 focus:border-amber-500'
                              }`}
                            />
                            {isMissingMotiveErr && (
                              <p className="text-red-600 text-[11px] font-semibold mt-1">
                                Es necesario detallar el motivo para valoraciones menores o iguales a 8.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Section C: Comentarios y sugerencias */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 mb-2">
            <MessageSquare className="w-5 h-5 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              2. Comentarios y sugerencias <span className="text-slate-400 text-[10px] font-normal tracking-normal lowercase">(Opcional)</span>
            </h3>
          </div>

          <label className="block text-sm font-bold text-slate-900 leading-snug">
            ¿Qué aspectos del servicio considera que deberían mejorarse?
          </label>

          <textarea
            rows={3}
            value={generalComments}
            onChange={e => setGeneralComments(e.target.value)}
            placeholder="Escriba aquí los aspectos a mejorar, comentarios o sugerencias adicionales..."
            className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500 bg-slate-50/50"
          />
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-4 py-2 hover:bg-slate-100 rounded-xl transition"
          >
            Limpiar Formulario
          </button>

          <button
            type="submit"
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Evaluación ({format})</span>
          </button>
        </div>

      </form>
    </div>
  );
};
