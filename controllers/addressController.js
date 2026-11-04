const User=require('../models/User');
const Address=require('../models/Address');
const addAddress=async(req,res)=>{
    try{
        const {fullName, phone, addressLine, city, state, pincode, isDefault}=req.body;
        const userId=req.user.userId;
        const user=await User.findOne({_id:userId});
        if(!user){
            return res.status(404).json({message:'User not found'});
        }
        if(!addressLine || !city || !state || !pincode||!fullName || !phone){
            return res.status(400).json({message:'Please provide all required fields'});
        }
        const newAddress=await Address.create({
            user:userId,
            fullName,
            phone,
            addressLine,
            city,
            state,
            pincode,
            isDefault
        });
        res.status(201).json({message:'Address added successfully', address:newAddress});
    }catch(error){
        res.status(500).json({message:'Error adding address', error:error.message});
    }
}
const getAddress=async(req,res)=>{
    try{
        const userId=req.user.userId;
        const addresses=await Address.find({user:userId});
        res.status(200).json({message:'Addresses retrieved successfully', addresses});
    }
    catch(error){
        res.status(500).json({message:'Error retrieving addresses', error:error.message});
    }
}
const updateAddress = async (req, res) => {
    try {
        const userId = req.user.userId;
        const addressId = req.params.id;
        const {
            fullName,
            phone,
            addressLine,
            city,
            state,
            pincode,
            isDefault
        } = req.body;

        const address = await Address.findOneAndUpdate(
            { _id: addressId, user: userId },
            {
                fullName,
                phone,
                addressLine,
                city,
                state,
                pincode,
                isDefault
            },
            { new: true, runValidators: true }
        );

        if (!address) {
            return res.status(404).json({
                message: 'Address not found'
            });
        }

        return res.status(200).json({
            message: 'Address updated successfully',
            address
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Error updating address',
            error: error.message
        });
    }
};
const deleteAddress=async(req,res)=>{
    try{
        const userId=req.user.userId;
        const addressId=req.params.id;
        const address=await Address.findOneAndDelete({_id:addressId, user:userId});
        if (!address) {
    return res.status(404).json({
        message: 'Address not found'
    });
}
        res.status(200).json({message:'Address deleted successfully', address});
    }catch(error){
        res.status(500).json({message:'Error deleting address', error:error.message});
    }
}
const setDefaultAddress = async (req, res) => {
    try {
        const userId = req.user.userId;
        const addressId = req.params.id;
        const existingAddress = await Address.findOne({
            _id: addressId,
            user: userId
        });
        if (!existingAddress) {
            return res.status(404).json({
                message: 'Address not found'
            });
        }
        await Address.updateMany(
            { user: userId },
            { $set: { isDefault: false } }
        );
        const address = await Address.findOneAndUpdate(
            { _id: addressId, user: userId },
            { $set: { isDefault: true } },
            { new: true, runValidators: true }
        );
        return res.status(200).json({
            message: 'Default address set successfully',
            address
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Error setting default address',
            error: error.message
        });
    }
};
const addressController={
    addAddress,
    getAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
}
module.exports=addressController;