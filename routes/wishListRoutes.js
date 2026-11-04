const {addToWishList,getWishList, deleteWishList}=require("../controllers/wishListController");
const express=require("express");
const {authMiddleware}=require("../middleware/authMiddleWare");
const router=express.Router();
router.post("/add/:productId",authMiddleware,addToWishList);
router.get("/",authMiddleware,getWishList);
router.delete("/remove/:productId",authMiddleware,deleteWishList);
module.exports=router;
