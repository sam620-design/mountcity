import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Route, createRoutesFromElements, RouterProvider } from 'react-router-dom'
import { Home, About, Projects, Blogs, Contact, Career, Login, Enquire, Plot, Emi, AdvisorDash, Team, Incentive, CustomerDetails, CreateLead, AdvisorLeads, AdvisorSales } from './components/index.js'
import AdvisorLayout from './AdvisorLayout.jsx'
import MainLayout from './MainLayout.jsx'
import { GoogleOAuthProvider } from "@react-oauth/google"
import { AppProvider } from './context/AppProvider.jsx'
import './index.css'
import ProjectDetails from './components/pages/ProjectDetails.jsx'
import AllBlogs from './components/pages/AllBlogs.jsx'
import DevPortal from './components/dev/DevPortal.jsx'
import MyPanel from './components/dev/MyPanel.jsx'

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path='/' element={<MainLayout />}>
        <Route path='' element={<Home />} />
        <Route path='/about' element={<About />} />
        <Route path='/projects' element={<Projects />} />
        <Route path='/career' element={<Career />} />
        <Route path='/blogs' element={<Blogs />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/login' element={<Login />} />
        <Route path='/enquire' element={<Enquire />} />
        <Route path='/projects/:id' element={<ProjectDetails />} />
        <Route path="/blogs/:id" element={<AllBlogs />} />
        <Route path='/plot/:projectId' element={<Plot />} />
        <Route path='/emi_calc' element={<Emi />} />


      </Route>

      <Route path="advisor" element={<AdvisorLayout />}>
        <Route path="dashboard" element={<AdvisorDash />} />

        <Route path='create-lead' element={<CreateLead />} />
        <Route path="incentive" element={<Incentive />} />
        <Route path="team" element={<Team />} />
        <Route path="customer-details" element={<CustomerDetails />} />
        <Route path="leads" element={<AdvisorLeads />} />
        <Route path="sales" element={<AdvisorSales />} />
      </Route>
      <Route path="/dev" element={<DevPortal />} />
      <Route path="/mypanel" element={<MyPanel />} />
    </>
  )
)

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId='1006802234305-6efh6hkrvtkj622die4ah1bu41nt9hin.apps.googleusercontent.com'>
    <StrictMode>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </StrictMode>
  </GoogleOAuthProvider>
)
