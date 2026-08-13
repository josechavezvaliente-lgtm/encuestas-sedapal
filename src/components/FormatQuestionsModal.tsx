import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, FileText, Copy, Check, Edit3, Plus, Trash2, RotateCcw, Save, X, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { getQuestionsForFormat, GCFO0192_TITLE, GCFO0131_TITLE } from '../data/initialQuestions';
import { saveQuestionsAsync, resetQuestionsAsync, fetchStoredQuestionsMap } from '../utils/storage';
import { FormatType, Question } from '../types';

export const FormatQuestionsModal: React.FC = () => {
  const [activeFormat, setActiveFormat] = useState<FormatType>('GCFO0192');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Load questions on mount & format change
  const reloadQuestions = () => {
    const loaded = getQuestionsForFormat(activeFormat);
    setQuestions(loaded);
  };

  useEffect(() => {
    // Sync central questions map from backend on mount
    fetchStoredQuestionsMap().then(map => {
      setQuestions(map[activeFormat] || getQuestionsForFormat(activeFormat));
    });
  }, []);

  useEffect(() => {
    reloadQuestions();
    setIsEditing(false);
  }, [activeFormat]);

  const title = activeFormat === 'GCFO0192' ? GCFO0192_TITLE : GCFO0131_TITLE;

  const handleCopyQuestions = () => {
    let text = `${title}\n\n`;
    questions.forEach(q => {
      text += `${q.number}. ${q.text} (Sección: ${q.sectionTitle})\n`;
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    reloadQuestions();
    setIsEditing(false);
  };

  const handleQuestionTextChange = (id: string, newText: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, text: newText } : q));
  };

  const handleSectionTitleChange = (id: string, newSectionTitle: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, sectionTitle: newSectionTitle } : q));
  };

  const handleAddQuestion = () => {
    const nextNum = questions.length + 1;
    const defaultSection = questions.length > 0 ? questions[questions.length - 1].sectionTitle : 'I. Evaluación General';
    const newQ: Question = {
      id: `${activeFormat.toLowerCase()}_custom_${Date.now()}`,
      number: nextNum,
      sectionId: `sec_custom_${Date.now()}`,
      sectionTitle: defaultSection,
      text: 'Escriba la nueva pregunta aquí...'
    };
    setQuestions([...questions, newQ]);
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert('El formato debe tener al menos 1 pregunta.');
      return;
    }
    const filtered = questions.filter(q => q.id !== id);
    // Renumber
    const renumbered = filtered.map((q, idx) => ({ ...q, number: idx + 1 }));
    setQuestions(renumbered);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newArr = [...questions];
    const temp = newArr[index];
    newArr[index] = newArr[index - 1];
    newArr[index - 1] = temp;
    // Renumber
    const renumbered = newArr.map((q, idx) => ({ ...q, number: idx + 1 }));
    setQuestions(renumbered);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newArr = [...questions];
    const temp = newArr[index];
    newArr[index] = newArr[index + 1];
    newArr[index + 1] = temp;
    // Renumber
    const renumbered = newArr.map((q, idx) => ({ ...q, number: idx + 1 }));
    setQuestions(renumbered);
  };

  const handleSaveQuestions = async () => {
    // Validate non-empty question texts
    const emptyQ = questions.find(q => !q.text.trim());
    if (emptyQ) {
      alert(`La pregunta #${emptyQ.number} no puede estar vacía.`);
      return;
    }

    setIsSaving(true);
    await saveQuestionsAsync(activeFormat, questions);
    setIsSaving(false);
    setIsEditing(false);
    setSaveNotification('¡Estructura de preguntas actualizada con éxito!');
    setTimeout(() => setSaveNotification(null), 3500);
  };

  const handleResetToDefault = async () => {
    if (window.confirm('¿Está seguro de restablecer este banco de preguntas a la versión oficial por defecto de SEDAPAL?')) {
      setIsSaving(true);
      const resetedMap = await resetQuestionsAsync();
      setQuestions(resetedMap[activeFormat]);
      setIsSaving(false);
      setIsEditing(false);
      setSaveNotification('Preguntas restablecidas a la norma oficial.');
      setTimeout(() => setSaveNotification(null), 3500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Save Notification Toast */}
      {saveNotification && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{saveNotification}</span>
          </div>
          <button onClick={() => setSaveNotification(null)} className="text-emerald-100 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-0.5 rounded-md border border-sky-200">
              Estructura Oficial de Formatos
            </span>
            {isEditing && (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-md border border-amber-200 animate-pulse">
                Modo Edición Activo
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Banco de Preguntas para Evaluaciones
          </h1>
          <p className="text-xs text-slate-500">
            Consulte o modifique la redacción y secciones normadas para los formatos GCFO0131 y GCFO0192.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Format Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setActiveFormat('GCFO0192')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeFormat === 'GCFO0192' ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GCFO0192
            </button>
            <button
              onClick={() => setActiveFormat('GCFO0131')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeFormat === 'GCFO0131' ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GCFO0131
            </button>
          </div>

          {!isEditing ? (
            <>
              <button
                onClick={handleStartEditing}
                className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Preguntas</span>
              </button>

              <button
                onClick={handleCopyQuestions}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleResetToDefault}
                className="flex items-center space-x-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition"
                title="Restablecer preguntas a las oficiales por defecto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>

              <button
                onClick={handleCancelEditing}
                className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl text-xs font-semibold transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>

              <button
                onClick={handleSaveQuestions}
                disabled={isSaving}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Questions View / Edit Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Escala de valoración: 1 a 10. Si el puntaje asignado es menor o igual a 8 (&le;8), el sistema solicita el motivo.
            </p>
          </div>

          {isEditing && (
            <button
              onClick={handleAddQuestion}
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Nueva Pregunta</span>
            </button>
          )}
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className={`p-4 rounded-xl border text-xs transition ${
                isEditing
                  ? 'bg-amber-50/40 border-amber-200/80 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200/80 flex items-start space-x-3'
              }`}
            >
              {!isEditing ? (
                // READ-ONLY MODE
                <>
                  <span className="bg-sky-600 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs">
                    {q.number}
                  </span>
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60 inline-block mb-1">
                      {q.sectionTitle}
                    </span>
                    <p className="font-semibold text-slate-900 text-sm leading-relaxed">
                      {q.text}
                    </p>
                  </div>
                </>
              ) : (
                // EDIT MODE
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-amber-200/50 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-amber-600 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">
                        {q.number}
                      </span>
                      <span className="text-xs font-bold text-slate-700">Pregunta #{q.number}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="Subir posición"
                        className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === questions.length - 1}
                        title="Bajar posición"
                        className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        title="Eliminar pregunta"
                        className="p-1 rounded bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Sección o Categoría:
                      </label>
                      <input
                        type="text"
                        value={q.sectionTitle}
                        onChange={e => handleSectionTitleChange(q.id, e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Redacción de la Pregunta:
                      </label>
                      <textarea
                        rows={2}
                        value={q.text}
                        onChange={e => handleQuestionTextChange(q.id, e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Section 2: Comentarios y sugerencias */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 text-xs">
            <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60 inline-block mb-1">
              2. Comentarios y sugerencias
            </span>
            <p className="font-bold text-slate-900 text-sm leading-relaxed">
              ¿Qué aspectos del servicio considera que deberían mejorarse?
            </p>
            <p className="text-[11px] text-slate-400 mt-1 italic">
              (Sección final de entrada de texto libre en el formulario de encuesta)
            </p>
          </div>
        </div>

        {/* Edit mode bottom action controls */}
        {isEditing && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleAddQuestion}
              className="flex items-center space-x-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-4 py-2 rounded-xl text-xs font-bold transition w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar otra pregunta</span>
            </button>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleCancelEditing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveQuestions}
                disabled={isSaving}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
