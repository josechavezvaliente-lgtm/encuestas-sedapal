import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Link2, Share2, Shield, Lock, EyeOff } from 'lucide-react';
import { FormatType } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFormat: FormatType;
  adminPin: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  currentFormat,
  adminPin
}) => {
  const [selectedFormat, setSelectedFormat] = useState<FormatType>(currentFormat);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const path = window.location.pathname;
  const baseUrl = `${origin}${path}`;

  const publicLink = `${baseUrl}?mode=survey&format=${selectedFormat}`;
  const fullAdminLink = `${baseUrl}`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(key);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Compartir Encuesta a Clientes / Externos
              </h3>
              <p className="text-xs text-slate-500">
                Enlace seguro estilo Microsoft Forms (Sin acceso a reportes)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start space-x-3 text-xs text-amber-900">
          <EyeOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-bold">Privacidad Garantizada:</strong> Los usuarios que abran este enlace <strong>solo podrán llenar la encuesta</strong>. Las pestañas de <em>Reportes Automatizados</em> e <em>Historial</em> estarán totalmente ocultas y protegidas por clave PIN.
          </p>
        </div>

        {/* 1. Format Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. Seleccione el Formato de Encuesta
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedFormat('GCFO0192')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedFormat === 'GCFO0192'
                  ? 'bg-sky-50/90 border-sky-500 text-sky-900 ring-2 ring-sky-200'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">GCFO0192</span>
                {selectedFormat === 'GCFO0192' && <Check className="w-3.5 h-3.5 text-sky-600" />}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Organismo de Inspección (9 preguntas)
              </p>
            </button>

            <button
              onClick={() => setSelectedFormat('GCFO0131')}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedFormat === 'GCFO0131'
                  ? 'bg-sky-50/90 border-sky-500 text-sky-900 ring-2 ring-sky-200'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">GCFO0131</span>
                {selectedFormat === 'GCFO0131' && <Check className="w-3.5 h-3.5 text-sky-600" />}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Medidores de Agua (4 preguntas)
              </p>
            </button>
          </div>
        </div>

        {/* 2. Public Link Box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Enlace Público para Encuestados (Modo Solo Llenado)
          </label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                readOnly
                value={publicLink}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 select-all focus:outline-none"
              />
            </div>

            <button
              onClick={() => handleCopy(publicLink, 'public')}
              className={`px-4 py-2 rounded-xl font-bold text-xs text-white shadow-sm transition flex items-center space-x-1.5 shrink-0 ${
                copiedFormat === 'public' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-sky-600 hover:bg-sky-500'
              }`}
            >
              {copiedFormat === 'public' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedFormat === 'public' ? '¡Copiado!' : 'Copiar Enlace'}</span>
            </button>
          </div>
        </div>

        {/* 3. Admin Security PIN Info */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-800 font-bold">
            <span className="flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Clave PIN de Administrador</span>
            </span>
            <span className="bg-slate-200 text-slate-800 font-mono px-2 py-0.5 rounded text-xs">
              {adminPin}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Use este PIN si necesita ingresar al panel de reportes desde el enlace público.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <a
            href={publicLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:text-sky-800 font-semibold flex items-center space-x-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Probar Vista de Encuestado Externa</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
