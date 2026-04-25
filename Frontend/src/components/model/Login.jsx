import { useState,useEffect } from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { advisorLogin, advisorSignup } from "../../services/advisorservice";
import { useNavigate } from "react-router-dom";

function Login({ closeLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false);
  const navigate=useNavigate()
  let logoutTimer;
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };


  // Separate state for login and signup
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'advisor'
  });

  // Update login data on input change
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  // Update signup data on input change
  const handleSignupChange = (e) => {
    let { name, value } = e.target;
    if (name === 'phoneNumber') {
      value = value.replace(/[^0-9]/g, '').slice(0, 10);
    }
    setSignupData((prevData) => ({
      ...prevData,
      [name]: value
    }));
    // Clear field error on change
    if (signupErrors[name]) setSignupErrors(prev => ({ ...prev, [name]: '' }));
  };

  const [signupErrors, setSignupErrors] = useState({});

  const validateSignup = () => {
    const e = {};
    if (!signupData.name.trim() || signupData.name.trim().length < 2) e.name = 'Please enter your full name (min 2 chars)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) e.email = 'Please enter a valid email address';
    if (!/^[0-9]{10}$/.test(signupData.phoneNumber)) e.phoneNumber = 'Phone number must be exactly 10 digits';
    if (!signupData.password || signupData.password.length < 6) e.password = 'Password must be at least 6 characters';
    setSignupErrors(e);
    return Object.keys(e).length === 0;
  };
  const handleLogout = () => {
 
    sessionStorage.clear();
    setAdvisorData(null); // Clear advisor data
    setIsDropdownOpen(false); // Close the dropdown
    navigate('/') // Redirect to login page (or your desired route)
  };
  const resetTimer = () => {
    if (logoutTimer) clearTimeout(logoutTimer);
    logoutTimer = setTimeout(handleLogout, 30 * 60 * 1000); // Set timeout for 30 minutes
  };
  
  useEffect(() => {
    if (sessionStorage.getItem('token')) {
      resetTimer();
    }

    // Reset timer on user activity
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    // Cleanup event listeners on unmount
    return () => {
      clearTimeout(logoutTimer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, []);
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const { email, password } = loginData;
      const response = await advisorLogin({ email, password });

      if (response.token) {
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('advisorData', JSON.stringify(response.advisor));
        // Store token
        setSuccessMessage('Login successful!');
        if (typeof closeLogin === 'function') closeLogin();  // Close modal
        navigate('/advisor/dashboard');  // Redirect to dashboard
      } else {
        setErrorMessage('Login failed: Token not received.');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Login failed');
    }finally {
      setIsLoading(false); // Stop loading
    }
  };


  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!validateSignup()) return;

    setIsLoading(true);
    try {
      const response = await advisorSignup(signupData);
      console.log('Signup successful:', response);
      setSuccessMessage('Signup successful! Please wait till you are verified');
      setSignupData({ name: '', email: '', phoneNumber: '', password: '', role: 'advisor' });
      setSignupErrors({});
    } catch (error) {
      setErrorMessage(error.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-lg p-2">
        <div className="bg-white p-8 rounded-lg w-full max-w-md relative transition-all duration-700 ease">
          <button
            onClick={closeLogin}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"
          >
            {/* Close button */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex justify-center mb-8">
            <button
              id="login-tab"
              onClick={() => {
                setIsLogin(true);
                setLoginData({ email: '', password: '' }); // Reset login form data
                setErrorMessage(''); // Clear previous error messages
                setSuccessMessage(''); // Clear previous success messages
              }}
              className={`${isLogin ? 'bg-yellow-500' : 'bg-yellow-200'} text-white px-4 py-2 rounded-t-md mr-1 focus:outline-none`}
            >
              Login
            </button>
            <button
              id="signup-tab"
              onClick={() => {
                setIsLogin(false);
                setSignupData({ name: '', email: '', phoneNumber: '', password: '', role: 'advisor' }); // Reset signup form data
                setErrorMessage(''); // Clear previous error messages
                setSuccessMessage(''); // Clear previous success messages
              }}
              className={`${isLogin ? 'bg-yellow-200' : 'bg-yellow-500'} text-gray-800 px-4 py-2 rounded-t-md focus:outline-none`}
            >
              Sign Up
            </button>
          </div>

          {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}
          {successMessage && <p className="text-green-500 text-center">{successMessage}</p>} {/* Success message */}

          {isLogin ? (
            <div id="login-form">
              <h2 className="text-xl md:text-2xl font-bold mb-4">Login</h2>
              <form onSubmit={handleLogin}>
                <div className="mb-2">
                  <label className="block mb-1 text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={loginData.email} // Use loginData here
                    onChange={handleLoginChange} // Use handleLoginChange here
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="mb-2 relative">
                  <label className="block mb-1 text-gray-700">Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={loginData.password} // Use loginData here
                    onChange={handleLoginChange} // Use handleLoginChange here
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="Enter your password"
                    required
                  />
                  <div
                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="text-gray-500" size={20} />
                    ) : (
                      <FaEye className="text-gray-500" size={20} />
                    )}
                  </div>
                  <a href="#" className="text-sm text-yellow-700">
                    Forgot Password?
                  </a>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gold text-white px-4 py-2 rounded-md shadow-lg bg-primary hover:bg-yellow-500 transition duration-300"
                >
                  {isLoading ? (
                    <div className="flex justify-center items-center">
                      <div className="animate-spin loader mr-2"></div> Logging in...
                    </div>
                  ) : "Login"}
                </button>
              </form>
            </div>
          ) : (
            <div id="signup-form">
              <h2 className="text-xl md:text-2xl font-bold mb-4">Sign Up</h2>
              <form onSubmit={handleSignup}>
                <div className="mb-2">
                  <label className="block mb-1 text-gray-700 font-medium">Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={signupData.name}
                    onChange={handleSignupChange}
                    className={`w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 ${signupErrors.name ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-yellow-400'}`}
                    placeholder="Enter your full name"
                    required
                  />
                  {signupErrors.name && <p className="text-xs text-red-500 mt-1 font-semibold">{signupErrors.name}</p>}
                </div>
                <div className="mb-2">
                  <label className="block mb-1 text-gray-700 font-medium">Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    className={`w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 ${signupErrors.email ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-yellow-400'}`}
                    placeholder="Enter your email"
                    required
                  />
                  {signupErrors.email && <p className="text-xs text-red-500 mt-1 font-semibold">{signupErrors.email}</p>}
                </div>
                <div className="mb-2">
  <label className="block mb-1 text-gray-700 font-medium">Phone Number* <span className="text-xs text-gray-400 font-normal">(10 digits)</span></label>
  <div className="flex items-center">
    <span className="px-3 py-2 bg-gray-200 text-gray-700 rounded-l-md border border-gray-300 text-sm font-bold">+91</span>
    <input
      type="tel"
      name="phoneNumber"
      value={signupData.phoneNumber}
      onChange={handleSignupChange}
      className={`w-full px-4 py-2 rounded-r-md border focus:outline-none focus:ring-2 ${
        signupErrors.phoneNumber ? 'border-red-400 focus:ring-red-300' :
        signupData.phoneNumber.length === 10 ? 'border-green-400 focus:ring-green-300' :
        signupData.phoneNumber.length > 0 ? 'border-orange-400 focus:ring-orange-300' :
        'border-gray-300 focus:ring-yellow-400'
      }`}
      placeholder="10-digit mobile number"
      maxLength={10}
      required
    />
  </div>
  {signupErrors.phoneNumber
    ? <p className="text-xs text-red-500 mt-1 font-semibold">{signupErrors.phoneNumber}</p>
    : <p className={`text-xs mt-1 font-semibold ${signupData.phoneNumber.length === 10 ? 'text-green-600' : 'text-gray-400'}`}>
        {signupData.phoneNumber.length}/10 digits {signupData.phoneNumber.length === 10 ? '✅' : ''}
      </p>
  }
</div>

                <div className="mb-2">
                  <label className="block mb-1 font-medium text-gray-600">Select Role</label>
                  <select
                    name="role"
                    value={signupData.role} // Use signupData here
                    onChange={handleSignupChange} // Use handleSignupChange here
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="advisor">Advisor</option>
                    {/* You can add more role options here if needed */}
                  </select>
                </div>
                <div className="mb-2 relative">
                  <label className="block mb-1 text-gray-700 font-medium">Password*</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    className={`w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 pr-10 ${signupErrors.password ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-yellow-400'}`}
                    placeholder="Minimum 6 characters"
                    required
                  />
                  <div className="absolute mt-6 inset-y-0 right-3 flex items-center cursor-pointer" onClick={togglePasswordVisibility}>
                    {showPassword ? <FaEyeSlash className="text-gray-500" size={20} /> : <FaEye className="text-gray-500" size={20} />}
                  </div>
                  {signupErrors.password && <p className="text-xs text-red-500 mt-1 font-semibold">{signupErrors.password}</p>}
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full text-white px-4 py-2 rounded-md shadow-lg transition duration-300 font-bold ${isLoading ? 'bg-yellow-300 cursor-not-allowed' : 'bg-primary hover:bg-yellow-500'}`}
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
