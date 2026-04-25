import React from 'react';
import { Logo } from '..'; 

const IdCard = React.forwardRef(({ data, emergencyContact }, ref) => {
  const defaultPhoto = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  return (
    <div ref={ref} className="flex flex-row gap-8 p-4 bg-transparent" style={{ width: '800px', margin: '0 auto' }}>
      {/* FRONT SIDE */}
      <div className="relative w-[350px] h-[550px] rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white flex flex-col font-sans">
         {/* Top Banner */}
         <div className="h-32 bg-[#0F3A62] flex flex-col items-center justify-start pt-4 relative">
            <img src={Logo} alt="Logo" className="h-10 mb-1" crossOrigin="anonymous" />
            <h2 className="text-white font-black text-[11px] tracking-widest uppercase text-center leading-tight">Mount City Developers</h2>
         </div>
         {/* Photo */}
         <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
               <img src={data.profilePhoto || defaultPhoto} alt="Advisor" className="w-full h-full object-cover" crossOrigin="anonymous" />
            </div>
         </div>
         {/* Details */}
         <div className="mt-24 px-6 flex flex-col items-center text-center flex-1">
            <h1 className="text-2xl font-black text-slate-800">{data.name}</h1>
            <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs mt-1 mb-6">{data.role || 'Advisor'}</p>
            
            <div className="w-full space-y-3 text-left mt-2 border-t border-slate-100 pt-6">
              <div className="flex justify-between border-b border-slate-50 pb-1">
                 <span className="text-xs font-bold text-slate-400 uppercase">ID No.</span>
                 <span className="text-sm font-black text-slate-800">{data.advisorId || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                 <span className="text-xs font-bold text-slate-400 uppercase">Blood Group</span>
                 <span className="text-sm font-black text-rose-600">{data.bloodGroup || 'Not Provided'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                 <span className="text-xs font-bold text-slate-400 uppercase">Phone</span>
                 <span className="text-sm font-black text-slate-800">+91 {data.phoneNumber}</span>
              </div>
            </div>
         </div>
         {/* Footer */}
         <div className="bg-[#0F3A62] h-4 w-full"></div>
      </div>

      {/* BACK SIDE */}
      <div className="relative w-[350px] h-[550px] rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white flex flex-col font-sans">
         <div className="bg-[#0F3A62] h-4 w-full"></div>
         <div className="p-6 h-full flex flex-col">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b-2 border-[#0F3A62] inline-block pb-0.5 mb-2">Terms & Conditions</h3>
            <ul className="text-[9px] text-slate-600 list-disc pl-4 space-y-1 mb-4 font-medium leading-tight">
               <li>This card is the property of Mount City Developers Pvt. Ltd.</li>
               <li>If found, please return to the office address mentioned below.</li>
               <li>Valid only for official company business and must be surrendered upon termination.</li>
            </ul>

            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-b-2 border-rose-600 inline-block pb-1 mb-3 mt-2">Emergency Contact</h3>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 mb-6 flex flex-col items-center text-center">
               <p className="text-xs text-rose-600 font-bold uppercase mb-1">In Case of Emergency, Call:</p>
               <p className="text-xl font-black text-rose-700 tracking-wider">+91 {emergencyContact}</p>
            </div>

            <div className="mt-auto bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
               <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Office Address</h3>
               <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                  Jhunki Baba Road, Patel Nagar,<br/>
                  Near RDH School, Rajgir, 803116
               </p>
               <p className="text-[10px] text-slate-800 font-black mt-1 tracking-wide">
                  +91 9471613137 | +91 8539804930
               </p>
            </div>
         </div>
         <div className="bg-[#0F3A62] h-4 w-full"></div>
      </div>
    </div>
  );
});

export default IdCard;
