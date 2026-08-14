import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { AlertCircle, CheckCircle2, Send, FileText, User, Building, Hash, Radio, MessageSquare, Info, Award, ClipboardList, ArrowRight } from 'lucide-react';
import { FormatType, Question, SurveyResponse, QuestionAnswer } from '../types';
import { getQuestionsForFormat, GCFO0131_TITLE } from '../data/initialQuestions';
import uvmImage from '../assets/images/uvm_accredited_worker_1786655811408.jpg';
import metrologicalImage from '../assets/images/metrological_warehouse_samples_1786574559696.jpg';
import { SedapalLogo } from './SedapalLogo';

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
  const title = GCFO0131_TITLE;

  // Metadata form states
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [serviceOrder, setServiceOrder] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [serviceChannel, setServiceChannel] = useState<'Correo' | 'Teléfono' | 'WhatsApp' | 'Presencial' | 'Portal Web'>('Correo');
  const [serviceProvidedType, setServiceProvidedType] = useState<string>('Servicios de Evaluación Metrológica de Medidores (evaluación de muestras, aguas subterráneas, control de calidad, etc.)');
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

  const scrollToField = (fieldId: string) => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add temporary highlight ring
      el.classList.add('ring-4', 'ring-red-400', 'ring-offset-2', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-red-400', 'ring-offset-2');
      }, 2200);
    }
  };

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
      newErrors.clientName = 'Por favor ingrese la Razón Social o Equipo de SEDAPAL.';
    }
    if (!serviceOrder.trim()) {
      newErrors.serviceOrder = 'Por favor ingrese el N° de expediente, Remesa o Documento de referencia.';
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
      // Automatically redirect / scroll to the first missing item in logical order
      if (newErrors.clientName) {
        scrollToField('field_clientName');
      } else if (newErrors.serviceOrder) {
        scrollToField('field_serviceOrder');
      } else if (unanswered.length > 0) {
        scrollToField(`q_box_${unanswered[0]}`);
      } else if (missingMotiveIds.length > 0) {
        scrollToField(`q_box_${missingMotiveIds[0]}`);
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
      serviceProvidedType,
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

          {/* Agradecimiento Institucional Destacado */}
          <div className="bg-gradient-to-r from-[#E8F4FC] via-sky-50 to-[#E8F4FC] border border-[#B3D8F5] p-4 sm:p-5 rounded-2xl text-center mb-6 shadow-2xs">
            <p className="text-sm sm:text-base font-bold text-[#003865] leading-relaxed">
              “Muchas gracias por haber llenado nuestra encuesta, su opinión es importante para nosotros”.
            </p>
            <p className="text-xs text-[#005DAA] font-semibold mt-1">
              SEDAPAL • Organismo de Inspección (ISO 17020)
            </p>
          </div>

          {/* Results Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 text-left max-w-md mx-auto space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Razón Social / Equipo:</span>
              <span className="font-semibold text-slate-800">{submittedSuccess.clientName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Expediente / Remesa / Doc. Ref.:</span>
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
      
      {/* Format Header Card with Official SEDAPAL Logo */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#005DAA] bg-[#E8F4FC] px-2.5 py-1 rounded-md border border-[#B3D8F5]">
              Formato de Encuesta GCFO0131
            </span>
            <span className="text-xs font-bold text-slate-500">• Organismo de Inspección</span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 leading-snug">
            {title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Escala de evaluación del 1 al 10 (10 = Más alto, 1 = Más bajo). Calificaciones &le; 8 requieren justificación del motivo.
          </p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-center shrink-0 self-start md:self-center">
          <SedapalLogo variant="light" size="md" />
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Speech / Mensaje Institucional al Cliente al Inicio */}
        <div className="bg-gradient-to-r from-sky-50 via-blue-50/70 to-slate-50 border border-sky-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-start space-x-3.5 sm:space-x-4">
            <div className="p-2.5 sm:p-3 bg-[#003865] text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5 text-sky-300" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-[#003865] tracking-tight">
                Estimado cliente:
              </h3>
              <p className="text-xs sm:text-[13.5px] leading-relaxed text-slate-700 font-medium">
                Le agradeceremos responder esta breve encuesta. Su colaboración nos permitirá seguir evaluando nuestro desempeño ante ustedes, así como el nivel de satisfacción por el servicio que les brindamos.
              </p>
            </div>
          </div>
        </div>

        {/* Section A: Datos del Servicio y Cliente */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              I. Datos Identificatorios de la Inspección / Cliente
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1) Razón Social o Equipo de SEDAPAL */}
            <div id="field_clientName" className="p-1 rounded-xl transition-all">
              <label className="block font-bold text-slate-800 text-xs mb-1.5">
                1) Razón Social o Equipo de SEDAPAL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={clientName}
                  onChange={e => {
                    setClientName(e.target.value);
                    if (errors.clientName) setErrors(prev => ({ ...prev, clientName: undefined }));
                  }}
                  placeholder="Ingrese Razón Social o Equipo de SEDAPAL..."
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 ${
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

            {/* 2) Número de expediente / Remesa / Documento de referencia */}
            <div id="field_serviceOrder" className="p-1 rounded-xl transition-all">
              <label className="block font-bold text-slate-800 text-xs mb-1.5">
                2) Número de expediente / Remesa / Documento de referencia <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={serviceOrder}
                  onChange={e => {
                    setServiceOrder(e.target.value);
                    if (errors.serviceOrder) setErrors(prev => ({ ...prev, serviceOrder: undefined }));
                  }}
                  placeholder="Ingrese Número de expediente / Remesa / Documento de referencia..."
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 ${
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
          </div>
        </div>

        {/* Tipo de Servicio Brindado Container */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <ClipboardList className="w-5 h-5 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              II. Tipo de servicio brindado:
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: Evaluacion Metrologica */}
                <button
                  type="button"
                  onClick={() => setServiceProvidedType('Servicios de Evaluación Metrológica de Medidores (evaluación de muestras, aguas subterráneas, control de calidad, etc.)')}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between overflow-hidden relative group ${
                    serviceProvidedType === 'Servicios de Evaluación Metrológica de Medidores (evaluación de muestras, aguas subterráneas, control de calidad, etc.)'
                      ? 'bg-sky-50/90 border-sky-500 ring-2 ring-sky-300 text-sky-950 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      serviceProvidedType === 'Servicios de Evaluación Metrológica de Medidores (evaluación de muestras, aguas subterráneas, control de calidad, etc.)'
                        ? 'border-sky-600 bg-sky-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {serviceProvidedType === 'Servicios de Evaluación Metrológica de Medidores (evaluación de muestras, aguas subterráneas, control de calidad, etc.)' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-xs font-semibold leading-relaxed">
                      Servicios de Evaluación Metrológica de Medidores (evaluación de muestras, aguas subterráneas, control de calidad, etc.)
                    </span>
                  </div>

                  <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200/80 mt-1 shadow-inner">
                    <img
                      src={metrologicalImage}
                      alt="Servicios de Evaluación Metrológica"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2.5 text-[10px] font-bold text-white bg-slate-900/70 backdrop-blur-md px-2 py-0.5 rounded">
                      Evaluación de Muestras & Lotes
                    </span>
                  </div>
                </button>

                {/* Option 2: Verificacion Acreditada UVM */}
                <button
                  type="button"
                  onClick={() => setServiceProvidedType('Servicios de verificación acreditados / UVM (remesas de verificación posterior, verificación inicial)')}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between overflow-hidden relative group ${
                    serviceProvidedType === 'Servicios de verificación acreditados / UVM (remesas de verificación posterior, verificación inicial)'
                      ? 'bg-sky-50/90 border-sky-500 ring-2 ring-sky-300 text-sky-950 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      serviceProvidedType === 'Servicios de verificación acreditados / UVM (remesas de verificación posterior, verificación inicial)'
                        ? 'border-sky-600 bg-sky-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {serviceProvidedType === 'Servicios de verificación acreditados / UVM (remesas de verificación posterior, verificación inicial)' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-xs font-semibold leading-relaxed">
                      Servicios de verificación acreditados / UVM (remesas de verificación posterior, verificación inicial)
                    </span>
                  </div>

                  <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200/80 mt-1 shadow-inner">
                    <img
                      src={uvmImage}
                      alt="Servicios de verificación acreditados / UVM"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2.5 text-[10px] font-bold text-white bg-slate-900/70 backdrop-blur-md px-2 py-0.5 rounded">
                      Inspección en Campo / UVM
                    </span>
                  </div>
                </button>
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
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-3 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex-1">
                III. Cuestionario
              </h2>
              <span className="text-xs text-slate-400 font-medium lowercase">({questions.length} preguntas)</span>
            </div>

            {/* Sub-instruction and Note */}
            <div className="space-y-2 pt-1">
              <p className="text-xs sm:text-[13px] text-slate-700 font-medium leading-relaxed">
                Utilizando una escala del 1 al 10 (donde 1 es “Muy insatisfecho”, 5 es “Regular” y 10 es “Muy satisfecho”), ¿qué calificación le asignaría a la siguiente pregunta?:
              </p>
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-lg text-amber-900 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  <strong>Nota:</strong> Calificaciones menor o igual a 8 requiere justificación del motivo.
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map(q => {
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

                    {/* Selected Badge or Missing Warning */}
                    {currentScore !== undefined ? (
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
                    ) : isUnansweredErr ? (
                      <div className="shrink-0">
                        <span className="inline-flex items-center space-x-1 bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-red-300 animate-pulse">
                          <AlertCircle className="w-3 h-3 text-red-600" />
                          <span>Falta responder *</span>
                        </span>
                      </div>
                    ) : null}
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

                    {isUnansweredErr && (
                      <p className="text-red-600 text-xs font-semibold mt-2.5 flex items-center space-x-1.5 bg-red-50 p-2 rounded-lg border border-red-200">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>Por favor seleccione una calificación del 1 al 10 para continuar.</span>
                      </p>
                    )}
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

        {/* Section C: Comentarios y sugerencias */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 mb-2">
            <MessageSquare className="w-5 h-5 text-[#005DAA]" />
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
            className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-[#005DAA] bg-slate-50/50"
          />
        </div>

        {/* Validation Errors Summary Banner */}
        {Boolean(
          errors.clientName ||
          errors.serviceOrder ||
          (errors.unansweredQuestions && errors.unansweredQuestions.length > 0) ||
          (errors.missingMotives && errors.missingMotives.length > 0)
        ) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50/95 border-2 border-red-300 rounded-2xl p-5 sm:p-6 shadow-md text-red-900 space-y-4"
          >
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-red-900 tracking-tight">
                  No se pudo enviar la evaluación: Hay campos y/o preguntas obligatorias pendientes
                </h4>
                <p className="text-xs text-red-700 font-medium">
                  Por favor complete los siguientes aspectos señalados en rojo para poder registrar la encuesta:
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-red-200/90">
              {/* Section I field errors */}
              {errors.clientName && (
                <button
                  type="button"
                  onClick={() => scrollToField('field_clientName')}
                  className="w-full text-left flex items-center justify-between p-3 bg-white rounded-xl border border-red-200 hover:border-red-400 hover:bg-red-50/60 transition group shadow-2xs"
                >
                  <span className="text-xs font-semibold text-red-900 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
                    <span>1) Razón Social o Equipo de SEDAPAL (Sección I)</span>
                  </span>
                  <span className="text-[11px] font-bold text-red-600 group-hover:text-red-700 flex items-center space-x-1 shrink-0 ml-2">
                    <span>Ir al campo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              )}

              {errors.serviceOrder && (
                <button
                  type="button"
                  onClick={() => scrollToField('field_serviceOrder')}
                  className="w-full text-left flex items-center justify-between p-3 bg-white rounded-xl border border-red-200 hover:border-red-400 hover:bg-red-50/60 transition group shadow-2xs"
                >
                  <span className="text-xs font-semibold text-red-900 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
                    <span>2) Número de expediente / Remesa / Documento de referencia (Sección I)</span>
                  </span>
                  <span className="text-[11px] font-bold text-red-600 group-hover:text-red-700 flex items-center space-x-1 shrink-0 ml-2">
                    <span>Ir al campo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              )}

              {/* Unanswered questions */}
              {errors.unansweredQuestions && errors.unansweredQuestions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-bold text-red-900 flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Preguntas del cuestionario sin responder ({errors.unansweredQuestions.length}):</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {errors.unansweredQuestions.map(qid => {
                      const q = questions.find(item => item.id === qid);
                      if (!q) return null;
                      return (
                        <button
                          key={qid}
                          type="button"
                          onClick={() => scrollToField(`q_box_${qid}`)}
                          className="text-left p-3 bg-white rounded-xl border border-red-200 hover:border-red-400 hover:bg-red-50/70 transition flex items-start justify-between gap-2 group shadow-2xs"
                        >
                          <div className="flex items-start space-x-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                              {q.number}
                            </span>
                            <span className="text-xs text-slate-900 font-semibold line-clamp-2 leading-tight">
                              {q.text}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-red-600 group-hover:text-red-700 shrink-0 flex items-center space-x-0.5 mt-0.5">
                            <span>Ir</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Missing motives for scores <= 8 */}
              {errors.missingMotives && errors.missingMotives.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Justificaciones obligatorias pendientes (calificación &le; 8):</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {errors.missingMotives.map(qid => {
                      const q = questions.find(item => item.id === qid);
                      if (!q) return null;
                      return (
                        <button
                          key={qid}
                          type="button"
                          onClick={() => scrollToField(`q_box_${qid}`)}
                          className="text-left p-3 bg-white rounded-xl border border-amber-300 hover:border-amber-500 hover:bg-amber-50/70 transition flex items-start justify-between gap-2 group shadow-2xs"
                        >
                          <div className="flex items-start space-x-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                              {q.number}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs text-slate-900 font-semibold">
                                Pregunta {q.number}: Motivo requerido
                              </p>
                              <p className="text-[11px] text-amber-800 font-medium truncate">
                                Calificación otorgada: {scores[qid]}/10
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-amber-700 group-hover:text-amber-800 shrink-0 flex items-center space-x-0.5 mt-0.5">
                            <span>Completar</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Mensaje Institucional de Cierre y Agradecimiento al Final */}
        <div className="bg-gradient-to-r from-sky-50 via-[#E8F4FC] to-blue-50/60 border border-[#B3D8F5] rounded-2xl p-5 sm:p-6 text-center shadow-2xs space-y-1">
          <p className="text-sm sm:text-base font-bold text-[#003865] leading-snug">
            “Muchas gracias por haber llenado nuestra encuesta, su opinión es importante para nosotros”.
          </p>
          <p className="text-xs text-[#005DAA] font-medium">
            SEDAPAL • Organismo de Inspección (ISO 17020)
          </p>
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
            className="bg-[#005DAA] hover:bg-[#004880] text-white font-extrabold text-xs px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Evaluación ({format})</span>
          </button>
        </div>

      </form>
    </div>
  );
};
