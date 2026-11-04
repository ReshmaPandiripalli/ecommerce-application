const jwt = require("jsonwebtoken");
const User=require("../models/User");
const authMiddleware = (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        return res.status(401).json({
            message: "Access denied. Token required."
        });
    }
    try {
        const decoded = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};
const productPageAuthMiddleware = (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        return res.redirect("/login");
    }
    try {
        req.user = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );
        next();
    } catch (err) {
        return res.redirect("/login");
    }
};
const authorizeRole=(...allowedroles)=>{
  return async(req,res,next)=>{
    try{
        const user=await User.findById(req.user.userId);
        if(!user){
           return res.status(401).json({message:"User Not Found"});
        }
        if(!allowedroles.includes(user.role)){
           return res.status(403).json({message:"Unauthorized"});
        }
        next();
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
  }
}
module.exports = { authMiddleware, productPageAuthMiddleware,authorizeRole};