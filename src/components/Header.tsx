import React from 'react';
import { ClipboardList, BarChart3, History, HelpCircle, RefreshCw, PlusCircle, Award, CheckCircle2, Share2 } from 'lucide-react';
import { FormatType } from '../types';

interface HeaderProps {
  activeTab: 'new_survey' | 'reports' | 'history' | 'questions';
  setActiveTab: (tab: 'new_survey' | 'reports' | 'history' | 'questions') => void;
  selectedFormat: FormatType;
  setSelectedFormat: (format: FormatType) => void;
  totalResponsesCount: number;
  onResetData: () => void;
  onLoadSampleData: () => void;
  onOpenShareModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedFormat,
  setSelectedFormat,
  totalResponsesCount,
  onResetData,
  onLoadSampleData,
  onOpenShareModal
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-sky-600 to-cyan-500 p-2.5 rounded-xl shadow-inner text-white">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-white tracking-tight">SEDAPAL</span>
                <span className="bg-sky-500/20 text-sky-300 text-xs px-2 py-0.5 rounded-full font-medium border border-sky-400/30">
                  Gestión de Calidad
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Evaluación de Satisfacción de Encuestas • GCFO0131 & GCFO0192
              </p>
            </div>
          </div>

          {/* Active Format Pill Selector */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
            <button
              onClick={() => setSelectedFormat('GCFO0192')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                selectedFormat === 'GCFO0192'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span>Formato GCFO0192</span>
              <span className="text-[10px] opacity-80">(Inspección)</span>
            </button>

            <button
              onClick={() => setSelectedFormat('GCFO0131')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                selectedFormat === 'GCFO0131'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span>Formato GCFO0131</span>
              <span className="text-[10px] opacity-80">(Ensayos/Técnico)</span>
            </button>
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={onOpenShareModal}
              title="Generar enlace público tipo Microsoft Forms para compartir con usuarios externos"
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-xs transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir Encuesta</span>
            </button>

            <button
              onClick={onLoadSampleData}
              title="Cargar encuestas simuladas para probar los reportes"
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Cargar Encuestas Demo</span>
            </button>

            <button
              onClick={onResetData}
              title="Restablecer base de datos local"
              className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-800 pt-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('new_survey')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'new_survey'
                ? 'border-sky-400 text-sky-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-sky-400" />
            <span>Nueva Evaluación ({selectedFormat})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-sky-400 text-sky-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>Reportes Automatizados</span>
            <span className="ml-1 bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded-full text-[10px]">
              {totalResponsesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-sky-400 text-sky-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <History className="w-4 h-4 text-sky-400" />
            <span>Historial de Respuestas</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'questions'
                ? 'border-sky-400 text-sky-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span>Estructura de Preguntas</span>
          </button>
        </div>
      </div>
    </header>
  );
};
