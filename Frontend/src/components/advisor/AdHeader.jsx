import { useNavigate } from 'react-router-dom';
import { AiOutlineMenuFold } from 'react-icons/ai'
import { Link,NavLink } from 'react-router-dom'
import { Logo } from '..'
import { useState } from 'react';

function AdHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    
    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };
    
    const handleLogout = () => {
      sessionStorage.clear();
      navigate('/');
      window.location.reload(); 
    };
  
  return (
    <>
    <div>
      <header className="fixed top-0 left-0 w-full bg-white border-b border-slate-200 shadow-sm z-50">
        <div className="container mx-auto flex justify-between items-center py-3 px-4">
          
          {/* Logo */}
          <Link to='/'>
            <div className="flex items-center">
              <img src={Logo} alt="Mount City Developers Pvt. Ltd." className="md:w-16 md:h-8 w-12 h-6" />
              <h1 className="text-lg lg:text-xl ml-3 font-extrabold text-slate-800 tracking-tight">MOUNT CITY DEVELOPERS</h1>
            </div>
          </Link>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/advisor/dashboard" className={({isActive})=> `px-4 py-2 rounded-lg font-semibold transition-all ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>My Profile</NavLink>
            <NavLink to="/advisor/incentive" className={({isActive})=> `px-4 py-2 rounded-lg font-semibold transition-all ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>My Earnings</NavLink>
            <NavLink to="/advisor/team" className={({isActive})=> `px-4 py-2 rounded-lg font-semibold transition-all ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>My Team</NavLink>
            <NavLink to="/advisor/customer-details" className={({isActive})=> `px-4 py-2 rounded-lg font-semibold transition-all ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>My Customers</NavLink>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to='/advisor/create-lead' className="bg-indigo-600 font-bold text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
              + Create Lead
            </Link>
            <button onClick={handleLogout} className="px-4 py-2 font-bold text-slate-600 hover:bg-red-50 hover:text-red-700 rounded-lg flex items-center gap-2 transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-slate-700 hover:text-indigo-600 focus:outline-none p-2 cursor-pointer">
              <AiOutlineMenuFold size={26}/>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`fixed md:hidden top-0 h-screen right-0 w-72 bg-white shadow-2xl p-6 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out z-50 border-l border-slate-200`}>
          <div className="flex justify-between items-center mb-8 border-b pb-4">
             <h2 className="font-extrabold text-slate-800">Menu</h2>
             <button onClick={toggleMenu} className="text-slate-500 hover:text-slate-800 focus:outline-none cursor-pointer bg-slate-100 p-2 rounded-full">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          </div>
          
          <div className="flex flex-col space-y-2">
            <NavLink to="/advisor/dashboard" onClick={toggleMenu} className={({isActive})=> `block px-4 py-3 rounded-xl font-bold ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
              My Profile
            </NavLink>
            <NavLink to="/advisor/incentive" onClick={toggleMenu} className={({isActive})=> `block px-4 py-3 rounded-xl font-bold ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
              My Earnings
            </NavLink>
            <NavLink to="/advisor/team" onClick={toggleMenu} className={({isActive})=> `block px-4 py-3 rounded-xl font-bold ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
              My Team
            </NavLink>
            <NavLink to="/advisor/customer-details" onClick={toggleMenu} className={({isActive})=> `block px-4 py-3 rounded-xl font-bold ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
              My Customers
            </NavLink>
          </div>
        
          <div className="flex flex-col space-y-3 mt-8 border-t border-slate-100 pt-8">
            <Link to='/advisor/create-lead' onClick={toggleMenu} className="bg-indigo-600 text-center font-bold text-white px-4 py-4 rounded-xl hover:bg-indigo-700 shadow-md">
              + Create Lead
            </Link>
            <button onClick={handleLogout} className="bg-slate-100 text-center font-bold text-slate-700 px-4 py-4 rounded-xl hover:bg-red-50 hover:text-red-700 cursor-pointer">
              Logout
            </button>
          </div>
        </div>
      </header>
    </div>
    </>
  )
}

export default AdHeader