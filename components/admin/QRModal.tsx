import React from 'react';
import { X, Share2, Download } from '../ui/Icons';

interface QRModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
}

const QRModal: React.FC<QRModalProps> = ({ url, isOpen, onClose, businessName }) => {
  if (!isOpen) return null;

  // Using a reliable public API for QR generation for the demo
  // In production, we might use a library like qrcode.react
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=0f172a&bgcolor=ffffff`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 text-center animate-in fade-in zoom-in duration-200">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Scan for Menu</h2>
        <p className="text-slate-500 mb-6">{businessName}</p>
        
        <div className="bg-white p-4 rounded-xl border-2 border-slate-900 inline-block mb-6 shadow-lg">
           <img src={qrImageUrl} alt="QR Code" className="w-48 h-48" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a 
            href={qrImageUrl} 
            download={`menu-qr-${businessName.replace(/\s+/g, '-').toLowerCase()}.png`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 bg-slate-100 text-slate-800 py-3 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            <Download size={18} /> Save Image
          </a>
          <button 
             onClick={() => {
               navigator.clipboard.writeText(url);
               alert("Link copied to clipboard!");
             }}
             className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            <Share2 size={18} /> Copy Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRModal;