import React, { useState, useEffect } from 'react';
import { AdHeader,Footer } from './components'
import { Navigate, Outlet } from 'react-router-dom'
import CompleteProfile from './components/advisor/CompleteProfile.jsx';
import { apiAdvisors } from './config/api.js';

function AdvisorLayout() {
  const token = sessionStorage.getItem('token');
  const [advisorData, setAdvisorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    // Always fetch fresh from backend to avoid stale sessionStorage
    fetch(`${apiAdvisors}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data) {
        setAdvisorData(data);
        // Keep sessionStorage in sync
        const stored = JSON.parse(sessionStorage.getItem('advisorData') || '{}');
        sessionStorage.setItem('advisorData', JSON.stringify({ ...stored, ...data }));
      }
      setLoading(false);
    })
    .catch(() => {
      // Fallback to sessionStorage if network fails
      const stored = sessionStorage.getItem('advisorData');
      if (stored) setAdvisorData(JSON.parse(stored));
      setLoading(false);
    });
  }, [token]);

  if (!token) return <Navigate to='/'/>;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 text-lg">Loading...</div>;

  // Only intercept if PAN or Aadhar is missing/not provided
  const isProfileIncomplete = advisorData && (
     !advisorData.pan || advisorData.pan === 'Not Provided' ||
     !advisorData.aadhar || advisorData.aadhar === 'Not Provided'
  );

  return (
     <div className="min-h-screen flex flex-col">
      {isProfileIncomplete && (
         <CompleteProfile 
            advisorData={advisorData} 
            onComplete={(updatedData) => setAdvisorData(updatedData)} 
         />
      )}
      
      <AdHeader />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default AdvisorLayout;