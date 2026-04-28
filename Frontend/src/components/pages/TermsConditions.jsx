import React, { useEffect } from 'react';
import Scrolltop from '../model/Scrolltop';

function TermsConditions() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="font-poppins bg-gray-50 text-gray-800 pb-16">
      <Scrolltop />
      <div className="bg-primary text-white py-16 text-center mt-16">
        <h1 className="text-4xl font-bold">Terms & Conditions</h1>
        <p className="mt-4 text-lg">Please read these terms and conditions carefully.</p>
      </div>

      <div className="container mx-auto max-w-4xl px-4 mt-12 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-primary mb-4">1. General</h2>
        <p className="mb-6 leading-relaxed text-justify">
          By accessing and using the website of Mount City Developers Pvt. Ltd., you agree to comply with and be bound by the following Terms and Conditions. These terms govern your use of our platform, services, and any related transactions. If you disagree with any part of these terms, please do not use our website.
        </p>

        <h2 className="text-2xl font-bold text-primary mb-4">2. Services Offered</h2>
        <p className="mb-6 leading-relaxed text-justify">
          Mount City Developers Pvt. Ltd. provides real estate services including, but not limited to, the sale of residential and commercial plots, construction services, and property consulting in and around Rajgir, Bihar. All property descriptions, pricing, and availability are subject to change without prior notice.
        </p>

        <h2 className="text-2xl font-bold text-primary mb-4">3. Accuracy of Information</h2>
        <p className="mb-6 leading-relaxed text-justify">
          While we strive to ensure that all information presented on this website is accurate and up to date, we do not guarantee the completeness, accuracy, or reliability of any content, architectural drawings, site plans, or project specifications. Visual representations, including images and videos, are artistic impressions and may differ from the actual project.
        </p>

        <h2 className="text-2xl font-bold text-primary mb-4">4. Intellectual Property</h2>
        <p className="mb-6 leading-relaxed text-justify">
          All content, trademarks, logos, graphics, and text on this website are the intellectual property of Mount City Developers Pvt. Ltd. Unauthorized use, reproduction, or distribution of any content without prior written permission is strictly prohibited and may result in legal action.
        </p>

        <h2 className="text-2xl font-bold text-primary mb-4">5. User Obligations</h2>
        <p className="mb-6 leading-relaxed text-justify">
          When using our website, you agree not to engage in any unlawful activities, submit false or misleading information, or attempt to disrupt the operation of our platform. You agree to use the site responsibly and in accordance with all applicable laws.
        </p>

        <h2 className="text-2xl font-bold text-primary mb-4">6. Limitation of Liability</h2>
        <p className="mb-6 leading-relaxed text-justify">
          Mount City Developers Pvt. Ltd. shall not be held liable for any direct, indirect, incidental, or consequential damages arising out of your use of or inability to use this website. We are not responsible for the content or practices of any third-party websites linked from our platform.
        </p>

        <h2 className="text-2xl font-bold text-primary mb-4">7. Governing Law</h2>
        <p className="mb-6 leading-relaxed text-justify">
          These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes arising from or related to the use of this website shall be subject to the exclusive jurisdiction of the courts in Bihar.
        </p>

        <h2 className="text-2xl font-bold text-primary mb-4">8. Modifications</h2>
        <p className="mb-6 leading-relaxed text-justify">
          We reserve the right to revise or update these terms and conditions at any time without notice. By continuing to use the website after any modifications are made, you accept and agree to the revised terms.
        </p>
      </div>
    </div>
  );
}

export default TermsConditions;
