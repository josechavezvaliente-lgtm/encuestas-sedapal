import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SurveyForm } from './components/SurveyForm';
import { ReportsDashboard } from './components/ReportsDashboard';
import { SurveyHistory } from './components/SurveyHistory';
import { FormatQuestionsModal } from './components/FormatQuestionsModal';
import { ShareModal } from './components/ShareModal';
import { PublicSurveyView } from './components/PublicSurveyView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SedapalLogo } from './components/SedapalLogo';
import { FormatType, SurveyResponse } from './types';
import {
  fetchStoredResponses,
  saveSurveyResponseAsync,
  updateSurveyResponseAsync,
  deleteSurveyResponseAsync,
  resetSurveyResponsesAsync
} from './utils/storage';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'new_survey' | 'reports' | 'history' | 'questions'>('new_survey');
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('GCFO0131');
  const [selectedHistoryFormatFilter, setSelectedHistoryFormatFilter] = useState<FormatType | 'ALL'>('ALL');
  
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRespondentMode, setIsRespondentMode] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState<boolean>(() => sessionStorage.getItem('sedapal_admin_auth') === 'true');
  const [adminUser, setAdminUser] = useState<string>(() => sessionStorage.getItem('sedapal_admin_user') || '');

  const loadSurveys = async () => {
    const data = await fetchStoredResponses();
    setResponses(data);
  };

  const handleAdminSuccess = (email: string) => {
    setIsAdmin(true);
    setAdminUser(email);
    sessionStorage.setItem('sedapal_admin_auth', 'true');
    sessionStorage.setItem('sedapal_admin_user', email);
    setIsAdminModalOpen(false);
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setAdminUser('');
    sessionStorage.removeItem('sedapal_admin_auth');
    sessionStorage.removeItem('sedapal_admin_user');
  };

  useEffect(() => {
    loadSurveys();
    const interval = setInterval(loadSurveys, 4000);
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'survey') setIsRespondentMode(true);
    return () => clearInterval(interval);
  }, []);

  const handleSaveSurvey = async (newResponse: SurveyResponse) => { setResponses(await saveSurveyResponseAsync(newResponse)); };
  const handleUpdateSurvey = async (updatedResponse: SurveyResponse) => { setResponses(await updateSurveyResponseAsync(updatedResponse)); };
  const handleDeleteResponse = async (id: string) => { setResponses(await deleteSurveyResponseAsync(id)); };
  const handleResetData = async () => { if (window.confirm('¿Está seguro de restablecer los datos? Esto recargará las encuestas de prueba por defecto.')) { const reseted = await resetSurveyResponsesAsync(); setResponses(reseted); } };

  if (isRespondentMode) return <PublicSurveyView format={selectedFormat} setFormat={setSelectedFormat} onSaveSurvey={handleSaveSurvey} />;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <Header
        activeTab={activeTab} setActiveTab={setActiveTab}
        selectedFormat={selectedFormat} setSelectedFormat={setSelectedFormat}
        totalResponsesCount={responses.length}
        onResetData={handleResetData}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        isAdmin={isAdmin} adminUser={adminUser}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onLogoutAdmin={handleAdminLogout}
      />
      <main className="flex-1 pb-16">
        {activeTab === 'new_survey' && <SurveyForm format={selectedFormat} setFormat={setSelectedFormat} onSaveSurvey={handleSaveSurvey} onGoToReports={() => setActiveTab('reports')} />}
        {activeTab === 'reports' && <ReportsDashboard responses={responses} selectedFormat={selectedFormat} setSelectedFormat={setSelectedFormat} />}
        {activeTab === 'history' && (
          <SurveyHistory
            responses={responses} onDeleteResponse={handleDeleteResponse} onUpdateResponse={handleUpdateSurvey}
            selectedFormatFilter={selectedHistoryFormatFilter} setSelectedFormatFilter={setSelectedHistoryFormatFilter}
            isAdmin={isAdmin} adminUser={adminUser}
            onOpenAdminModal={() => setIsAdminModalOpen(true)}
            onLogoutAdmin={handleAdminLogout}
          />
        )}
        {activeTab === 'questions' && <FormatQuestionsModal />}
      </main>

      {/* Modal para Compartir Encuesta */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentFormat={selectedFormat}
        adminPin="1234"
      />

      <AdminLoginModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} onSuccess={handleAdminSuccess} />
    </div>
  );
}