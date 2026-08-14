import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldAlert } from 'lucide-react';
import { SedapalLogo } from './SedapalLogo';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.trim() === correctPin) {
      setErrorMsg('');
      setEnteredPin('');
      onSuccess();
    } else {
      setErrorMsg('PIN incorrecto. Intente nuevamente.');
      setEnteredPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#00284a]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in duration-150">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-[#E8F4FC] rounded-xl">
              <SedapalLogo variant="light" size="sm" showText={false} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#003865]">
                Acceso Administrador SEDAPAL
              </h3>
              <p className="text-[11px] text-slate-500">
                Ingrese PIN de seguridad para acceder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clave PIN de Seguridad
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                maxLength={6}
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="••••"
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono tracking-widest focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            {errorMsg && (
              <div className="flex items-center space-x-1 text-rose-600 text-[11px] font-semibold mt-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex-1 py-2 bg-[#005DAA] hover:bg-[#004880] text-white text-xs font-extrabold rounded-xl shadow-sm transition"
            >
              Ingresar
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
