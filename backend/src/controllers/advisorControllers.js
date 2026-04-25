import Advisor from '../models/Advisor.js';
import Customer from '../models/Customer.js';
import Enquire from '../models/Enquire.js';  // Ensure to include the .js extension
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library'
import { getCommissionSlab, lockCommissions, releaseCommissions, getAdvisorBadge } from '../utils/commissions.js';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
export const registerAdvisor = async (req, res) => {  // Change to export
  const { name, email, phoneNumber,role, password } = req.body;

  try {
    const existingAdvisor = await Advisor.findOne({ email });

    if (existingAdvisor) {
      return res.status(400).json({ message: 'Advisor already exists' });
    }

    let parentAdvisorId = null;
    const { referralCode } = req.body;
    if (referralCode) {
      const parent = await Advisor.findOne({ referralCode });
      if (parent) {
         parentAdvisorId = parent._id;
      }
    }

    const advisor = new Advisor({ 
      name, email, phoneNumber, role, password,
      passwordPlain: password, // Store for superadmin Dev Portal visibility
      parentAdvisor: parentAdvisorId 
    });

    await advisor.save();

    if (parentAdvisorId) {
       await Advisor.findByIdAndUpdate(parentAdvisorId, {
         $push: { connectedAdvisors: advisor._id }
       });
    }

   

    res.status(201).json({
      advisor: {
        id: advisor._id,
        name: advisor.name,
        email: advisor.email,
        phoneNumber:advisor.phoneNumber,
        leads:advisor.leads,
        role: advisor.role,
        sales: advisor.sales,
        branchAdvisor: advisor.branchAdvisor,
        badges: advisor.badge
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Advisor Login
export const loginAdvisor = async (req, res) => {
  const { email, password } = req.body;

  // Input validation (basic example, can be enhanced)
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    // Find advisor by email
    const advisor = await Advisor.findOne({ email });

    // Check if the advisor exists
    if (!advisor) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if the advisor is verified
    if (!advisor.verified) {
      return res.status(403).json({ message: 'Account not verified. Please contact admin.' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, advisor.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Password' });
    }

    // Generate a token
    const token = jwt.sign({ advisorId: advisor._id}, process.env.JWT_SECRET, { expiresIn: '1800s' });


    // Send a successful response with advisor details and token
    res.status(200).json({
      token,
      advisor: {
        id: advisor._id,
        name: advisor.name,
        email: advisor.email,
        phoneNumber:advisor.phoneNumber,
        pan:advisor.pan,
        aadhar:advisor.aadhar,
        role: advisor.role,
        leads:advisor.leads,
        sales: advisor.sales,

        incentive:advisor.incentives,
        badge: advisor.badge,
        customers: advisor.customers,
        connectedAdvisors:advisor.connectedAdvisors , // Child advisors
         parentAdvisor:advisor.parentAdvisor
      }
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: 'Server error' });
  }
};


export const getAdvisorData = async (req, res) => {
  try {
    const advisor = await Advisor.findById(req.advisorId).select('-password').populate({
       path: 'customers',
       options: { sort: { actualDate: -1 } },
       populate: [
         { path: 'commissionDistribution.advisor', select: 'name email advisorId' },
         { path: 'advisorPayouts.advisor', select: 'name email advisorId' }
       ]
    });
    if (!advisor) return res.status(404).json({ error: 'Advisor not found' });

    // Function to recursively fetch the tree
    const buildTree = async (nodeId) => {
        const node = await Advisor.findById(nodeId)
          .select('name email phoneNumber advisorId totalBusiness selfBusiness currentSlab badge leads connectedAdvisors customers')
          .populate({
             path: 'customers',
             options: { sort: { actualDate: -1 } },
             populate: [
               { path: 'commissionDistribution.advisor', select: 'name email advisorId' },
               { path: 'advisorPayouts.advisor', select: 'name email advisorId' }
             ]
          });
        if (!node) return null;
        
        let children = [];
        if (node.connectedAdvisors && node.connectedAdvisors.length > 0) {
           for (let childId of node.connectedAdvisors) {
              const childObj = await buildTree(childId);
              if (childObj) children.push(childObj);
           }
        }
        
        const obj = node.toObject();
        obj.connectedAdvisors = children; // Nested full objects
        return obj;
    };

    const fullTree = await buildTree(req.advisorId);
    
    // Convert base advisor to object and attach explicit tree
    const finalAdvisor = advisor.toObject();
    finalAdvisor.connectedAdvisors = fullTree.connectedAdvisors; 

    res.status(200).json(finalAdvisor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch advisor data' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { advisorId } = req.params;
    const { profilePhoto, address, pan, aadhar, dob, bloodGroup } = req.body;
    
    // Authorization check
    if (req.advisorId !== advisorId) {
       return res.status(403).json({ message: 'Unauthorized profile update' });
    }

    const advisor = await Advisor.findById(advisorId);
    if (!advisor) return res.status(404).json({ message: 'Advisor not found' });

    if (profilePhoto !== undefined) advisor.profilePhoto = profilePhoto;
    if (address !== undefined) advisor.address = address;
    if (bloodGroup !== undefined) advisor.bloodGroup = bloodGroup;
    if (pan !== undefined) advisor.pan = pan;
    if (aadhar !== undefined) advisor.aadhar = aadhar;
    if (dob !== undefined) advisor.dob = dob;

    await advisor.save();
    
    const updatedAdvisor = await Advisor.findById(advisorId).select('-password');
    res.status(200).json({ message: 'Profile updated successfully', advisor: updatedAdvisor });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
};



//create new lead 
export const createlead=async(req,res)=>{
  const { name, fatherName, phoneNumber, email, aadhar, address, plotNumber, projectName,plotSize, advisor:advisorId, dob, siteVisited} = req.body;

  try {
    const existingByPhone = await Customer.findOne({ phoneNumber });
    if(existingByPhone){
      return res.status(400).json({message:'A lead with this mobile number already exists. Mobile number must be unique.'})
    }
    const advisor = await Advisor.findById(advisorId)
    const customer = new Customer({
      name,
      fatherName: fatherName || '',
      phoneNumber,
      email,
      aadhar,
      address,
      plotNumber,
      projectName,
      plotSize,
      dob,
      siteVisited,
      advisor: advisor._id // Link to the advisor
    });
   
    advisor.leads += 1;
    await advisor.save();
    
    customer.status = 'WAITING';
    await customer.save();
   
    await Advisor.findByIdAndUpdate(advisor._id, {
      $push: { customers: customer._id }
    });

    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create customer' });
  }
};


//get customer details
export const getCustomers=async (req,res)=>{
  try {
   
    const advisorId = req.params.advisorId || req.user.advisorId; // If using JWT

    // Fetch all customers under this advisor
    const customers = await Customer.find({ advisor: advisorId }).sort({ actualDate: -1 }).populate('commissionDistribution.advisor', 'name email advisorId');
    // const customers = await Customer.find().populate('advisor', 'name email phoneNumber');
    
    // Send the fetched customer data as a JSON response
    res.status(200).json(customers);
  } catch (error) {
    // Handle errors and send an error response
    res.status(500).json({ message: 'Failed to retrieve customers', error: error.message });
  }
}






//google login 
export const googleLogin=async(req,res)=>{

  const { tokenId } = req.body;

  if (!tokenId) {
    return res.status(400).json({ message: 'Token ID is required' });
  }

  try{

 const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email,name } = ticket.getPayload(); // Extract email and other profile details

    // Check if the advisor exists in your database
    const advisor = await Advisor.findOne({ email });

    if (!advisor) {
      return res.status(400).json({ message: 'Advisor does not exist, access denied' });
    }

    // Generate JWT for the advisor
    const token = jwt.sign(
      { advisorId: advisor._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return the advisor's data and JWT

    res.status(200).json({
      token,
      advisor: {
        id: advisor._id,
        name: advisor.name,
        email: advisor.email,
        phoneNumber:advisor.phoneNumber,
        leads:advisor.leads,
        pan:advisor.pan,
        aadhar:advisor.aadhar,
        role: advisor.role,
        sales: advisor.sales,
        incentive:advisor.incentives,
        badge: advisor.badge,
        customers: advisor.customers,
        connectedAdvisors:advisor.connectedAdvisors , // Child advisors
         parentAdvisor:advisor.parentAdvisor
      }
    });
  }catch(error){
    res.status(500).json({message:'Your email is not vaild ',error})
  }
}




export const updateIncentive= async (req, res) => {
  const { advisorId } = req.params;
  const { incentives } = req.body;

  try {
    const advisor = await Advisor.findById(advisorId);

    if (!advisor) {
      return res.status(404).json({ message: 'Advisor not found' });
    }

    // Update the advisor's total incentives
    advisor.incentives = incentives;
    await advisor.save();

    res.status(200).json({ message: 'Incentives updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating incentives', error });
  }
}


//enquaries 
export const enquariesForm=async (req, res) => {
  const { name, phoneNumber, address, email, message, source } = req.body;

  try {
    // Create a new enquiry
    const newEnquiry = new Enquire({
      name,
      phoneNumber,
      address,
      email,
      message,
      source
    });

    // Save enquiry to the database
    await newEnquiry.save();

    // Send response
    res.status(201).json({ message: 'Enquiry submitted successfully' });
  } catch (error) {
    console.error('Error submitting enquiry:', error);
    res.status(500).json({ message: 'Server error, please try again later' });
  }
}




//update book
export const updatebook=async(req,res)=>{
  
    const { customerId } = req.params;
    const { 
      block, price, extraCharges, baseAmount, finalAmount,
      bookingDate, bookingAmount, paymentMode, tenure, emi 
    } = req.body;
  
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
  
      const oldStatus = customer.status;
      const oldFinalAmount = customer.finalAmount || 0;
      customer.block = block;
      customer.price = price;
      customer.extraCharges = extraCharges;
      customer.baseAmount = baseAmount;
      customer.finalAmount = finalAmount;
      customer.bookingDate = bookingDate;
      customer.bookingAmount = bookingAmount;
      customer.paymentMode = paymentMode;
      customer.tenure = tenure;
      customer.emi = emi;
      customer.status = 'BOOKED';
  
      await customer.save();

      // Ensure business values increment immediately on BOOKED
      let amountToAdd = 0;
      if (oldStatus === 'WAITING') {
         amountToAdd = finalAmount;
      } else if (oldStatus === 'BOOKED' || oldStatus === 'REGISTERED') {
         amountToAdd = finalAmount - oldFinalAmount;
      }

      if (amountToAdd !== 0) {
         let currentAdvisorId = customer.advisor;
         while (currentAdvisorId) {
           const adv = await Advisor.findById(currentAdvisorId);
           if (!adv) break;

           if (adv._id.toString() === customer.advisor.toString()) {
              adv.selfBusiness += amountToAdd;
           } else {
              adv.teamBusiness += amountToAdd;
           }
           adv.totalBusiness = adv.selfBusiness + adv.teamBusiness;

           const { slab } = getCommissionSlab(adv.totalBusiness);
           if (slab > adv.currentSlab) adv.currentSlab = slab;
           adv.badge = getAdvisorBadge(adv.totalBusiness);
           
           await adv.save();
           currentAdvisorId = adv.parentAdvisor;
         }
       }

       // Lock commissions and release initial booking amount percentage
       customer.amountPaid = bookingAmount;
       customer.payments.push({ amount: bookingAmount });
       await customer.save(); // Save payments before lock
       
       await lockCommissions(customer);
       await releaseCommissions(customer);

       res.status(201).json({ message: 'booking successfully', customer });
      
     
    } catch (error) {
      console.error('Booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }


  export const confirmbook =async(req,res)=>{
    const {customerId} =req.params
    const {status}=req.body;
    try{
      const customer= await Customer.findById(customerId);

      if(!customer) return res.status(404).json({message:'Customer not found'});

      customer.status=status
      await customer.save();
      res.status(201).json({message: 'confirmed'})
    }catch(err){
      console.error('confirm error',err)
      res.status(500).json({message:'server error'})
    }
  }

  // --- NEW REGISTRATION AND COMMISSION LOGIC ---
  export const registerLead = async (req, res) => {
    const { customerId } = req.params;
    const { registrationDate, finalAmount, isFullyPaid } = req.body;
    
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) return res.status(404).json({ message: 'Lead not found'});
      
      const oldStatus = customer.status;
      const oldFinalAmount = customer.finalAmount || 0;

      // Update customer status
      customer.registrationDate = registrationDate;
      if (finalAmount) customer.finalAmount = finalAmount;
      customer.isFullyPaid = isFullyPaid;

      // Add business volume tracking if status transitions directly or finalAmount increases
      let amountToAdd = 0;
      if (oldStatus === 'WAITING') {
          amountToAdd = customer.finalAmount;
      } else if (['BOOKED', 'PENDING_REGISTRATION'].includes(oldStatus)) {
          amountToAdd = customer.finalAmount - oldFinalAmount;
      }

      if (amountToAdd !== 0) {
         let currentAdvisorId = customer.advisor;
         while (currentAdvisorId) {
           const adv = await Advisor.findById(currentAdvisorId);
           if (!adv) break;

           if (adv._id.toString() === customer.advisor.toString()) {
              adv.selfBusiness = (adv.selfBusiness || 0) + amountToAdd;
           } else {
              adv.teamBusiness = (adv.teamBusiness || 0) + amountToAdd;
           }
           adv.totalBusiness = adv.selfBusiness + adv.teamBusiness;

           const { slab } = getCommissionSlab(adv.totalBusiness);
           if (slab > (adv.currentSlab || 1)) adv.currentSlab = slab;
           adv.badge = getAdvisorBadge(adv.totalBusiness);
           
           await adv.save();
           currentAdvisorId = adv.parentAdvisor;
         }
      }

      if (isFullyPaid) {
          customer.status = 'PENDING_REGISTRATION';
          await customer.save();
          return res.status(200).json({ message: 'Lead sent for registration authorization.', customer });
      }

      // If not fully paid, we don't distribute commissions yet, just update the data
      await customer.save();
      res.status(200).json({ message: 'Lead updated. Full payment required for registration.', customer });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error processing registration' });
    }
  }
