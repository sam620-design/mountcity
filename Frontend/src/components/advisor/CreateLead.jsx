import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLead } from '../../services/advisorservice';
import { useToast, useConfirm } from '../../context/AppProvider';

function CreateLead() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [errorMessage, setErrorMessage] = useState('');
  const [leadCreated, setLeadCreated] = useState(false);
  const [createdLeadName, setCreatedLeadName] = useState('');
  const [leadData, setLeadData] = useState({
    name: '',
    fatherName: '',
    phoneNumber: '',
    email: '',
    address: '',
    aadhar: '',
    projectName: '',
    plotNumber: '',
    plotSize: '',
    dob: '',
    siteVisited: 'No'
  });

  useEffect(() => {
    const advisorData = sessionStorage.getItem('advisorData');
    if (advisorData) {
      const parsedData = JSON.parse(advisorData);
      setLeadData((prevData) => ({
        ...prevData,
        advisor: parsedData.id
      }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate fields
    const requiredFields = ['name', 'phoneNumber', 'email', 'address', 'aadhar', 'projectName', 'plotNumber', 'plotSize', 'dob'];
    const isEmpty = requiredFields.some(k => !String(leadData[k] || '').trim());
    if (isEmpty) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(leadData.phoneNumber)) {
      setErrorMessage('Phone number must be exactly 10 digits.');
      return;
    }

    const aadhaarRegex = /^[0-9]{12}$/;
    if (!aadhaarRegex.test(leadData.aadhar)) {
      setErrorMessage('Aadhaar number must be exactly 12 digits.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Age validation — must be 18 or older
    const dob = new Date(leadData.dob);
    const today = new Date();
    const age18Date = new Date(dob);
    age18Date.setFullYear(age18Date.getFullYear() + 18);
    if (age18Date > today) {
      setErrorMessage('Customer must be at least 18 years old.');
      toast.error('Customer must be at least 18 years old.', 'Age Restriction');
      return;
    }

    const confirmed = await confirm({
      title: 'Create Lead?',
      message: `Are you sure all details are correct for ${leadData.name}?`,
      confirmText: 'Yes, Save',
      cancelText: 'Review Again',
    });
    if (!confirmed) return;

    try {
      const response = await createLead(leadData);
      setCreatedLeadName(leadData.name);
      setLeadCreated(true);
      toast.success(`${leadData.name} has been successfully added to your lead list.`, 'Lead Created!');
      setLeadData({
        name: '',
        fatherName: '',
        phoneNumber: '',
        email: '',
        address: '',
        aadhar: '',
        projectName: '',
        plotNumber: '',
        plotSize: '',
        dob: '',
        siteVisited: 'No'
      });
    } catch (err) {
      const msg = err.message || 'Lead creation failed';
      setErrorMessage(msg);
      toast.error(msg, 'Failed');
    }
  };

  const handleCreateNew = () => {
    setLeadCreated(false);
    setErrorMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const onlyNums = value.replace(/[^0-9]/g, '').slice(0, 10);
      setLeadData((prev) => ({ ...prev, [name]: onlyNums }));
      return;
    }
    if (name === 'aadhar') {
      const onlyNums = value.replace(/[^0-9]/g, '').slice(0, 12);
      setLeadData((prev) => ({ ...prev, [name]: onlyNums }));
      return;
    }
    setLeadData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="mt-16 min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">

        {leadCreated ? (
          /* ---- SUCCESS SCREEN ---- */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 sm:p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-500" viewBox="0 0 52 52">
                <circle className="fill-none stroke-green-500" strokeWidth="3" cx="26" cy="26" r="24" />
                <path className="fill-none stroke-green-500" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 27l8 8 16-16" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Lead Created!</h2>
            <p className="text-lg text-gray-500 mb-8">You have successfully added <span className="font-bold text-gray-900">{createdLeadName}</span> to your list.</p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-sm transition-colors">
                + Create Another Lead
              </button>
              <button onClick={() => navigate('/advisor/leads')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-xl transition-colors">
                View All Leads
              </button>
            </div>
          </div>
        ) : (
          /* ---- FORM ---- */
          <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-200">
            {errorMessage && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold">{errorMessage}</div>}

            <div className="mb-8 border-b pb-4">
               <h2 className="text-2xl font-extrabold text-gray-900">Create New Lead</h2>
               <p className="text-gray-500 font-medium text-sm mt-1">Enter the lead's details to add them to your list.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-8">

                {/* Full Name */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-sm">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={leadData.name} onChange={handleInputChange} required
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                    placeholder="John Doe" />
                </div>

                {/* Father's Name */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-sm">Father's Name</label>
                  <input type="text" name="fatherName" value={leadData.fatherName} onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                    placeholder="Father's full name" />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-sm">Mobile Number <span className="text-red-500">*</span></label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-bold">+91</span>
                    <input type="tel" name="phoneNumber" value={leadData.phoneNumber} onChange={handleInputChange} required
                      className="w-full border border-gray-300 rounded-r-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                      placeholder="9876543210" maxLength={10} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-sm">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={leadData.email} onChange={handleInputChange} required
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                    placeholder="john@example.com" />
                </div>

                {/* Aadhaar */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-sm">Aadhaar Number <span className="text-red-500">*</span></label>
                  <input type="text" name="aadhar" value={leadData.aadhar} onChange={handleInputChange} required
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                    placeholder="12-digit number" maxLength={12} />
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-sm">Date of Birth <span className="text-red-500">*</span></label>
                  <input type="date" name="dob" value={leadData.dob} onChange={handleInputChange} required
                    max={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().split('T')[0]; })()}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none" />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 font-bold mb-1 text-sm">Full Address <span className="text-red-500">*</span></label>
                  <textarea name="address" value={leadData.address} onChange={handleInputChange} required rows="2"
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                    placeholder="Enter complete address" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8 mt-8">
                <h3 className="text-lg font-bold mb-5 text-gray-800">Property Interest</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-8">

                  {/* Project */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-sm">Project <span className="text-red-500">*</span></label>
                    <select name="projectName" value={leadData.projectName} onChange={handleInputChange} required
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none bg-white">
                      <option value="" disabled>Select Project</option>
                      <option value="Nutan Villa(Rajgir)">Nutan Villa (Rajgir)</option>
                      <option value="Hi-Tech City(Rajgir)">Hi-Tech City (Rajgir)</option>
                      <option value="Nutan Vatika(Rajgir)">Nutan Vatika (Rajgir)</option>
                    </select>
                  </div>

                  {/* Plot Number */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-sm">Plot Number <span className="text-red-500">*</span></label>
                    <input type="text" name="plotNumber" value={leadData.plotNumber} onChange={handleInputChange} required
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                      placeholder="e.g. A-12" />
                  </div>

                  {/* Plot Size */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-sm">Plot Size <span className="text-red-500">*</span></label>
                    <input list="plot-sizes" name="plotSize" value={leadData.plotSize} onChange={handleInputChange} required
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
                      placeholder="Select or type size" />
                    <datalist id="plot-sizes">
                      <option value="1200 Sq. feet" />
                      <option value="1600 Sq. feet" />
                      <option value="2400 Sq. feet" />
                    </datalist>
                  </div>

                  {/* Site Visited */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-sm">Has the lead visited the site? <span className="text-red-500">*</span></label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex-1 flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="radio" name="siteVisited" value="Yes" checked={leadData.siteVisited === 'Yes'} onChange={handleInputChange} className="hidden" />
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${leadData.siteVisited === 'Yes' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                          {leadData.siteVisited === 'Yes' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                        </span>
                        <span className={`text-sm font-bold ${leadData.siteVisited === 'Yes' ? 'text-indigo-800' : 'text-gray-600'}`}>Yes, Visited</span>
                      </label>
                      <label className="flex-1 flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="radio" name="siteVisited" value="No" checked={leadData.siteVisited === 'No'} onChange={handleInputChange} className="hidden" />
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${leadData.siteVisited === 'No' ? 'border-gray-600 bg-gray-600' : 'border-gray-300'}`}>
                          {leadData.siteVisited === 'No' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                        </span>
                        <span className={`text-sm font-bold ${leadData.siteVisited === 'No' ? 'text-gray-900' : 'text-gray-600'}`}>No</span>
                      </label>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => navigate('/advisor/dashboard')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-10 rounded-xl shadow-md transition-colors">
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateLead;
