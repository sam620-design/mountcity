import React, { useState } from 'react';
import { apiAdvisors } from '../../config/api.js';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const CompleteProfile = ({ advisorData, onComplete }) => {
  const [pan, setPan] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!PAN_REGEX.test(pan)) e.pan = 'PAN must be 5 letters, 4 numbers, and 1 letter (like ABCDE1234F)';
    if (!/^[0-9]{12}$/.test(aadhar)) e.aadhar = 'Aadhar must have exactly 12 numbers';
    if (!address.trim() || address.trim().length < 10) e.address = 'Please write your full home address';
    if (!dob) e.dob = 'Please select your birth date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const targetId = advisorData._id || advisorData.id;
      const response = await fetch(`${apiAdvisors}/${targetId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pan, aadhar, address, dob })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedAdvisorData = { ...advisorData, pan: data.advisor.pan, aadhar: data.advisor.aadhar, address: data.advisor.address, dob: data.advisor.dob };
        sessionStorage.setItem('advisorData', JSON.stringify(updatedAdvisorData));
        onComplete(updatedAdvisorData);
      } else {
        let errorMsg = `Issue saving details: code ${response.status}`;
        try {
           const errData = await response.json();
           if (errData.message || errData.error) errorMsg = errData.message || errData.error;
        } catch(e) {}
        setErrors({ submit: errorMsg });
      }
    } catch (error) {
      console.error(error);
      setErrors({ submit: 'Check your internet connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Simple Header */}
        <div className="bg-indigo-600 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 border-2 border-white/40 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            📄
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">Complete Your Profile</h2>
          <p className="text-indigo-100 text-sm">Please fill in these details to unlock your dashboard</p>
        </div>

        {/* Clean Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          {errors.submit && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-sm font-semibold text-center">
              ⚠️ {errors.submit}
            </div>
          )}

          <div>
             <label className="block text-slate-700 font-bold mb-2">PAN Card Number</label>
             <input
                type="text"
                placeholder="ABCDE1234F"
                value={pan}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                  setPan(v);
                  if (errors.pan) setErrors(prev => ({ ...prev, pan: '' }));
                }}
                className={`w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all ${errors.pan ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:ring-indigo-100'}`}
             />
             {errors.pan && <p className="text-red-500 text-xs mt-1 font-medium">{errors.pan}</p>}
          </div>

          <div>
             <label className="block text-slate-700 font-bold mb-2">Aadhar Card Number</label>
             <input
                type="text"
                placeholder="0000 0000 0000"
                value={aadhar}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
                  setAadhar(v);
                  if (errors.aadhar) setErrors(prev => ({ ...prev, aadhar: '' }));
                }}
                className={`w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all ${errors.aadhar ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:ring-indigo-100'}`}
             />
             {errors.aadhar && <p className="text-red-500 text-xs mt-1 font-medium">{errors.aadhar}</p>}
          </div>

          <div>
             <label className="block text-slate-700 font-bold mb-2">Full Home Address</label>
             <textarea
                placeholder="House Number, Street, City, State, PIN Code"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                }}
                rows={2}
                className={`w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all resize-none ${errors.address ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:ring-indigo-100'}`}
             />
             {errors.address && <p className="text-red-500 text-xs mt-1 font-medium">{errors.address}</p>}
          </div>

          <div>
             <label className="block text-slate-700 font-bold mb-2">Date of Birth</label>
             <input
                type="date"
                value={dob}
                onChange={(e) => {
                  setDob(e.target.value);
                  if (errors.dob) setErrors(prev => ({ ...prev, dob: '' }));
                }}
                className={`w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all text-slate-700 ${errors.dob ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:ring-indigo-100'}`}
             />
             {errors.dob && <p className="text-red-500 text-xs mt-1 font-medium">{errors.dob}</p>}
          </div>

          <div className="pt-4">
             <button
               type="submit"
               disabled={loading}
               className={`w-full p-4 rounded-xl font-bold text-white transition-all shadow-md ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
             >
               {loading ? 'Saving Details...' : 'Save & Continue'}
             </button>
             <p className="text-center text-slate-400 text-xs mt-4">
               Your details are kept completely private and secure.
             </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
