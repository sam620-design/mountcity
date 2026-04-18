import React, { useState,useEffect,useRef } from 'react';
import { Link,useNavigate, NavLink } from 'react-router-dom';
import { Logo ,Profile} from '.'; // Replace with your logo import
import { AiOutlineMenuFold } from "react-icons/ai";
import { FaCaretDown } from "react-icons/fa"
import { IoLogInOutline } from "react-icons/io5";


const Header = ({ openLogin, openEnq}) => {

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown menu
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  const [advisorData, setAdvisorData] = useState(null);
  useEffect(() => {
    const storedData = JSON.parse(sessionStorage.getItem('advisorData'));
    if (storedData) {
      setAdvisorData(storedData);
    }
  }, []);
  // const token = sessionStorage.getItem('token'); 
  // // console.log(token)// Assuming you store the token in local storage
  // const [advisor, setAdvisor] = useState(null);
  // useEffect(() => {
  //   const fetchAdvisorData = async () => {
  //     try {
  //       const response = await fetch(`${baseURL}/api/advisors/me`, {
  //         method: 'GET',
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //       });
  
  //       const responseBody = await response.text(); // Read the response body as text
  
  //       if (response.ok) {
  //         const data = JSON.parse(responseBody); // Try to parse it as JSON
  //         setAdvisor(data);
  //       } else {
  //         console.error('Failed to fetch advisor data:', responseBody);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching advisor data:', error);
  //     }
  //   };
  
  //   fetchAdvisorData();
  // }, [token]);

  const handleLogout = () => {
 
    sessionStorage.clear();
    setAdvisorData(null); // Clear advisor data
    setIsDropdownOpen(false); // Close the dropdown
    navigate('/') // Redirect to login page (or your desired route)
  };


  return (
    <>
    <header className="fixed top-0 left-0 w-full bg-[#f6f7dc02] shadow-md z-50 backdrop-blur-xl">
      <div className="container mx-auto flex justify-between items-center py-4 px-2">
        {/* Logo */}
        <Link to='/'>
          <div className="flex items-center">
            <img src={Logo} alt="Nutan Housing Finance" className="md:w-20 md:h-10 w-14 h-8" />
            <h1 className="text-lg lg:text-2xl ml-2 mt-[5px] font-semibold text-primary font-poppins">NUTAN HOUSING FINANCE</h1>
          </div>
        </Link>
        
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex space-x-3">
          <NavLink to="/" className={({ isActive }) => `p-1 lg:px-2 rounded ${isActive ? 'text-primary' : 'text-gray-900 hover:bg-yellow-200 hover:text-gray-700 transition-colors duration-300'}`}>Home</NavLink>
          <NavLink to="/about" className={({ isActive }) => `p-1 lg:px-2 rounded ${isActive ? 'text-primary' : 'text-gray-900 hover:bg-yellow-200 hover:text-gray-700 transition-colors duration-300'}`}>About Us</NavLink>
          <NavLink to="/projects" className={({ isActive }) => `p-1 lg:px-2 rounded ${isActive ? 'text-primary' : 'text-gray-900 hover:bg-yellow-200 hover:text-gray-700 transition-colors duration-300'}`}>Projects</NavLink>
          <NavLink to="/career" className={({ isActive }) => `p-1 lg:px-2 rounded ${isActive ? 'text-primary' : 'text-gray-900 hover:bg-yellow-200 hover:text-gray-700 transition-colors duration-300'}`}>Careers</NavLink>
          <NavLink to="/blogs" className={({ isActive }) => `p-1 lg:px-2 rounded ${isActive ? 'text-primary' : 'text-gray-900 hover:bg-yellow-200 hover:text-gray-700 transition-colors duration-300'}`}>Blog</NavLink>
          <NavLink to="/contact" className={({ isActive }) => `p-1 lg:px-2 rounded ${isActive ? 'text-primary' : 'text-gray-900 hover:bg-yellow-200 hover:text-gray-700 transition-colors duration-300'}`}>Contact Us</NavLink>
        </nav>

        {/* Enquire & User Buttons (Desktop only) */}
        <div className="hidden md:flex space-x-4">
          <button onClick={openEnq} className="bg-yellow-200 text-sm text-gray-900 px-3 py-2 rounded-md hover:bg-yellow-500 hover:text-white animate-bounce">
            Enquire Now
          </button>
          {advisorData ? (        <div className="relative ">
           
              <button onClick={toggleDropdown} className="flex text-sm items-center px-1 py-1 bg-primary hover:bg-yellow-500 text-gray-50 rounded-md">
              <img 
                src={Profile} // Dummy profile picture
                alt="Profile"
                className="w-8 h-8 rounded-full mr-2" // Adjust size and shape for your design
              />
                {advisorData.name} 
                <FaCaretDown className="ml-2" />{/* Display advisor name */}
              </button>
              {isDropdownOpen && (
                <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                  <Link to="/advisor/dashboard" className="block px-4 py-2 text-gray-800 hover:bg-yellow-200">Dashboard</Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-yellow-200">Logout</button>
                </div>
              )}
            </div>) : (
            <button onClick={openLogin} className="px-4 hover:scale-105 transition-all duration-500 py-2 bg-primary hover:bg-yellow-400 text-gray-50 rounded-md flex items-center gap-2"> <IoLogInOutline/>Login</button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden mt-2">
          <button onClick={toggleMenu} className="text-primary focus:outline-none mr-2">
            <AiOutlineMenuFold size={24}/>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu - Slide from Right */}
      <div className={`fixed md:hidden top-0 h-screen right-0 w-64 bg-[#dfdfdff6] p-6 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out z-50`}>
        <button onClick={toggleMenu} className="text-gray-800 focus:outline-none mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <NavLink to="/" onClick={toggleMenu} className={({ isActive }) => `block p-2 rounded ${isActive ? 'text-primary' : 'text-gray-800 hover:bg-yellow-200 hover:text-gray-700 transition-colors duration-300'}`}>
          Home
        </NavLink>
        <NavLink to="/about" onClick={toggleMenu} className={({ isActive }) => `block p-2 rounded ${isActive ? 'text-primary' : 'text-gray-800 hover:bg-yellow-200 hover:text-gray-700 transition-colors duration-300'}`}>
          About Us
        </NavLink>
        <NavLink to="/projects" onClick={toggleMenu} className={({ isActive }) => `block p-2 rounded ${isActive ? 'text-primary' : 'text-gray-800 hover:bg-yellow-200 hover:text-gray-700 transition-colors duration-300'}`}>
          Projects
        </NavLink>
        <NavLink to="/career" onClick={toggleMenu} className={({ isActive }) => `block p-2 rounded ${isActive ? 'text-primary' : 'text-gray-800 hover:bg-yellow-200 hover:text-gray-700 transition-colors duration-300'}`}>
          Careers
        </NavLink>
        <NavLink to="/blogs" onClick={toggleMenu} className={({ isActive }) => `block p-2 rounded ${isActive ? 'text-primary' : 'text-gray-800 hover:bg-yellow-200 hover:text-gray-700 transition-colors duration-300'}`}>
          Blog
        </NavLink>
        <NavLink to="/contact" onClick={toggleMenu} className={({ isActive }) => `block p-2 rounded ${isActive ? 'text-primary' : 'text-gray-800 hover:bg-yellow-200 hover:text-gray-700 transition-colors duration-300'}`}>
          Contact Us
        </NavLink>

        {/* Enquire & Login Buttons in Mobile Menu */}
        <div className="flex flex-col space-y-4 mt-6">
          <button onClick={openEnq} className="bg-yellow-200 text-gray-900 px-4 py-2 rounded-md hover:bg-yellow-500 hover:text-white">
            Enquire Now
          </button>
          {advisorData ? (        <div className="relative ">
           
           <button onClick={toggleDropdown} className="flex text-sm items-center px-1 py-1 bg-primary hover:bg-yellow-500 text-gray-50 rounded-md">
           <img 
             src={Profile} // Dummy profile picture
             alt="Profile"
             className="w-8 h-8 rounded-full mr-2" // Adjust size and shape for your design
           />
             {advisorData.name} 
             <FaCaretDown className="ml-2" />{/* Display advisor name */}
           </button>
           {isDropdownOpen && (
             <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg z-20">
               <Link to="/advisor/dashboard" className="block px-4 py-2 text-gray-800 hover:bg-yellow-200">Dashboard</Link>
               <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-yellow-200">Logout</button>
             </div>
           )}
         </div>) : (
            <button onClick={openLogin} className="px-4 hover:scale-105 transition-all duration-500 py-2 bg-primary hover:bg-yellow-500 text-gray-50 rounded-md  text-center gap-2">Login</button>
          )}
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;
