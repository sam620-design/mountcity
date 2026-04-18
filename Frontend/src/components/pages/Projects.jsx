
import { Project, Scrolltop } from '..';
import { Pro1,Pro2 } from '../indeximages';
import img1 from "../../assets/plot11.jpg"
import { Link } from 'react-router-dom';
import { MdLocationPin } from 'react-icons/md';

const projectsData = [
  {
      id: 1,
      title: "Nutan Villa",
      location:'Rajgir',
      description: "Nutan Villa's area offers outstanding connectivity, making it an ideal location for development. It is conveniently located near major roads and highway, providing easy access to....",
      image:Pro1, // Replace with the correct path to your image
  },
  {
      id: 2,
      title: "Commercial Complex",
      location:'Rajgir',
      description: "A commercial hub designed to meet the needs of modern businesses with high-end amenities and strategic location.",
      image: Pro2,
  },
  {
      id: 3,
      title: "Residential Villas",
      location:'Rajgir',
      description: "Exclusive residential villas offering a private and serene environment, perfect for family living.",
      image: Pro2,
  },
];

function Projects() {
  return (
    <div>
        <Scrolltop/>
            {/* Header Image Section */}
            <div className="relative  mt-20">
                <img
                    src={Project} // Replace with your header image path
                    alt="Projects Header"
                    className="w-full  object-cover"
                />
            
            </div>
            <h2 className="text-2xl lg:text-3xl font-semibold mb-6 text-center mt-6 text-primary">Ongoing Projects</h2>
            <div className='bg-yellow-100'>
            <div className="max-w-7xl  mx-auto py-6 md:py-12    ">

                <p className='text-md text-gray-900 leading-7 mb-6 mx-4 text-justify font-poppins'>At <span className='text-xl'>Nutan Housing Finance</span>, we take pride in redefining modern living through our innovative Housing projects that prioritize both quality and sustainability. Each of our Projects is meticulously designed to harmonize with the surrounding environment while providing residents with the ultimate in comfort and functionality. We understand that a home is more than just a place to live; it’s a sanctuary where life unfolds. That’s why our projects incorporate spacious layouts, modern amenities, and thoughtful details that cater to the diverse needs of families and individuals alike.
<br/>
Our commitment to sustainability is evident in our choice of eco-friendly materials and energy-efficient technologies, ensuring that our homes not only meet today’s standards but also contribute to a healthier planet for future generations. From urban apartments to serene suburban residences, each project reflects our dedication to creating vibrant communities where residents can thrive. We also emphasize accessibility and connectivity, strategically selecting locations that offer easy access to essential services - Parks, and Recreational facilities. Explore our portfolio to see how Nutan Housing is shaping the future of living—where innovation meets community, and every project is a step towards a more sustainable tomorrow...</p>
</div>
</div>
            {/* Ongoing Projects Section */}
            <div className="max-w-7xl mx-auto py-6 px-6">

                <div className="grid grid-cols-1 mt-8 md:mt-12 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projectsData.map((project) => (
                         
                        <div key={project.id} className="bg-white shadow-lg rounded-lg overflow-hidden md:hover:scale-105 transition-all duration-300 ">
                             <Link to={`/projects/${project.id}`} > 
                            <img
                                src={project.image}
                                alt={project.title}
                                className="w-full h-48 object-cover"
                            />    
                            <div className="p-6">
                                <p className='flex font-poppins '> <MdLocationPin className='mr-1 text-red-600'/>{project.location}</p>
                                <h3 className="text-xl font-semibold mb-2 text-primary">{project.title}</h3>
                                <p className="text-gray-700 mb-4 text-sm">{project.description}</p>
                          
                            </div>
                            </Link>
                        </div>
                        
                    ))}
                </div>
            </div>
        </div>
  )
}

export default Projects