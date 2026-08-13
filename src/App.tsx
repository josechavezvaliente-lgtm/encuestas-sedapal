import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SurveyForm } from './components/SurveyForm';
import { ReportsDashboard } from './components/ReportsDashboard';
import { SurveyHistory } from './components/SurveyHistory';
import { FormatQuestionsModal } from './components/FormatQuestionsModal';
import { ShareModal } from './components/ShareModal';
import { PublicSurveyView } from './components/PublicSurveyView';
import { FormatType, SurveyResponse } from './types';
import {
  fetchStoredResponses,
  saveSurveyResponseAsync,
  deleteSurveyResponseAsync,
  resetSurveyResponsesAsync
} from './utils/storage';
import { Award, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'new_survey' | 'reports' | 'history' | 'questions'>('new_survey');
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('GCFO0192');
  const [selectedHistoryFormatFilter, setSelectedHistoryFormatFilter] = useState<FormatType | 'ALL'>('ALL');
  
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRespondentMode, setIsRespondentMode] = useState(false);
  const adminPin = '1234';

  const loadSurveys = async () => {
    const data = await fetchStoredResponses();
    setResponses(data);
  };

  useEffect(() => {
    // Initial fetch from central server
    loadSurveys();

    // Live polling every 4 seconds to sync responses filled by external users
    const interval = setInterval(() => {
      loadSurveys();
    }, 4000);

    const handleFocus = () => {
      loadSurveys();
    };
    window.addEventListener('focus', handleFocus);

    // Read URL query parameters for public survey link (e.g. ?mode=survey&format=GCFO0131)
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const formatParam = params.get('format');

    if (formatParam === 'GCFO0131' || formatParam === 'GCFO0192') {
      setSelectedFormat(formatParam as FormatType);
    }

    if (modeParam === 'survey') {
      setIsRespondentMode(true);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleSaveSurvey = async (newResponse: SurveyResponse) => {
    const updated = await saveSurveyResponseAsync(newResponse);
    setResponses(updated);
  };

  const handleDeleteResponse = async (id: string) => {
    const updated = await deleteSurveyResponseAsync(id);
    setResponses(updated);
  };

  const handleResetData = async () => {
    if (window.confirm('¿Está seguro de restablecer los datos? Esto recargará las encuestas de prueba por defecto.')) {
      const reseted = await resetSurveyResponsesAsync();
      setResponses(reseted);
    }
  };

  const handleLoadSampleData = async () => {
    const reseted = await resetSurveyResponsesAsync();
    setResponses(reseted);
  };

  if (isRespondentMode) {
    return (
      <PublicSurveyView
        format={selectedFormat}
        setFormat={setSelectedFormat}
        onSaveSurvey={handleSaveSurvey}
        adminPin={adminPin}
        onUnlockAdmin={() => {
          setIsRespondentMode(false);
          window.history.pushState({}, '', window.location.pathname);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        totalResponsesCount={responses.length}
        onResetData={handleResetData}
        onLoadSampleData={handleLoadSampleData}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'new_survey' && (
          <SurveyForm
            format={selectedFormat}
            setFormat={setSelectedFormat}
            onSaveSurvey={handleSaveSurvey}
            onGoToReports={() => setActiveTab('reports')}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsDashboard
            responses={responses}
            selectedFormat={selectedFormat}
            setSelectedFormat={setSelectedFormat}
          />
        )}

        {activeTab === 'history' && (
          <SurveyHistory
            responses={responses}
            onDeleteResponse={handleDeleteResponse}
            selectedFormatFilter={selectedHistoryFormatFilter}
            setSelectedFormatFilter={setSelectedHistoryFormatFilter}
          />
        )}

        {activeTab === 'questions' && (
          <FormatQuestionsModal />
        )}
      </main>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentFormat={selectedFormat}
        adminPin={adminPin}
      />

      {/* Corporate Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="font-semibold text-slate-300">
              SEDAPAL • Organismo de Inspección y Calidad ISO 17020
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Sistema de Evaluación GCFO0131 & GCFO0192</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Control Escala 1-10</span>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
