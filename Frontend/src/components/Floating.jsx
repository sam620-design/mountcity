// src/components/FloatingButtons.js
import React from 'react';
import { FaWhatsapp, FaPhoneAlt } from 'react-icons/fa'; // FontAwesome icons

const Floating = () => {
    const whatsappNumber = "+918539804930"; // Replace with your WhatsApp number
    const callNumber = "+919471613137";     // Replace with your call number

    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
            {/* WhatsApp Button */}
            <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform animate-pulse"
                aria-label="Chat on WhatsApp"
                
            >
                <FaWhatsapp className="text-2xl" />
            </a>

            {/* Call Button */}
            <a
                href={`tel:${callNumber}`}
                className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                aria-label="Call Us"
            >
                <FaPhoneAlt className="text-2xl" />
            </a>
        </div>
    );
};

export default Floating;
