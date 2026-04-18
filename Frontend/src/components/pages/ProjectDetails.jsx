import { useState,useEffect } from 'react'

import { Link, useParams } from 'react-router-dom'
import { Raj1,Raj2,Raj5,Raj3,Raj4,Clubimg,Schoolimg,Proj1img,Templeimg,Gymimg,Swimmingimg,Hospitalimg,Marketimg,Kidimg,Parkimg,Waterimg,Hallimg,Movieimg, Img1, Img2, Img3, Img4, Img5, Img6, Rin} from '../indeximages'
import Scrolltop from '../model/Scrolltop'



const projectdetails=[
  {
    id: 1,
    title: 'Nutan Villa',
    description: `    <h1 class="font-bold text-blue-700 text-2xl mb-2 font-poppins">About Rajgir</h1>
      <div class="md:flex text-base">
        <div>
          <p class="my-3 text-justify pr-4 flex">
            Rajgir, located in Bihar's Nalanda district, is a historic and religious site with deep cultural significance in ancient India. It was a major center during the Maurya and Gupta empires and holds religious importance for Buddhism, Jainism, and Hinduism.<br>
            <h1 class="font-semibold text-lg mt-4 mb-2 font-poppins">Religious Significance:</h1>
            Rajgir is especially important in Buddhism. The Griddhakuta Hill (Vulture Peak), where Buddha is said to have delivered many key sermons, is a major pilgrimage site. The Saptaparni Cave, the venue for the first Buddhist council, is another significant location for Buddhist followers. In addition to its Buddhist heritage, Rajgir also holds significance for Jainism.<br>
            <span id="moreText" class="hidden">
              <h1 class="font-semibold text-lg mt-4 mb-2 font-poppins">Natural Beauty:</h1>
              Rajgir is renowned for its natural beauty. The hot springs, such as the Brahmakund, are famous for their therapeutic properties and attract both pilgrims and tourists. These thermal springs are considered sacred and are used for religious rituals and bathing.
              <h1 class="font-semibold text-lg mt-4 mb-2 font-poppins">Historical Sites:</h1>
              Nearby Rajgir is the ancient university of Nalanda, a major center of learning in ancient India. The ruins of Nalanda provide insights into Buddhist education and ancient culture.
              <h1 class="font-semibold text-lg mt-4 mb-2 font-poppins">Modern Developments:</h1>
              Cultural and Religious Projects: Recent years have seen increased investment in cultural and religious projects, including the construction of new temples, the enhancement of existing religious sites, and the promotion of festivals and events to attract tourists.<br>
              Sustainable Tourism: There is a growing focus on sustainable tourism to balance the preservation of Rajgir's cultural heritage with modern development.

              <h1 class="font-semibold text-lg mt-4 mb-2 font-poppins">Economic Growth:</h1>
Rajgir is being developed as a key tourist destination with plans for further infrastructure improvements, including better transport connectivity and hospitality services. Heritage Conservation: Ongoing efforts are focused on conserving and restoring historical sites and promoting archaeological research to uncover and preserve Rajgir’s ancient heritage.
<br><br>
And many more Government project coming to Rajgir....
            </span>
          </p>
        </div>
      </div>`,
    image: Proj1img,
    details: `<section class=" pb-4 mt-8 ">
    <div class=" flex  flex-wrap ">
     
      <div class="w-full ">
        <h2 class="text-3xl font-semibold text-primary font-poppins">Premium Plots for sale in Rajgir</h2>
        <h3 class="text-base text-gray-600 italic mt-2">A Perfect Blend of Nature and Urban Living</h3>
        <p class="mt-4 text-base text-gray-600">
At Nutan Villa, we specialize in providing prime residential plots that empower you to build your dream home. Our meticulously selected plots are situated in Rajgir , offering easy access to essential Amenities - Schools, Parks, Hospitals and Transportation. We understand that the right plot is the foundation of a perfect home, which is why we focus on quality land that meets the highest standards.
<br><br>
  Each of our plots is designed to cater to various lifestyles and budgets, allowing you the flexibility to create a living space that reflects your unique vision. Whether you’re looking for a serene retreat on the outskirts of the city or a vibrant space close to urban conveniences, Nutan Housing has the perfect option for you. Our commitment to transparency ensures that you have all the information you need to make an informed decision. With a focus on customer satisfaction, we provide personalized support throughout the purchasing process. Discover the potential of our plots and start your journey toward building the home you’ve always dreamed of with Nutan Housing Finance—where your vision meets reality...
        </p>
        <div class="flex  items-center py-8">
          <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-40  text-primary">
      
            <!-- Acres -->
            <div>
              <h2 class="md:text-4xl text-3xl  font-semibold">50</h2>
              <p class="text-md text-gray-600">Acres</p>
            </div>
      
            <!-- Plots -->
            <div>
              <h2 class="md:text-4xl text-3xl font-semibold">489</h2>
              <p class="text-md text-gray-600">Plots</p>
            </div>
      
            <!-- Plot Range -->
            <div>
              <h2 class="md:text-4xl text-3xl font-semibold">900-2400</h2>
              <p class="text-md text-gray-600">SQFT(Plots Range)</p>
            </div>
      
            <!-- Price -->
            <div class="md:ml-20">
              <h2 class="md:text-4xl text-3xl font-semibold">₹10L</h2>
              <p class="text-md text-gray-600">Onwards</p>
            </div>
      
          </div>
        </div>
      
      </div>
    </div>
  </section>`,
    
    neighbours:[
      { name: 'K.K. University Phase II', location: 'Location A', distance: '0.5 km' },
      { name: 'Sports Academy', location: 'Location B', distance: '0.5 km' },
      { name: 'Police Training Center', location: 'Location C', distance: '5 km' },
      { name: 'IT City', location: 'Location D', distance: '5 km' },
      { name: 'Rajgir Film City', location: 'Location E', distance: '5 km' },
      { name: 'CRPF Camp Rajgir', location: 'Location A', distance: '7 km' },
      { name: 'Rajgir Railway Station', location: 'Location B', distance: '12 km' },
      { name: 'Jungle Safari', location: 'Location C', distance: '13 km' },
      { name: 'International Cricket Stadium', location: 'Location D', distance: '9 km' },
      { name: 'Brahma Kund', location: 'Location E', distance: '10 km' },
      { name: 'Rajgir Bus Stand', location: 'Location A', distance: '12 km' },
      { name: 'Nalanda University', location: 'Location B', distance: '5.5 km' },
      { name: 'SVM School', location: 'Location C', distance: '13.2 km' },
      { name: 'JNV ', location: 'Location D', distance: '12 km' },
      { name: 'Wildlife Sanctuary', location: 'Location E', distance: '9.4 km' },
      { name: 'Sone Bhandar', location: 'Location A', distance: '14 km' },
      { name: 'Venu Van', location: 'Location B', distance: '10 km' },
      { name: 'Glass bridge', location: 'Location C', distance: '13 km' },
      { name: 'Ghora Katora', location: 'Location D', distance: '17.5 km' },
      { name: 'Rajgir Ropeway & Shanti Stupa', location: 'Location E', distance: '16 km' },
   
   
   
   
    ],

    price: '₹1.5 Cr',
    status: 'Ongoing',
    amenities: ['Swimming Pool', 'Gym','Temple','School','Hospital','Market Place','Kids Play Area','Butterfly Park','Water Fountain','Community Hall','Outdoor Movie','Club House'],
    amenitiesimg: [
      {name: 'Temple',
       img:  Templeimg},
      {name:'School',img:Schoolimg},
      {name:'Hospital',img:Hospitalimg},
      {name:'Gym and Spa',img:Gymimg},
      {name:'Market',img:Marketimg},
      {name:'Kids Play area',img:Kidimg},
      {name:'Swimming Pool',img:Swimmingimg},
      {name:'Water Fountain',img:Waterimg},
      {name:'Butterfly Park',img:Parkimg},
      {name:'Community Hall',img:Hallimg},
      {name:'Outdoor Movie',img:Movieimg},
      {name:'Club',img:Clubimg}
      ],


      gallery:[
        { id: 1, src:Img1, alt: 'Image 1' },
        { id: 2, src: Img2, alt: 'Image 2' },
        { id: 3, src: Img3, alt: 'Image 3' },
        { id: 4, src: Img4, alt: 'Image 4' },
        { id: 5, src: Img5, alt: 'Image 5' },
        { id: 6, src: Img6, alt: 'Image 6' },
      ],


    mapLocation: 'https://www.google.com/maps/embed?...',  
    address: 'Near KK University Phase II Lodipur, Rajgir,803116',
  phone: '+91 9471613137',
  email: 'info@nutanhousing.com',
    propertyDetails: {
      residential: '900 to 2500 sq. ft',
      commercial: '2500 to 5000 sq. ft' ,
 
    },
  },
]


