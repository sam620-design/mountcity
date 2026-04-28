import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import IdCard from './IdCard';
import { RiCloseLine, RiDownloadCloud2Line } from 'react-icons/ri';

const IdCardModal = ({ data, emergencyContact, onClose }) => {
  const cardRef = useRef(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
         scale: 3, // High resolution for print
         useCORS: true, // For cross-origin images
         backgroundColor: null, // Transparent background
         onclone: (clonedDoc) => {
            const wrapper = clonedDoc.getElementById('id-card-scale-wrapper');
            if (wrapper) {
               wrapper.style.transform = 'none';
            }
         }
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `${data.name || 'Advisor'}_ID_Card.png`;
      link.click();
    } catch (error) {
      console.error("Error generating ID card:", error);
      alert("Failed to generate ID card. Please ensure images are loaded.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col mt-10 mb-10">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">ID Card Preview</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <RiCloseLine size={24} />
          </button>
        </div>

        {/* Content (The Card) */}
        <div className="bg-slate-100 flex justify-center items-start pt-6 overflow-hidden h-[380px] w-full">
           {/* Wrap IdCard in a container that scales down visually but renders full size for canvas */}
           <div id="id-card-scale-wrapper" className="transform scale-[0.6] origin-top flex justify-center">
             <IdCard ref={cardRef} data={data} emergencyContact={emergencyContact} />
           </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3">
           <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all">
             Cancel
           </button>
           <button onClick={handleDownload} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all">
             <RiDownloadCloud2Line size={20} />
             Download Image
           </button>
        </div>
      </div>
    </div>
  );
};

export default IdCardModal;
