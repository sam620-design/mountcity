import React from 'react'
import { Careerimg } from '../indeximages'
import Scrolltop from '../model/Scrolltop'

function Career() {
  return (
    <div>
      <Scrolltop/>
    {/* Header Section with Image */}
    <div className="relative mt-20">
      <img 
        src={Careerimg}
        alt="Header"
        className="object-cover w-full h-98"
      />
     
    </div>
    <h1 className='text-center text-primary text-3xl font-semibold mt-10 '>Apply Now</h1>
    {/* Main Form Section */}
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between gap-6">
      {/* Form Section */}
      <div className="w-full md:w-1/2 bg-white shadow-lg rounded-lg p-8">
        <form>
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700">
              Full Name*
            </label>
            <input
              type="text"
              id="fullName"
              className="mt-1 block w-full px-4 py-2 border rounded-md text-sm focus:border-yellow-500 focus:ring-yellow-500"
              placeholder="Full Name"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
              Email Address*
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full px-4 py-2 border rounded-md text-sm focus:border-yellow-500 focus:ring-yellow-500"
              placeholder="Email"
            />
          </div>

          <div className="mb-4">
  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
    Phone Number*
  </label>
  <div className="mt-1 flex">
    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-gray-200 text-gray-600 text-sm">
      +91
    </span>
    <input
      type="tel"
      id="phone"
      className="w-full px-4 py-2 border rounded-r-md text-sm focus:border-yellow-500 focus:ring-yellow-500"
      placeholder="Phone Number"
    />
  </div>
</div>

          
        <div className='mb-4'>
          <label className=" text-sm font-medium">Upload Resume</label>
          <input
            type="file"
            name="resume"
            accept=".pdf,.doc,.docx"
            // onChange={handleFileChange}
            className="mt-1 block  text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-black
            hover:file:bg-indigo-100"
            required
          />
        </div>
          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
              Message*
            </label>
            <textarea
              id="message"
              className="mt-1 block w-full px-4 py-2 border rounded-md text-sm focus:border-yellow-500 focus:ring-yellow-500"
              rows="4"
              placeholder="Type your message"
            ></textarea>
          </div>

          <div className="text-center">
            <button className="bg-yellow-500 text-white font-semibold px-6 py-2 rounded-md hover:bg-yellow-600">
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* Text Section */}
      <div className="w-full md:w-1/2 bg-yellow-100 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-yellow-800 mb-4">Join Our Team</h2>
        <p className="text-md text-gray-600 text-justify font-poppins">Join our team and be part of a company that values talent, dedication, and passion. With exciting opportunities for growth and professional development in the real estate industry, we foster innovation, collaboration, and excellence. Whether you're experienced or starting your career, our supportive and inclusive environment allows you to thrive.
<br/><br/>
   
 
    A clean and healthy atmosphere is the need of this era, and Nutan Housing pays equal attention to the surroundings, and beautifully landscaped gardens adorning our projects.
    
    With Eco-friendly construction, High-quality construction management, NA Plotting and implementation of the newest technology, we provide you with nothing but the best.
    
    Explore job openings, learn about our culture, and make a meaningful impact in real estate. 
    <br/><br/>
    Take the next step in your career journey and join Nutan Housing today.
    
         To shape the future of real estate and join our team, submit your CV to <a href="mailto:info@nutanhousing.com"><b>info@nutanhousing.com</b></a> We look forward to hearing from you!</p>
      </div>
    </div>
  </div>
  )
}

export default Career