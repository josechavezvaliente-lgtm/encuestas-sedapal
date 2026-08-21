import React, { useState } from 'react';
import { X, Lock, Mail, ShieldCheck, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { SedapalLogo } from './SedapalLogo';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminEmail: string) => void;
}

export const ADMIN_CREDENTIALS = {
  email: 'jchavezv@sedapal.com.pe',
  password: 'Admin70979597'
};

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (
      cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() &&
      cleanPassword === ADMIN_CREDENTIALS.password
    ) {
      setErrorMsg('');
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setEmail('');
        setPassword('');
        onSuccess(ADMIN_CREDENTIALS.email);
      }, 600);
    } else {
      setErrorMsg('Credenciales inválidas. Verifique su usuario institucional y contraseña.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#00284a]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#E8F4FC] rounded-xl border border-[#B3D8F5]">
              <SedapalLogo variant="light" size="sm" showText={false} />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="bg-[#E8F4FC] text-[#005DAA] text-[10px] font-extrabold px-2 py-0.5 rounded border border-[#B3D8F5]">
                  SEDAPAL • SEGURIDAD
                </span>
              </div>
              <h3 className="text-base font-extrabold text-[#003865] mt-0.5">
                Acceso de Administrador
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Ingrese sus credenciales de administrador
        </p>

        {isSuccess ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-emerald-900">¡Acceso Concedido!</h4>
            <p className="text-xs text-emerald-700">
              Modo Administrador activado correctamente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Usuario Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="ejemplo@sedapal.com.pe"
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#005DAA] focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#005DAA] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-start space-x-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="flex-1 py-2 bg-[#005DAA] hover:bg-[#004880] text-white text-xs font-bold rounded-xl shadow-sm transition inline-flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};