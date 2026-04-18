
import { Aboutus,Mission,Scrolltop,Vision } from '..'
function About() {
  return (
    <div className='font-poppins'>
        <Scrolltop/>
    {/* Header Image Section */}
    <div className="md:mt-0 mt-16">
        <img
            src={Aboutus} // Replace with the path to your header image
            alt="About Us Header"
            className="w-full  object-cover"
        />
      
    </div>

    {/* About Us Content Section */}
    <h2 className="text-2xl lg:text-3xl font-semibold mb-6 text-center mt-6 text-primary">About Nutan Housing</h2>
    <div className='bg-yellow-100'>
    <div className="max-w-7xl mx-auto py-6 md:py-12    ">
       
        <p className="text-md text-gray-900 leading-7 mb-6 mx-4 text-justify font-poppins">
        <span className='text-xl'>Nutan Housing Finance</span> has sustained a steady growth to become the leading real estate developer in the region boasting of outstanding quality, consistency, economy, and creativity. The company has always maintained path breaking status and has pioneered various firsts in India. From trend setting luxury housing to providing homes for the poorest section of Indian Society. When it comes to buying a plot in Rajgir, Nutan Housing is a name that stands tall for its commitment to transparency, trust and customer service. With over 1 decades of experience in the real estate industry, we have carved a niche for ourselves and continue to deliver the highest standards in terms of quality. The real estate industry thrives on competition and as a renowned real estate company in Rajgir, We’re thrilled to take on its many challenges and excel! It is Nutan Housing' Core values of trust, competitive spirit and innovation that have helped us, not just to survive the industry but ace it with several awards that proudly reinforce our belief that uncompromising quality always wins.
<br/><br/>
If you want to buy a plot in Bihar at prime locations of Rajgir, Nutan Housing, the first choice real estate company in Bihar, has just the projects for you. The best real estate company in Bihar — and design your dream home and experience a lifestyle you always wished you had.
        </p>
        
    </div>
    </div>




    <div className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  
              <div className="lg:text-center">
                  <h2
                      className="font-heading mb-4 text-center bg-yellow-100  px-4 py-2 rounded-lg md:w-64 md:mx-auto text-xs font-semibold tracking-widest text-black uppercase title-font">
                      Why choose us?
                  </h2>
                  <p className="font-heading mt-2 text-primary text-2xl lg:text-3xl leading-8 font-semibold tracking-tight  sm:text-4xl">
                    Expert Guidance for Every Step of Your Property Journey
                  </p>
                  <p className="mt-4 max-w-10xl text-md text-justify  font-poppins text-gray-900 lg:mx-auto">
                    Our projects are not just built with brick and mortar, we understand the value of our customer’s emotions attached to a property and so, we take the pledge to put sustained effort to enhance quality and provide value for our customer’s money.

                    A clean and healthy atmosphere is the need of this era, and Nutan Housing pays equal attention to the surroundings, and beautifully landscaped gardens adorning our projects.
                    With Eco-friendly construction, High-quality construction management, and implementation of the newest technology, we provide you with nothing but the best.
                    The resilience in the Company’s vision and ability to acclimatize is what makes us the leading brand in the town.
                  </p>
              </div>
  
              <div className="mt-10">
                  <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                      <div className="relative  hover:shadow-lg hover:shadow-yellow-300 hover:bg-yellow-50 duration-300 transition-all p-4 rounded-lg">
                          <dt>
                            <div
                            className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                            <img src={Mission} />
                        </div>
                              <p className="font-heading ml-16 text-lg text-primary leading-6 font-bold ">Mission</p>
                          </dt>
                          <dd className="mt-2 ml-16 text-base text-gray-900 text-justify font-poppins">
                            Nutan Housing Finance is committed to elevating the property experience through exceptional service, expert guidance, and innovative solutions. Our mission is to guide clients through every step of the property journey with integrity and professionalism, ensuring a seamless and rewarding experience. We strive to exceed expectations by fostering a client-centric approach, ensuring each transaction is handled with care, efficiency and integrity. <br/>
                            Our passion for real estate drives us to create lasting relationships and contribute positively to the communities we serve.

                          </dd>
                      </div>
                      <div className="relative hover:shadow-lg hover:shadow-yellow-300 hover:bg-yellow-50 duration-300 transition-all p-4 rounded-lg">
                          <dt>
                            <div
                            className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                            <img src={Vision} />
                        </div>
                              <p className="font-heading ml-16 text-lg leading-6 text-primary font-bold ">Vision
                              </p>
                          </dt>
                          <dd className="mt-2 ml-16 text-base text-justify text-gray-900"> Our aim is to provide premium housing and commercial developments to our clients at par with international standards so as to provide benchmark quality standards and lifestyles. However care must be taken to keep a price line within the affordability range of the Indian market so that people are able to afford an International lifestyle at a reasonable price. We envision a future where Nutan Housing Finance is synonymous with reliability, cutting-edge solutions, and a passion for creating outstanding real estate experiences that enhance the lives of our clients and enrich our communities.
                          </dd>
                      </div>
                     
                    
                  </dl>
              </div>
  
          </div>
      </div>
 
</div>
  )
}

export default About