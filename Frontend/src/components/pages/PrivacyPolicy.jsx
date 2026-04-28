import React, { useEffect } from 'react';
import Scrolltop from '../model/Scrolltop';

function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="font-poppins bg-gray-50 text-gray-800 pb-16">
      <Scrolltop />
      <div className="bg-primary text-white py-16 text-center mt-16">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-lg">Your privacy is important to us at Mount City Developers Pvt. Ltd.</p>
      </div>

      <div className="container mx-auto max-w-4xl px-4 mt-12 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-primary mb-4">1. Introduction</h2>
        <p className="mb-6 leading-relaxed text-justify">
          Welcome to Mount City Developers Pvt. Ltd. This Privacy Policy outlines how we collect, use, and protect your personal information when you use our website or engage with our services. By accessing our platform, you agree to the collection and use of information in accordance with this policy.
        </p>

        <h2 className="text-2xl font-bold text-primary mb-4">2. Information We Collect</h2>
        <p className="mb-6 leading-relaxed text-justify">
          We may collect personal information such as your name, email address, phone number, and physical address when you voluntarily submit it through our contact forms, career applications, or property enquiries. We also automatically collect non-personally identifiable information such as IP addresses, browser types, and usage data to improve our website experience.
        </p>

        <h2 className="text-2xl font-bold text-primary mb-4">3. How We Use Your Information</h2>
        <ul className="list-disc pl-6 mb-6 leading-relaxed text-justify">
          <li>To respond to your inquiries and provide customer support.</li>
          <li>To process job applications and coordinate career opportunities.</li>
          <li>To send promotional materials, updates, and newsletters (you may opt-out at any time).</li>
          <li>To improve the functionality and user experience of our website.</li>
        </ul>

        <h2 className="text-2xl font-bold text-primary mb-4">4. Data Sharing and Protection</h2>
        <p className="mb-6 leading-relaxed text-justify">
          We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties without your consent, except to trusted third parties who assist us in operating our website or conducting our business, provided those parties agree to keep this information confidential. We implement a variety of security measures to maintain the safety of your personal information.
        </p>

        <h2 className="text-2xl font-bold text-primary mb-4">5. Cookies</h2>
        <p className="mb-6 leading-relaxed text-justify">
          Our website may use "cookies" to enhance user experience. You may choose to set your web browser to refuse cookies or to alert you when cookies are being sent. If you do so, note that some parts of the website may not function properly.
        </p>

        <h2 className="text-2xl font-bold text-primary mb-4">6. Changes to This Privacy Policy</h2>
        <p className="mb-6 leading-relaxed text-justify">
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
        </p>

        <h2 className="text-2xl font-bold text-primary mb-4">7. Contact Us</h2>
        <p className="mb-6 leading-relaxed text-justify">
          If you have any questions about this Privacy Policy, please contact us at: <br/>
          <strong>Email:</strong> info@mountcitydevelopers.com<br/>
          <strong>Phone:</strong> +91 9471613137<br/>
          <strong>Address:</strong> Patel Nagar, Jhunki Baba Road, Rajgir, Bihar, India
        </p>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
