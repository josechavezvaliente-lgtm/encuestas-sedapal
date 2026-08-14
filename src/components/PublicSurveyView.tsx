import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { FormatType, SurveyResponse } from '../types';
import { SurveyForm } from './SurveyForm';
import { SedapalLogo } from './SedapalLogo';

interface PublicSurveyViewProps {
  format: FormatType;
  setFormat: (format: FormatType) => void;
  onSaveSurvey: (response: SurveyResponse) => void;
}

export const PublicSurveyView: React.FC<PublicSurveyViewProps> = ({
  format,
  setFormat,
  onSaveSurvey
}) => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-[#0099DD] selection:text-white">
      
      {/* Forms Public Header in Corporate SEDAPAL Blue */}
      <header className="bg-[#003865] text-white border-b border-[#00284a] sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white px-3 py-1 rounded-xl shadow-sm flex items-center">
              <SedapalLogo variant="light" size="sm" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-white tracking-tight uppercase">
                  Encuesta de Satisfacción
                </span>
                <span className="bg-[#0099DD]/30 text-sky-200 text-[10px] px-2 py-0.5 rounded-full font-bold border border-sky-400/40">
                  ISO 17020
                </span>
              </div>
              <p className="text-[11px] text-sky-200/90 font-medium">
                Organismo de Inspección y Calidad
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-sky-200/90 font-medium">
            <ShieldCheck className="w-4 h-4 text-sky-300 shrink-0" />
            <span className="hidden sm:inline">Formulario Oficial</span>
          </div>
        </div>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 py-4">
        <SurveyForm
          format={format}
          setFormat={setFormat}
          onSaveSurvey={onSaveSurvey}
        />
      </main>

      {/* Forms Clean Footer */}
      <footer className="bg-[#002c52] text-sky-200/80 text-xs py-6 border-t border-[#00203d] mt-auto">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="font-semibold text-slate-200">
            SEDAPAL • Evaluación de Satisfacción del Cliente ({format})
          </p>
          <div className="flex items-center space-x-2 text-[11px] text-sky-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Respuestas Confidenciales</span>
          </div>
        </div>
      </footer>

    </div>
  );
};


