import React, { useEffect, useState } from 'react';
import { RiMoneyRupeeCircleLine, RiMedalLine } from 'react-icons/ri';
import { apiAdvisors } from '../../config/api.js';

const TeamNode = ({ node, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.connectedAdvisors && node.connectedAdvisors.length > 0;

  return (
    <div className={`mt-3 rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all ${level > 0 ? 'ml-6 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-slate-800'}`}>
       <div 
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
          className={`p-4 flex flex-col sm:flex-row justify-between items-center bg-white ${hasChildren ? 'cursor-pointer hover:bg-slate-50' : ''}`}
       >
          <div className="flex items-center w-full">
             {/* Expansion toggle */}
             <div className="mr-3 w-8 flex justify-center cursor-pointer">
                {hasChildren && (
                   <span className="text-xl font-black text-slate-400 hover:text-indigo-600 transition-colors">
                      {isExpanded ? '▼' : '▶'}
                   </span>
                )}
             </div>
             <div>
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center">
                   {node.name}
                </h3>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1">{node.email} | {node.phoneNumber}</p>
             </div>
          </div>
          <div className="sm:text-right mt-3 sm:mt-0 w-full sm:w-auto ml-11 sm:ml-0">
             <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest hidden sm:block">Network Vol</p>
             <p className="text-xl font-black text-indigo-700">₹{(node.totalBusiness || 0).toLocaleString('en-IN')}</p>
          </div>
       </div>

       {/* Recursive Children Container inside parent block */}
       {hasChildren && isExpanded && (
          <div className="p-3 sm:p-5 border-t border-slate-100 bg-slate-50/50">
             {node.connectedAdvisors.map((child, idx) => (
                <TeamNode key={child._id || idx} node={child} level={level + 1} />
             ))}
          </div>
       )}
    </div>
  );
};

const Team = () => {
  const [advisorData, setAdvisorData] = useState(null);

  useEffect(() => {
    const fetchFreshData = async () => {
      const storedData = sessionStorage.getItem('advisorData');
      if (!storedData) return;
      const temp = JSON.parse(storedData);
      
      try {
        const res = await fetch(`${apiAdvisors}/me`, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
        });
        if (res.ok) {
          const fresh = await res.json();
          setAdvisorData(fresh);
        } else {
          setAdvisorData(temp); // fallback
        }
      } catch (err) {
        setAdvisorData(temp);
      }
    };
    fetchFreshData();
  }, []);

  if (!advisorData) return <div className="p-10 text-center text-xl text-gray-500">Loading your team...</div>;

  const subordinates = advisorData.connectedAdvisors || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8 mt-16">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Tree View */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6 border-b border-gray-100 pb-4">Your Team</h2>
          
          {subordinates.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-lg font-medium">You currently have no connected team members.</p>
              <p className="text-gray-400 mt-2 text-sm">Start sharing your referral code to grow your team!</p>
            </div>
          ) : (
            <div className="pt-2">
              {subordinates.map((sub, idx) => (
                <TeamNode key={sub._id || idx} node={sub} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Team;
