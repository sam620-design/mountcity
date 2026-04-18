import React from 'react';
import { useParams } from 'react-router-dom';
import { Blog1, Blog2,Blog3 } from '../indeximages';
import Scrolltop from '../model/Scrolltop';

// Sample blog data for demonstration (Replace with dynamic data source)
const blogPosts = [
  {
    id: 1,
    title: 'The Future of Real Estate Development',
    content:`<p class="my-3">
           
            In the age-old debate of buying versus renting, many people find themselves pondering which option is truly the best fit for their circumstances. While renting offers flexibility and immediate housing solutions, the long-term benefits of homeownership often make it the superior choice. Let's explore why buying a home is generally a better investment and lifestyle decision compared to renting, explained in straightforward terms.
            
            <br><br>
            One of the most significant advantages of buying a home is the opportunity to build equity and ownership over time. When you make mortgage payments each month, you're not just paying rent to a landlord; you're gradually paying off the loan you took to buy the home. This means that with every payment, you're getting closer to fully owning your home. In contrast, renters don't build equity because their monthly payments only cover the cost of living in the property.
            
            <br><br>
            Buying a home provides stability and predictability in housing costs, which is especially important for long-term financial planning. With a fixed-rate mortgage, your monthly payments remain the same throughout the loan term, offering consistency that renters don't enjoy. On the other hand, renters are subject to rent increases at the end of lease terms, which can disrupt their budgets and financial stability.
            
            <br><br>
            Homeownership comes with various tax benefits that renters don't have access to. For example, homeowners can deduct mortgage interest and property taxes from their taxable income, potentially leading to significant savings come tax time. These deductions can help offset the costs of homeownership and make it more financially advantageous compared to renting.
            
            <br><br>
            The integration of green spaces and biophilic design is gaining momentum in sustainable real estate. Incorporating nature into the built environment has proven benefits for health, well-being, and productivity. We will explore the concept of biophilic design and showcase inspiring examples of how developers are integrating natural elements into residential and commercial spaces.
            
            <br><br>
            Owning a home gives you the freedom to customize and personalize your living space according to your preferences. Whether it's painting the walls, renovating the kitchen, or landscaping the backyard, homeowners have the flexibility to make changes that reflect their lifestyle and tastes. On the other hand, renters often can't change things in the place they're living because they have to follow the rules in their lease.
            <br><br>
           
            Beyond the immediate advantages, buying a home offers long-term financial benefits that can positively impact your wealth and financial security. As property values appreciate over time, homeowners stand to gain equity, which can be leveraged for future financial endeavors. Additionally, owning a home provides a sense of security in retirement, as you won't have to worry about monthly rent payments eating into your fixed income.
            
            <br><br>
            In conclusion, while renting may offer short-term flexibility, buying a home is generally the better choice for long-term financial stability and wealth building. By owning a home, you're investing in your future and securing a valuable asset that can be appreciated over time. While buying a home requires careful consideration and financial planning, the benefits of homeownership often outweigh those of renting in the long run. So, if you're weighing your options, consider the advantages of buying a home and take steps towards making a smart investment in your future.</p>`,
    image:Blog1,
    date: 'September 25, 2024',
  },
  {
    id: 2,
    title: 'How to Choose the Best Property for Investment',
    content: `<p class="my-3">
           
            As the world becomes more environmentally conscious, sustainable real estate practices are gaining significant traction. In this blog post, we will explore the future of sustainable real estate and delve into the latest trends and innovations that are shaping the industry. From green building materials to energy-efficient designs, we will uncover how these advancements are not only benefiting the environment but also enhancing the quality of life for residents and investors alike.

            <h2 class="text-lg font-semibold mb-2 mt-4">Green Building Materials:</h2>
            One of the key trends in sustainable real estate is the use of green building materials. From recycled materials to renewable resources, developers are adopting eco-friendly options that minimize environmental impact without compromising on quality and aesthetics. We will discuss the benefits of these materials and explore some innovative examples.
            
            <h2 class="text-lg font-semibold mb-2 mt-4">Energy Efficiency:</h2>
            Energy efficiency is at the forefront of sustainable real estate. Buildings with energy-saving features, such as solar panels, smart lighting, and advanced insulation systems, are becoming increasingly popular. We will delve into the latest technologies and strategies being implemented to reduce energy consumption and lower carbon footprints.
            
            <h2 class="text-lg font-semibold mb-2 mt-4">Net-Zero Buildings:</h2>
            Net-zero buildings, which produce as much energy as they consume, are revolutionizing the real estate landscape. We will examine the concept of net-zero buildings and discuss their potential impact on sustainability goals. From innovative design approaches to integrated renewable energy systems, we will highlight the features that make these buildings a game-changer.
            
            <h2 class="text-lg font-semibold mb-2 mt-4">Green Spaces and Biophilic Design:</h2>
            The integration of green spaces and biophilic design is gaining momentum in sustainable real estate. Incorporating nature into the built environment has proven benefits for health, well-being, and productivity. We will explore the concept of biophilic design and showcase inspiring examples of how developers are integrating natural elements into residential and commercial spaces.
            
            <h2 class="text-lg font-semibold mb-2 mt-4">Smart Building Management Systems:</h2>
            Advancements in technology have given rise to smart building management systems, allowing for efficient monitoring and control of various aspects of a property. We will discuss the role of Internet of Things (IoT) devices, data analytics, and automation in optimizing energy usage, enhancing security, and improving overall building performance.
            
            <h2 class="text-lg font-semibold mb-2 mt-4">The Rise of Green Certifications:</h2>
            Green certifications, such as LEED (Leadership in Energy and Environmental Design) and WELL Building Standard, are becoming increasingly important in sustainable real estate. We will explore the significance of these certifications, their impact on property value, and how they contribute to a more sustainable built environment.
            
            <h2 class="text-lg font-semibold mb-2 mt-4">Conclusion:</h2>
            The future of sustainable real estate is bright, with innovative trends and technologies reshaping the industry. By adopting green building materials, prioritizing energy efficiency, and incorporating biophilic design principles, developers are creating a more sustainable and enjoyable living and working environment. As we move forward, it is essential to embrace these trends and innovations to build a better, greener future for all.`,
    image: Blog2,
    date: 'September 20, 2024',
  },
  {
    id: 3,
    title: 'The Importance of Home: A Cornerstone of Our Lives',
    content: `<p class="my-3">
           
            In today’s fast-paced world, the concept of home holds profound significance that goes far beyond mere bricks and mortar. A home is not just a place to reside; it serves as a sanctuary where we cultivate our identities, forge connections, and create lasting memories. For a real estate company, understanding the deeper meaning of home can enhance how you serve your clients and communities.

            <h2 class="text-lg font-semibold mb-2 mt-4">A Foundation of Security and Stability:</h2>
            
            At its core, home represents security and stability. In a world filled with uncertainties, having a place to call your own provides a sense of grounding. It is where families can establish routines, share meals, and create a nurturing environment. For many, home is synonymous with safety—a haven where individuals can relax, express themselves, and escape the external pressures of daily life. This sense of security is invaluable, particularly for families and individuals facing life’s challenges.            
            <h2 class="text-lg font-semibold mb-2 mt-4">A Space for Personal Growth:</h2>
            
            Home also plays a crucial role in personal growth and development. It is within these walls that we learn, explore, and evolve. Children grow up in homes that shape their values, beliefs, and aspirations. A well-designed home fosters creativity and encourages learning, making it an essential component in the development of future generations. As a real estate company, recognizing the importance of nurturing environments can guide you in helping families find homes that meet their unique needs and aspirations.            
            <h2 class="text-lg font-semibold mb-2 mt-4">Community and Connection:</h2>
            
            Beyond individual households, homes contribute to the larger fabric of community. Neighborhoods are built on relationships, and homes are the starting point for social interactions and connections. A strong sense of community can enhance our quality of life, providing support networks and fostering a sense of belonging. When clients choose a home, they are not just selecting a physical space; they are investing in a community that can provide friendship, support, and shared experiences.            
            <h2 class="text-lg font-semibold mb-2 mt-4"> Economic Impact:</h2>
           
            On a broader scale, homes are vital to the economy. The real estate market significantly impacts job creation, local businesses, and overall economic health. When people buy homes, they invest in their futures and contribute to community growth. For real estate companies, facilitating these transactions means playing a crucial role in strengthening local economies and enhancing the well-being of communities.            
            <h2 class="text-lg font-semibold mb-2 mt-4"> Conclusion:</h2>
          
            In conclusion, the importance of home extends far beyond its physical structure. It embodies security, personal growth, community connection, and identity. As a real estate company, understanding these facets allows you to serve your clients with empathy and insight. By helping individuals and families find their ideal homes, you are not just closing deals; you are enriching lives and contributing to the fabric of society. Embrace this mission, and continue to make a meaningful impact in the world of real estate.
           </p>`,
    image: Blog3,
    date: 'September 28, 2024',
  },
  // Add more blog posts here
];

const AllBlogs = () => {
  const { id } = useParams();
  const blog = blogPosts.find((post) => post.id === parseInt(id));

  if (!blog) {
    return <p>Blog not found</p>;
  }

  return (
    <div>
      <Scrolltop/>
    <img src={blog.image} alt={blog.title} className="w-full h-96 object-cover rounded-lg mb-6" />

    <div className="blog-detail-page container mx-auto px-6 lg:px-8 py-10">
   
      <div className="max-w-4xl mx-auto">
        
      
       
        <h1 className="text-2xl lg:text-3xl font-bold text-primary mb-4">{blog.title}</h1>
        <p className="text-gray-500 text-sm mb-8">Published on {blog.date}</p>

        <div
        className="text-md text-gray-700 "
        dangerouslySetInnerHTML={{
          __html: blog.content
        }}
      />
      </div>
    </div>
    </div>
  );
};

export default AllBlogs;
