
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface ToastProps {
  msg: string;
  type: 'success' | 'error';
}

const Toast: React.FC<ToastProps> = ({ msg, type }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
      setVisible(true);
      return () => setVisible(false);
  }, []);

  // Use createPortal to render outside the main app root
  return createPortal(
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) transform ${visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-90'}`}>
        <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] max-w-md backdrop-blur-md border ${type === 'error' ? 'bg-white/90 border-red-200 text-red-800' : 'bg-white/90 border-emerald-200 text-emerald-800'}`}>
            <div className={`p-2 rounded-full ${type === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {type === 'error' ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
            </div>
            <div className="flex-1">
                <p className="font-bold text-sm">{type === 'error' ? 'خطأ' : 'نجاح'}</p>
                <p className="text-xs opacity-90 font-medium">{msg}</p>
            </div>
        </div>
    </div>,
    document.body
  );
};

export default Toast;
