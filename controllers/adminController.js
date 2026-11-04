const User=require("../models/User");
const Order=require("../models/Order");
const getAllUsers=async(req,res)=>{
    try{
        const user=await User.find().select("email _id role name");
        if(user){
            res.status(200).json(user);
        }
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { newRole } = req.body;

        if (!["admin", "user"].includes(newRole)) {
            return res.status(400).json({
                message: "Roles should be either admin or user"
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role: newRole },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                message: "User does not exist"
            });
        }

        return res.status(200).json({
            message: "User role updated successfully",
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    }
    catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};
const getAllOrders=async(req,res)=>{
    try{
        const orders=await Order.find().populate("user","name email").populate("items.product").sort({createdAt:-1}); 
        if(orders.length==0){
            return res.status(400).json({message:"Orders Not Available"});
        }
        res.status(200).json({message:"Orders Fetched Successfully",orders})
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus } = req.body;
        const allowedStatuses = [
            "CONFIRMED",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED"
        ];
        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                message: "Invalid Order Status"
            });
        }
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                message: "Order Not Found"
            });
        }
        if (order.orderStatus === "CANCELLED") {
            return res.status(400).json({
                message: "Cancelled order cannot be updated"
            });
        }
         const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { orderStatus: orderStatus },
            { new: true, runValidators: true }
        );
        return res.status(200).json({
            message: "Order Updated Successfully",
            updatedOrder
        });
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
module.exports={getAllUsers,updateUserRole,getAllOrders,updateOrderStatus};