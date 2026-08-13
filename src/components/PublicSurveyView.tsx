import React, { useState } from 'react';
import { Award, Lock, ShieldCheck } from 'lucide-react';
import { FormatType, SurveyResponse } from '../types';
import { SurveyForm } from './SurveyForm';
import { AdminPinModal } from './AdminPinModal';

interface PublicSurveyViewProps {
  format: FormatType;
  setFormat: (format: FormatType) => void;
  onSaveSurvey: (response: SurveyResponse) => void;
  onUnlockAdmin: () => void;
  adminPin: string;
}

export const PublicSurveyView: React.FC<PublicSurveyViewProps> = ({
  format,
  setFormat,
  onSaveSurvey,
  onUnlockAdmin,
  adminPin
}) => {
  const [showPinModal, setShowPinModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Forms Public Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-sky-600 to-cyan-500 p-2.5 rounded-xl text-white shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base text-white tracking-tight">SEDAPAL</span>
                <span className="bg-sky-500/20 text-sky-300 text-[10px] px-2 py-0.5 rounded-full font-medium border border-sky-400/30">
                  Formulario de Encuesta
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Organismo de Inspección y Calidad ISO 17020
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPinModal(true)}
            title="Ingreso protegido para administradores"
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Acceso Administrador</span>
          </button>
        </div>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 py-4">
        <SurveyForm
          format={format}
          setFormat={setFormat}
          onSaveSurvey={onSaveSurvey}
          onGoToReports={() => setShowPinModal(true)}
        />
      </main>

      {/* Forms Clean Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="font-medium text-slate-300">
            SEDAPAL • Evaluación de Satisfacción del Cliente ({format})
          </p>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Respuestas Confidenciales</span>
          </div>
        </div>
      </footer>

      {/* Admin PIN Verification Modal */}
      <AdminPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          setShowPinModal(false);
          onUnlockAdmin();
        }}
        correctPin={adminPin}
      />

    </div>
  );
};
