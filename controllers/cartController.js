const Cart = require("../models/Cart");
const Product = require("../models/product");
const mongoose = require("mongoose");

const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required"
            });
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: "Invalid Product ID"
            });
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }
        const userId = req.user.userId;
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            const newCart = new Cart({
                user: userId,
                items: [
                    {
                        product: productId,
                        quantity: 1
                    }
                ]
            });
            await newCart.save();
            return res.status(201).json({
                message: "Product added to cart"
            });
        }
        const existingProduct = await Cart.findOne({
            user: userId,
            "items.product": productId
        });
        if (existingProduct) {
            await Cart.updateOne(
                {
                    user: userId,
                    "items.product": productId
                },
                {
                    $inc: {
                        "items.$.quantity": 1
                    }
                }
            );
            return res.status(200).json({
                message: "Product quantity updated in cart"
            });
        }
        await Cart.updateOne(
            { user: userId },{$push: {items: {product: productId, quantity: 1}}}
        );
        res.status(200).json({
            message: "Product added to cart"
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
const getCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cart = await Cart.findOne({
            user: userId
        }).populate("items.product");
        if (!cart) {
            return res.status(200).json({
                items: []
            });
        }
        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
const updateCartItem=async(req,res)=>{
    try{
        const productId=req.params.productId;
        const userId=req.user.userId;        
        if(!mongoose.Types.ObjectId.isValid(productId)){
            return res.status(400).json({message:"Invalid Product ID"});
        }  
                const { quantity } = req.body; 
        if(!quantity || quantity<1){
            return res.status(400).json({message:"Quantity should be greater than 0"});
        }
        console.log(quantity);
        const user=await Cart.findOne({user:userId});
        if(!user){
            return res.status(404).json({message:"Cart not found"});
        }else{
            const product=await Cart.findOne({user:userId,"items.product":productId});
            if(!product){
                return res.status(404).json({message:"Product not found in cart"});
            }else{
               const result= await Cart.updateOne(
                    {user:userId,"items.product":productId},
                    {$set:{"items.$.quantity":quantity}}
                );
                if(result.matchedCount===0){
                    return res.status(404).json({message:"Product not found in cart"});
                }else{  
                    return res.status(200).json({message:"Cart item updated successfully"});
                }
            }
        }
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}
const removeCartItem=async(req,res)=>{
   try{
    const productId=req.params.productId;
const userId=req.user.userId;
if(!mongoose.Types.ObjectId.isValid(productId)){
    return res.status(400).json({message:"Invalid Product ID"});
}
else{
    const user=await Cart.findOne({user:userId});
    if(!user){
    return res.status(404).json({message:"Cart not found"});
    }
    else{
        const product=await Cart.findOne({user:userId,"items.product":productId});
        if(!product){
            return res.status(404).json({message:"Product not found in cart"});
        }
        else{
            const result=await Cart.updateOne(
                {user:userId},
                {$pull:{items:{product:productId}}}
            );  
            if(result.modifiedCount===0){
                return res.status(404).json({message:"Product not found in cart"});
            }
            else{
                return res.status(200).json({message:"Product removed from cart successfully"});
            }
        }
    }
}
   }
catch(err){
    res.status(500).json({message:err.message});
}
   }
const clearCart=async(req,res)=>{
    try{
        const userId=req.user.userId;
        const cart=await Cart.findOne({user:userId});
        if(!cart){
            return res.status(404).json({message:"Cart not found"});
        }
        else{
            await Cart.updateOne({user:userId},{$set:{items:[]}});
            return res.status(200).json({message:"Cart cleared successfully"});
        }
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}
module.exports = {addToCart,getCart,updateCartItem,removeCartItem,clearCart};