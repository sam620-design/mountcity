// services/advisorService.js
import axios from 'axios';
import { apiAdvisors as API_URL } from '../config/api.js';
// Advisor signup API call
export const advisorSignup = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, data);
    return response.data;
  } catch (err) {
    if (err.response && err.response.data) {
      throw err.response.data;
    }
    throw new Error('Network error or server unreachable');
  }
};

// Advisor login API call
export const advisorLogin = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/login`, data); 
  
    return response.data; // Return user data
  } catch (error) {
    const msg = error.response?.data?.message || error.message || 'Login failed';
    throw new Error(msg);
  }
};


//createLead
export const createLead = async (leaddata)=>{
  try{
    const response=await axios.post(`${API_URL}/create-lead`, leaddata);
    return response.data;
  }catch(err){
    if (err.response && err.response.data) {
      throw err.response.data;
    }
    throw err;
  }
};


//google login



//enquaries
export const submitEnquiry = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/enquaries`, data);
    return response.data; // Return the response data
  } catch (err) {
    if (err.response && err.response.data) {
      throw err.response.data;
    }
    throw new Error('Network error or server unreachable');
  }
};


//bookcustomer
export const bookCustomer= async (customerId,bookingData)=>{
  try{
    const response =await axios.post(`${API_URL}/customers/${customerId}/book`,bookingData)
  return response
  }catch(err){
    throw err.response
  }

}

//confirm booking
export const confirmBooking =async(customerId,data)=>{
  try{
    const response = await axios.post(`${API_URL}/customers/${customerId}/confirmbook`,data)
    return response
  }catch(err){
    throw err.response
  }
}

//register lead
export const registerCustomer = async (customerId, registerData) => {
  try {
    const response = await axios.post(`${API_URL}/customers/${customerId}/register`, registerData);
    return response;
  } catch (err) {
    throw err.response || new Error('Network error');
  }
};