import { useEffect } from 'react';

function Scrolltop() {
  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top of the page
  }, []); // Empty dependency array means this will run once when the component is mounted

  return null; // This component doesn't render anything
}

export default Scrolltop;