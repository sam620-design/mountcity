import React, { useState, useEffect } from 'react';
import { apiAdvisors } from '../../config/api.js';
import LedgerTable from './LedgerTable.jsx';

function AdvisorSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      const storedData = sessionStorage.getItem('advisorData');
      if (!storedData) return;
      const Data = JSON.parse(storedData);
      try {
        const response = await fetch(`${apiAdvisors}/${Data.id}/customers`);
        if (response.ok) {
          const fetchedData = await response.json();
          // Filter ONLY registered, confirmed, or booked customers
          const registered = fetchedData.filter(c => {
            const status = (c.status || '').toUpperCase();
            return ['BOOKED', 'REGISTERED', 'CONFIRMED', 'PENDING_REGISTRATION'].includes(status);
          });
          setSales(registered);
        }
      } catch (error) {
        console.error('Error fetching sales:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  return (
    <div className="mt-16 min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-white px-8 py-8 border-b border-gray-200">
             <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Finalized Sales</h2>
             <p className="text-gray-500 font-medium">Your successful deals and total revenue generated.</p>
          </div>
          
          <div className="p-6 md:p-8 bg-white">
            {loading ? (
              <p className="text-center text-gray-500 py-10 italic">Loading sales and ledger data...</p>
            ) : sales.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-lg">No sales finalized yet.</p>
            ) : (
              <div className="mt-2">
                 <LedgerTable customers={sales} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvisorSales;
