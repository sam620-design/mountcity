import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Logo } from '.';
import { MdEmail, MdLocationOn, MdPhone } from "react-icons/md";

function Footer({ openLogin, openEnq }) {
  return (
    <div>
      <footer className="bg-[#181818] text-white pt-8">
        <div className="container max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Company Info */}
          <div className="space-y-4 items-center justify-center lg:max-w-xs md:border-1 md:border-r border-gray-400 text-center lg:text-left">
            <Link to=''>
              <div className="flex justify-center lg:justify-start">
                <img src={Logo} alt="Mount City Developers Pvt. Ltd." className="w-10 h-6" />
                <h2 className="text-md ml-2">Mount City Developers Pvt. Ltd.</h2>
              </div>
            </Link>
            <div className="text-gray-400 text-sm">
              <p className='mt-2 gap-2 flex justify-center lg:justify-start items-start'>
                <MdLocationOn className='text-primary w-4 h-4 mt-1 flex-shrink-0' />
                <a 
                  href="https://maps.google.com/maps?q=Mount+City+Developers+Pvt.+Ltd.,+Patel+Nagar,+Jhunki+Baba+Road,+Rajgir,+Bihar" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-white text-center lg:text-left"
                >
                  Jhunki Baba Road, Patel Nagar,<br />Near RDH School, Rajgir, 803116
                </a>
              </p>
              <p className='mt-2 gap-2 flex justify-center lg:justify-start'>
                <MdEmail className='text-primary w-4 h-4' />
                <a href="mailto:info@mountcitydevelopers.com" className="hover:text-white">info@mountcitydevelopers.com</a>
              </p>
              <p className='mt-2 gap-2 flex justify-center lg:justify-start'>
                <MdPhone className='text-primary w-4 h-4' />
                <a href="tel:+919471613137" className="hover:text-white ">+91 9471613137</a>
                <a href="tel:+918539804930" className="hover:text-white">+91 8539804930</a>
              </p>
              <p className='mt-2 text-green-600 ml-6'>Open On Sunday</p>
            </div>
          </div>

          {/* Quick Links & Support */}
          <div className='flex justify-center lg:justify-start gap-14 md:gap-28'>
            <div className='text-center lg:text-left'>
              <h3 className="text-base font-semibold text-primary">Quick Links</h3>
              <ul className="space-y-2 mt-4 text-gray-400 text-sm">
                <li><Link to="/" className="hover:text-primary">Home</Link></li>
                <li><Link to="/blogs" className="hover:text-primary">Gallery</Link></li>
                <li><Link to="/emi_calc" className="hover:text-primary">EMI Calculator</Link></li>
                <li><Link onClick={openLogin} className="hover:text-primary">Become an Advisor</Link></li>
              </ul>
            </div>
            <div className='text-center lg:text-left'>
              <h3 className="text-base font-semibold text-primary">Support</h3>
              <ul className="space-y-2 mt-4 text-sm text-gray-400">
                <li><Link onClick={openEnq} className="hover:text-primary">Enquire Now</Link></li>
                <li><a href="tel:+919471613137" className="hover:text-primary">Customer Support</a></li>
                <li><Link to="/privacy-policy" className="hover:text-primary">Privacy & Policy</Link></li>
                <li><Link to="/terms-conditions" className="hover:text-primary">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>

          {/* Social Links */}
          <div className='text-center lg:text-left lg:mx-auto'>
            <h3 className="text-bse font-semibold text-primary">Follow Us On</h3>
            <div className="flex justify-center lg:justify-start space-x-6 mt-4">
              <a href="https://www.facebook.com/mountcity.developers/" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary">
                <FaFacebookF size={24} />
              </a>
              <a href="https://www.instagram.com/mountcity.developers/" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary">
                <FaInstagram size={24} />
              </a>
              <a href="#" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary">
                <FaYoutube size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-4 border-t border-gray-400 pt-4 text-center text-gray-400 text-sm pb-4">
          <p>© Mount City Developers Pvt. Ltd. 2026, All rights reserved.</p>
          <p>Developed by <a href="https://aevandigital.com" target="_blank" rel="noreferrer" className="font-bold bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-transparent bg-clip-text hover:opacity-80 transition-opacity">Aevan Digital</a></p>
        </div>
      </footer>
    </div>
  );
}

export default Footer;
