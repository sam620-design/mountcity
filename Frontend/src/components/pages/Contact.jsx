import React, { useState } from 'react';
import { Contactimg, Gmailimg, Locimg, Phoneimg, Whatsappimg } from '../indeximages';
import Scrolltop from '../model/Scrolltop';
import { submitEnquiry } from '../../services/advisorservice';// Import the submission service

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    address: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await submitEnquiry(formData);
      if (response) {
        setIsSubmitted(true); // Show success message
        setFormData({ name: '', phoneNumber: '', address: '' }); // Reset form
      }
    } catch (error) {
      setErrorMessage('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page bg-gray-50">
      <Scrolltop />
      {/* Header Image */}
      <div className="header-image mt-20">
        <img src={Contactimg} alt="Header" className="w-full h-98 object-cover" />
      </div>

      {/* Enquiry Form Section */}
      <div className="container mx-auto mt-10 px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-center text-primary">Enquire Now</h2>

        <div className="flex flex-col lg:flex-row mt-8 lg:space-x-8">
          {/* Form Section */}
          <div className="lg:w-1/2 bg-white shadow-md rounded-lg p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-gray-700">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                  placeholder="Full Name"
                  required
                />
              </div>

              <div>
  <label className="block text-gray-700">Phone Number *</label>
  <div className="flex mt-1">
    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-gray-200 text-gray-600">
      +91
    </span>
    <input
      type="text"
      name="phoneNumber"
      value={formData.phoneNumber}
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-r-md p-2"
      placeholder="Phone Number"
      required
    />
  </div>
</div>


              <div>
                <label className="block text-gray-700">Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                  placeholder="Your Address"
                  required
                ></textarea>
              </div>

              <div className="flex items-center">
                <input type="checkbox" className="mr-2" required />
                <p className="text-gray-600 text-sm">
                  I authorize Nutan Housing Finance to contact me via Email, SMS, WhatsApp, and Call.
                </p>
              </div>

              <button className="w-full bg-primary text-white py-2 rounded-md hover:bg-gold-700 transition" disabled={loading}>
                {loading ? 'Sending...' : 'Send'}
              </button>

              {isSubmitted && <p className="text-green-500 mt-4">Your enquiry has been submitted!</p>}
              {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
            </form>
          </div>

          {/* Contact Info Section */}
          <div className="lg:w-1/2 mt-8 lg:mt-0 flex flex-col justify-center bg-white shadow-md rounded-lg p-6 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="shrink-0">
                <div className="inline-block rounded-md bg-yellow-200 p-2 text-primary">
                  <img src={Locimg} className="w-8 h-8" alt="Location" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold md:text-lg text-md">Address</h4>
                <p>Jhunki Baba Road, Patel Nagar,<br/> Near RDH School, Rajgir(Bihar), 803116 </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="shrink-0">
                <div className="inline-block rounded-md bg-yellow-200 p-2 text-primary">
                  <img src={Gmailimg} className="w-8 h-8" alt="Email" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold md:text-lg text-md">Email Us</h4>
                <p><a href='mailto:info@nutanhousing.com'>info@nutanhousing.com</a></p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="shrink-0">
                <div className="inline-block rounded-md bg-yellow-200 p-2 text-primary">
                  <img src={Whatsappimg} className="w-8 h-8" alt="WhatsApp" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold md:text-lg text-md">WhatsApp</h4>
                <p><a href='https://wa.me/+918539804930'>+91 8539804930</a></p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="shrink-0">
                <div className="inline-block rounded-md bg-yellow-200 p-2 text-primary">
                  <img src={Phoneimg} className='w-8 h-8' alt="Phone" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold md:text-lg text-md">Mobile</h4>
                <p><a href='tel:9471613137'>+91 9471613137</a></p>
              </div>
            </div>
          </div>
        </div>

        {/* Office Location Section */}
        <div className="mt-12 mb-8">
          <h3 className="text-2xl font-bold text-primary text-center ">Our Office Location</h3>
          <div className="mt-4">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m23!1m12!1m3!1d1520.0141366690384!2d85.41153957139385!3d25.02649657373828!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m8!3e6!4m0!4m5!1s0x39f2ef1818029df5%3A0x9d8186901d533dd8!2sJhunki%20Baba%20Road%2C%20near%20RDH%20School%2C%20Patel%20Nagar%2C%20Rajgir%2C%20Bihar%20803116!3m2!1d25.0264617!2d85.4121411!5e0!3m2!1sen!2sin!4v1728647837794!5m2!1sen!2sin"
              style={{ border: 0 }}
              allowFullScreen=""
              className="w-full h-96 rounded-lg"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Map"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
