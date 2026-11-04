const Product = require("../models/product");
const User = require("../models/User");
const Wishlist = require("../models/Wishlist");

const addToWishList = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.user.userId;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product doesn't exist"
            });
        }

        let wishlist = await Wishlist.findOne({ user: userId });
       if (!wishlist) {
            wishlist = await Wishlist.create({
                user: userId,
                products: [productId]
            });

            return res.status(201).json({
                message: "Product added to wishlist",
                wishlist
            });
        }

        const alreadyExists = wishlist.products.some(
            id => id.toString() === productId
        );

        if (alreadyExists) {
            return res.status(200).json({
                message: "Product is already in the wishlist",
                wishlist
            });
        }
        wishlist.products.push(productId);
        await wishlist.save();

        return res.status(200).json({
            message: "Product added to wishlist",
            wishlist
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};
const getWishList=async(req,res)=>{
    try{
        const userId=req.user.userId;
        const wishList=await Wishlist.findOne({user:userId}).populate("products");
        if(!wishList){
            return res.status(200).json({message:"WishList Is Empty",products:[]});
        }
        return res.status(200).json({message:"Products in the wishlist",products:wishList.products});

    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}
const deleteWishList=async(req,res)=>{
    try{
        const productId=req.params.productId;
        const userId=req.user.userId;
        const wishlist=await Wishlist.findOne({user:userId});
        if(!wishlist){
            return res.status(404).json({message:"Wishlist not found"});
        }
        const existproduct=wishlist.products.some(
            id=>id.toString()===productId
        );
        if(!existproduct){
                return res.status(404).json({message:"Product Doe Not Exists"});
        }
        wishlist.products.pull(productId);
        await wishlist.save();
       return res.status(200).json({message:"Product Deleted From WishList",products:wishlist.products});

    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

module.exports = {addToWishList,getWishList,deleteWishList};