const images = [
  { src:Raj1, alt: "Image 1" },
  { src: Raj2, alt: "Image 2" },
  { src: Raj3, alt: "Image 3" },
  { src: Raj4, alt: "Image 4" },
  { src: Raj5, alt: "Image 5" }
];

function ProjectDetails() {

  const [isexp,setisexp] =useState(false)


 
  // Function to toggle the expanded state
  const toggleExpand = () => {
    setisexp(!isexp);
  };



   const {id} = useParams();
   const project=projectdetails.find((p)=> p.id === parseInt(id));

   if (!project) return <div>OOPS, Project not found</div>

   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedImage, setSelectedImage] = useState(null);
 
   // Function to open the modal and set the selected image
   const openModal = (image) => {
     setSelectedImage(image);
     setIsModalOpen(true);
   };
 
   // Function to close the modal
   const closeModal = () => {
     setIsModalOpen(false);
     setSelectedImage(null);
   };
   const [currentIndex, setCurrentIndex] = useState(0);

   useEffect(() => {
     const slideInterval = setInterval(() => {
       setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
     }, 3000); // Change every 3 seconds
     return () => clearInterval(slideInterval);
   }, []);

  return (

    <div className="  pt-4 ">
      <Scrolltop/>
   
    <img src={project.image} alt={project.title} className="w-full h-96 object-cover mb-8" />
    <div className='max-w-7xl  container mx-auto'>
    
    <h1 className="text-2xl lg:text-3xl font-bold mb-4 text-primary  text-center">{project.title}</h1>
    <div className='bg-yellow-100 p-4 rounded-lg md:flex'>
 <div>
    <div
        className="text-lg text-gray-700 "
        dangerouslySetInnerHTML={{
          __html: project.description.replace('class="hidden"', isexp ? '' : 'class="hidden"')
        }}
      />
      {project.description.includes('class="hidden"') && (
        <button
          onClick={toggleExpand}
          className="text-green-600 hover:underline mt-2"
        >
          {isexp ? 'Less' : 'know More'}
        </button>
      )}
      </div>

      <div className="relative max-w-2xl md:ml-4 mx-auto overflow-hidden rounded-lg">
      <div className="flex transition-transform duration-500 ease-in-out transform"
           style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {images.map((image, index) => (
          <div key={index} className="min-w-full">
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        ))}
      </div>
</div>

</div>
      <div
        className="text-lg text-gray-700 p-4 "
        dangerouslySetInnerHTML={{
          __html: project.details
        }}
      />
      <Link to='/plot' className='bg-green-500 p-3 ml-4 rounded-md shadow-lg   transition-all duration-500 text-white hover:bg-green-600'>
      
      View Plot</Link>


      </div>
<div className='bg-yellow-100 py-10 mt-16 p-4 '>


    <div className="container max-w-7xl   items-center justify-center mx-auto">
      <h2 className="text-2xl lg:text-3xl font-semibold text-primary text-center  mb-4 font-poppins">Project Configuration</h2>
      <table className="w-full mt-8  text-center bg-white shadow-lg rounded-lg">
        <thead className="bg-primary text-white">
          <tr>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Area (Sq Ft)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-t px-6 py-4">Residential Plots</td>
            <td className="border-t px-6 py-4">{project.propertyDetails.residential}</td>
          </tr>
          <tr className="bg-yellow-50 ">
            <td className="border-t px-6 py-4">Commercial Plots</td>
            <td className="border-t px-6 py-4">{project.propertyDetails.commercial}</td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>
    <div className="mb-4 mt-16">
      <div className='max-w-7xl container mx-auto'>

    
      <h3 className="text-2xl lg:text-3xl text-primary text-center font-semibold mb-4">Reliable Infrastructure</h3>
     <img src={Rin}/>
      </div>
    </div>
    
    <div className='bg-yellow-100'>

    <div className=" mb-4 mt-16 py-8">
      <div className='max-w-7xl container mx-auto'>

    
      <h3 className="text-2xl lg:text-3xl text-primary text-center font-semibold mb-4">Amenities</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 mt-8 gap-4">
        {project.amenitiesimg.map((amenity, index) => (
            <div key={index} className="border bg-white p-4 rounded-lg shadow-md text-center hover:scale-105 transition-all duration-500">
          <img  src={amenity.img} alt={amenity.name} className="w-full h-48 object-cover" />
          <h3 className="text-md font-semibold text-gray-700 text-center">{amenity.name}</h3>
          </div>
        ))}
      </div>
      </div>
    </div>
   </div>
 

   
    <div className="max-w-7xl  mx-auto py-12 px-2">
    <div className="container mx-auto">
      <h2 className="text-2xl lg:text-3xl font-semibold mb-8 text-primary text-center">Our Neighbours</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {project.neighbours.map((neighbour, index) => (
          <div key={index} className="border bg-white p-4 rounded-lg shadow-md hover:scale-105 transition-all duration-500">
            <h3 className="text-md font-semibold mb-2 text-center">{neighbour.name}</h3>
            {/* <p className="text-gray-600">Location: {neighbour.location}</p> */}
            <p className="text-gray-600 text-center">{neighbour.distance}</p>
          </div>
        ))}
      </div>
      </div>
    </div>
   

    <div className="bg-yellow-100 py-12  ">
<div className='max-w-7xl container mx-auto'>


    <div className="mb-8 mt-12">
      <h3 className="text-2xl lg:text-3xl font-semibold mb-4 text-primary text-center">Site Location</h3>
      <iframe
        src={project.mapLocation}
        width="100%"
        height="450"
        allowFullScreen=""
        loading="lazy"
        className="border-2 border-gray-300 rounded-lg"
      ></iframe>
    </div>
    <div className="items-center text-center mb-8">
        <h3 className="text-xl text-primary font-semibold">Site Address</h3>
        <p className="text-gray-600">
          <span className="font-semibold">Address:</span> {project.address}
        </p>
        <p className="text-gray-600">
          <span className="font-semibold">Phone:</span> <a href={`tel:${project.phone}`} className="text-blue-500 hover:underline">{project.phone}</a>
        </p>
        <p className="text-gray-600">
          <span className="font-semibold">Email:</span> <a href={`mailto:${project.email}`} className="text-blue-500 hover:underline">{project.email}</a>
        </p>
      </div>

      </div>
      </div>
    <div className=" py-12  ">
      <div className='max-w-7xl container mx-auto'>
      <h2 className="text-2xl lg:text-3xl text-primary font-semibold mb-8 text-center ">Gallery</h2>
      
     
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {project.gallery.map((image) => (
          <div
            key={image.id}
            className="relative cursor-pointer overflow-hidden rounded-lg shadow-md"
            onClick={() => openModal(image)}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="object-cover w-full h-48 transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
          <div className="relative">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-white text-3xl"
              onClick={closeModal}
            >
              &times;
            </button>
            {/* Selected Image */}
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-screen rounded-lg"
            />
          </div>
        </div>
      )}
      </div>
    
 
 

  
    </div>




  )
}
export default ProjectDetails