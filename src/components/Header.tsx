import React from 'react';
import { BarChart3, History, HelpCircle, PlusCircle, Share2, Shield, ShieldCheck, LogOut } from 'lucide-react';
import { FormatType } from '../types';
import { SedapalLogo } from './SedapalLogo';

interface HeaderProps {
  activeTab: 'new_survey' | 'reports' | 'history' | 'questions';
  setActiveTab: (tab: 'new_survey' | 'reports' | 'history' | 'questions') => void;
  selectedFormat: FormatType;
  setSelectedFormat: (format: FormatType) => void;
  totalResponsesCount: number;
  onResetData: () => void;
  onOpenShareModal: () => void;
  isAdmin?: boolean;
  adminUser?: string;
  onOpenAdminModal?: () => void;
  onLogoutAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedFormat,
  setSelectedFormat,
  totalResponsesCount,
  onResetData,
  onOpenShareModal,
  isAdmin,
  adminUser,
  onOpenAdminModal,
  onLogoutAdmin
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
                  Organismo de Inspección del EGCM
                </span>
              </div>
              <p className="text-[11px] text-sky-200/90 font-medium">
                Organismo de Inspección del EGCM
              </p>
            </div>
          </div>

          {/* Active Format Badge */}
          <div className="flex items-center bg-[#002c52] px-3 py-1.5 rounded-xl border border-sky-500/30 text-xs font-bold text-sky-200 self-start md:self-auto">
            <span>Formato GCFO0131</span>
          </div>

          {/* Header Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {isAdmin ? (
              <div className="flex items-center space-x-2 bg-[#002c52] border border-emerald-400/40 px-3 py-1.5 rounded-lg text-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-bold text-white hidden sm:inline">
                  {adminUser || 'jchavezv@sedapal.com.pe'}
                </span>
                <button
                  onClick={onLogoutAdmin}
                  title="Cerrar sesión de administrador"
                  className="inline-flex items-center space-x-1 ml-1 px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 rounded text-[10px] font-bold transition cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminModal}
                title="Iniciar sesión de Administrador"
                className="flex items-center space-x-1.5 bg-[#002c52] hover:bg-[#002544] text-sky-100 hover:text-white font-bold px-3 py-1.5 rounded-lg border border-sky-400/30 transition cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-sky-300" />
                <span>Administrador</span>
              </button>
            )}

            <button
              onClick={onOpenShareModal}
              title="Generar enlace público para compartir con usuarios"
              className="flex items-center space-x-1.5 bg-[#0099DD] hover:bg-[#0082BD] text-white font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir Encuesta</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-sky-900/50 pt-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('new_survey')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
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
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
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
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
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
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
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