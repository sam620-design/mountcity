import { useState,useEffect } from 'react'
import { Footer, Header,Floating, Logo,Login, Enquire} from './components'
import { Outlet } from 'react-router-dom'

function MainLayout() {
    const [loading, setLoading] = useState(true);
  

    useEffect(() => {
      // Simulate loading delay (in real projects, you can use window.onload or actual API/content loading)
      const loadTimeout = setTimeout(() => {
        setLoading(false);
      }, 2000); // Delay for 2 seconds to simulate load
  
      return () => clearTimeout(loadTimeout); // Cleanup on unmount
    }, []);
  
  
  
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isEnqOp,setIsEnqOp] =useState(false);
  
    const openEnq=()=>{
      setIsEnqOp(true)
    }
    const closeEmq=()=>{
      setIsEnqOp(false)
    }
  
    const openLogin = () => {
      setIsLoginOpen(true);
    };
  
    const closeLogin = () => {
      setIsLoginOpen(false);
    };
  
  return (
    <div>

    {loading ? (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
          {/* Spinner or any image */}
          <img src={Logo} alt="Loading..." className="w-42 h-32 animate-pulse" />
        </div>
      ) : (
      <div className='transition-all duration-700 ease-in-out'>
     
      <Header openLogin={openLogin} openEnq={openEnq} />
      {isEnqOp && <Enquire closeEnq={closeEmq}/>}
      {isLoginOpen && <Login closeLogin={closeLogin} />}
      
      <main className='w-full'>
      
        <Outlet context={{ openEnq }}/>
      </main>
      <Floating/>
      <Footer openLogin={openLogin} openEnq={openEnq}/>
      
      </div> )}

    </div>
  )
}

export default MainLayout