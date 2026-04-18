/** @type {import('tailwindcss').Config} */
export default {
  content: [   "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],  // Add Poppins as a custom font
        // You can add more custom fonts here, for example:
        roboto: ['Roboto', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        museo:["MuseoModerno","sans-serif"],
      },


      animation: {
        marquee: 'marquee 20s linear infinite',
        typing: "typing 2s steps(20) infinite alternate, blink .7s infinite"
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },

        typing: {
          "0%": {
            width: "0%",
            visibility: "hidden"
          },
          "100%": {
            width: "100%"
          }  
        },
        blink: {
          "50%": {
            borderColor: "transparent"
          },
          "100%": {
            borderColor: "white"
          }  
        }
      },
    
    
      colors: {
        // Add your custom colors here
        primary: '#daa520',    // Example: custom gold
        secondary: '#FEF9A7',  
        accent: '#F4D35E',     // Example: custom yellow
        neutral: '#333333',    // Example: custom dark gray
        info: '#30BCED',       // Example: custom light blue
        warning: '#FF6F61',    // Example: custom coral
        success: '#84C318',    // Example: custom green
        danger: '#D72638',    
      },
    },
  },
  plugins: [
   
  ],
}

