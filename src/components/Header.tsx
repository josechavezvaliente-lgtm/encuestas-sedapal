import React from 'react';
import { BarChart3, History, HelpCircle, RefreshCw, PlusCircle, CheckCircle2, Share2 } from 'lucide-react';
import { FormatType } from '../types';
import { SedapalLogo } from './SedapalLogo';

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
    <header className="bg-[#003865] text-white border-b border-[#00284a] sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="bg-white px-3 py-1.5 rounded-xl shadow-md border border-sky-100 flex items-center">
              <SedapalLogo variant="light" size="md" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm text-white tracking-wide uppercase">
                  Organismo de Inspección
                </span>
                <span className="bg-[#0099DD]/30 text-sky-200 text-[10px] px-2 py-0.5 rounded-full font-bold border border-sky-400/40">
                  ISO 17020
                </span>
              </div>
              <p className="text-[11px] text-sky-200/90 font-medium">
                Gestión de Calidad • Evaluación de Satisfacción GCFO0131
              </p>
            </div>
          </div>

          {/* Active Format Badge */}
          <div className="flex items-center bg-[#002c52] px-3 py-1.5 rounded-xl border border-sky-500/30 text-xs font-bold text-sky-200 self-start md:self-auto">
            <span>Formato GCFO0131</span>
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={onOpenShareModal}
              title="Generar enlace público para compartir con usuarios"
              className="flex items-center space-x-1.5 bg-[#0099DD] hover:bg-[#0082BD] text-white font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir Encuesta</span>
            </button>

            <button
              onClick={onLoadSampleData}
              title="Cargar encuestas simuladas para probar los reportes"
              className="flex items-center space-x-1.5 bg-[#002c52] hover:bg-[#002342] text-slate-100 px-3 py-1.5 rounded-lg border border-sky-500/30 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline font-medium">Cargar Demo</span>
            </button>

            <button
              onClick={onResetData}
              title="Restablecer base de datos local"
              className="flex items-center space-x-1 bg-[#002c52] hover:bg-[#002342] text-slate-300 px-2.5 py-1.5 rounded-lg border border-sky-500/30 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-300" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-sky-900/50 pt-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('new_survey')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'new_survey'
                ? 'border-sky-300 text-white bg-[#002c52] shadow-xs'
                : 'border-transparent text-sky-100/80 hover:text-white hover:bg-[#002c52]/60'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-sky-300" />
            <span>Nueva Evaluación ({selectedFormat})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-sky-300 text-white bg-[#002c52] shadow-xs'
                : 'border-transparent text-sky-100/80 hover:text-white hover:bg-[#002c52]/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-sky-300" />
            <span>Reportes Automatizados</span>
            <span className="ml-1 bg-sky-400/30 text-sky-200 px-1.5 py-0.2 rounded-full text-[10px]">
              {totalResponsesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-sky-300 text-white bg-[#002c52] shadow-xs'
                : 'border-transparent text-sky-100/80 hover:text-white hover:bg-[#002c52]/60'
            }`}
          >
            <History className="w-4 h-4 text-sky-300" />
            <span>Historial de Respuestas</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'questions'
                ? 'border-sky-300 text-white bg-[#002c52] shadow-xs'
                : 'border-transparent text-sky-100/80 hover:text-white hover:bg-[#002c52]/60'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-sky-300" />
            <span>Estructura de Preguntas</span>
          </button>
        </div>
      </div>
    </header>
  );
};

