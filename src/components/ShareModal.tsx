import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Link2, Share2, Shield, EyeOff, FileText, MessageCircle, Send, Mail } from 'lucide-react';
import { FormatType } from '../types';
import { SedapalLogo } from './SedapalLogo';

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedServiceHint, setSelectedServiceHint] = useState<'METROLOGIA' | 'UVM' | 'GENERAL'>('METROLOGIA');

  if (!isOpen) return null;

  const origin = window.location.origin;
  const path = window.location.pathname;
  const baseUrl = `${origin}${path}`;

  // Enlace único para el formato GCFO0131
  const publicLink = `${baseUrl}?mode=survey&format=GCFO0131`;

  const getServiceInstruction = () => {
    if (selectedServiceHint === 'METROLOGIA') {
      return 'Al ingresar a la encuesta, por favor seleccione la opción *"Servicios de Evaluación Metrológica de Medidores (evaluación de muestras, aguas subterráneas, control de calidad, etc.)"* y continúe con las preguntas correspondientes.';
    }
    if (selectedServiceHint === 'UVM') {
      return 'Al ingresar a la encuesta, por favor seleccione la opción *"Servicios de Verificación de medidores de agua potable acreditados ante INACAL (UVM)"* y continúe con las preguntas correspondientes.';
    }
    return 'Al ingresar a la encuesta, por favor seleccione el tipo de servicio recibido y continúe con las preguntas correspondientes.';
  };

  const getWhatsAppMessage = () => {
    return `*SEDAPAL - ORGANISMO DE INSPECCIÓN DEL EGCM*\n*Encuesta de Satisfacción del Cliente (Formato GCFO0131)*\n\nEstimado(a) cliente:\n\nAgradeceremos su participación en nuestra *Encuesta de Satisfacción*, la cual nos permitirá conocer su experiencia y continuar mejorando nuestros servicios.\n\n🔗 *Para registrar su opinión, ingrese al siguiente enlace:*\n${publicLink}\n\n${getServiceInstruction()}\n\nSu opinión es muy importante para nosotros. ¡Gracias por su participación!\n\n_Equipo Gestión Comercial y Micromedición - SEDAPAL_`;
  };

  const handleCopy = (text: string, isFullMsg = false) => {
    navigator.clipboard.writeText(text);
    if (isFullMsg) {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const rawMsg = getWhatsAppMessage();
    const encodedMsg = encodeURIComponent(rawMsg);
    
    let url = '';
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length >= 8) {
      const fullPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
      url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedMsg}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodedMsg}`;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('SEDAPAL - Encuesta de Satisfacción del Cliente (GCFO0131)');
    const body = encodeURIComponent(getWhatsAppMessage().replace(/\*/g, '').replace(/_/g, ''));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#00284a]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in duration-150 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#E8F4FC] rounded-xl border border-[#B3D8F5]">
              <SedapalLogo variant="light" size="sm" showText={false} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#003865]">
                Compartir Encuesta SEDAPAL
              </h3>
              <p className="text-xs text-slate-500">
                Enlace único seguro para clientes externos (Formato GCFO0131)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Direct Sharing Box */}
        <div className="bg-emerald-50/80 border border-emerald-300/80 rounded-2xl p-4 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-950 font-bold text-xs">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-emerald-900 block leading-tight">Enviar por WhatsApp</span>
                <span className="text-[11px] font-normal text-emerald-700">Envío directo con el mensaje institucional de SEDAPAL</span>
              </div>
            </div>
          </div>

          {/* Service Instruction Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-emerald-950">
              Instrucción para el cliente según servicio:
            </label>
            <select
              value={selectedServiceHint}
              onChange={(e) => setSelectedServiceHint(e.target.value as any)}
              className="w-full text-xs font-semibold bg-white border border-emerald-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
              <option value="METROLOGIA">Evaluación Metrológica de Medidores (aguas subterráneas, control)</option>
              <option value="UVM">Verificación Acreditada ante INACAL / UVM</option>
              <option value="GENERAL">General (Selección abierta por el cliente)</option>
            </select>
          </div>

          {/* Optional Phone Number Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="N° Celular (ej. 941512983 - opcional)"
                className="w-full pl-3 pr-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
              />
            </div>
            
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
              title="Abrir WhatsApp con mensaje institucional"
            >
              <Send className="w-4 h-4" />
              <span>Abrir en WhatsApp</span>
            </button>
          </div>

          {/* Quick Copy Full WhatsApp Message */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => handleCopy(getWhatsAppMessage(), true)}
              className="inline-flex items-center space-x-1.5 text-emerald-800 hover:text-emerald-950 font-bold text-[11px] hover:underline cursor-pointer"
            >
              {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMessage ? '¡Mensaje Copiado al Portapapeles!' : 'Copiar texto completo del mensaje'}</span>
            </button>

            <button
              onClick={handleShareEmail}
              className="inline-flex items-center space-x-1 text-slate-600 hover:text-[#005DAA] font-bold text-[11px] hover:underline cursor-pointer"
              title="Abrir cliente de correo con mensaje predeterminado"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Enviar por Correo</span>
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start space-x-3 text-xs text-amber-900">
          <EyeOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-bold">Privacidad Garantizada:</strong> Los usuarios que abran este enlace <strong>solo podrán llenar la encuesta</strong>. Las pestañas de <em>Reportes Automatizados</em> e <em>Historial</em> estarán totalmente ocultas y protegidas por clave PIN.
          </p>
        </div>

        {/* Format Card Info */}
        <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center space-x-3">
          <div className="p-2 bg-sky-600 text-white rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs text-sky-950">Formato GCFO0131</span>
              <span className="text-[10px] font-semibold bg-sky-200 text-sky-800 px-2 py-0.5 rounded-full">
                Encuesta Única
              </span>
            </div>
            <p className="text-[11px] text-sky-800 font-medium leading-tight mt-0.5">
              Organismo de Inspección del EGCM (SEDAPAL)
            </p>
          </div>
        </div>

        {/* Public Link Box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Enlace Público para Encuestados (GCFO0131)
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
              onClick={() => handleCopy(publicLink, false)}
              className={`px-4 py-2 rounded-xl font-bold text-xs text-white shadow-sm transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                copiedLink ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-sky-600 hover:bg-sky-500'
              }`}
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? '¡Copiado!' : 'Copiar Enlace'}</span>
            </button>
          </div>
        </div>

        {/* Admin Security PIN Info */}
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
            Use este PIN si necesita ingresar al panel de reportes desde la vista del encuestado.
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
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};