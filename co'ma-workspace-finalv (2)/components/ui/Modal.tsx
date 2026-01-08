
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, description, children }) => {
  const [show, setShow] = useState(isOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setShow(false), 200); 
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!mounted) return null;
  if (!show && !isOpen) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      ></div>

      <div 
        className={`relative bg-white/90 backdrop-blur-xl rounded-[32px] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] 
          border border-white/50 ring-2 ring-indigo-500/20 
          shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)] 
          transform transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) 
          ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`} 
        role="dialog" 
        aria-modal="true"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50"></div>

        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100/50 bg-white/50 backdrop-blur-md z-10 sticky top-0">
          <div>
            <h3 className="text-2xl font-black text-gray-800 leading-tight tracking-tight">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-1 font-bold">{description}</p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-colors duration-200"
            aria-label="إغلاق"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto overflow-x-hidden no-scrollbar flex-1 bg-white/60">
          <div className="animate-fade-in delay-100">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
