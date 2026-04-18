
import React, { useState } from 'react';
import Scrolltop from '../model/Scrolltop';

const Emi_calc= () => {
  const [principal, setPrincipal] = useState(0);
  const [rate, setRate] = useState(0);
  const [tenure, setTenure] = useState(0);
  const [emi, setEmi] = useState(null);

  const calculateEMI = () => {
    let monthlyRate = rate / (12 * 100); // Monthly interest rate
    let n = tenure * 12; // Loan tenure in months
    let emiAmount =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
      (Math.pow(1 + monthlyRate, n) - 1);
    setEmi(emiAmount.toFixed(2));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Scrolltop/>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">EMI Calculator</h2>
        
        <div className="mb-4">
          <label className="block text-gray-600 mb-2">Principal Amount (₹)</label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="Enter loan amount"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 mb-2">Annual Interest Rate (%)</label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="Enter interest rate"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 mb-2">Loan Tenure (Years)</label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            placeholder="Enter loan tenure"
          />
        </div>

        <button
          onClick={calculateEMI}
          className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition duration-300"
        >
          Calculate EMI
        </button>

        {emi && (
          <div className="mt-6 text-center">
            <h3 className="text-xl font-semibold text-gray-700">Monthly EMI: ₹{emi}</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default Emi_calc;
