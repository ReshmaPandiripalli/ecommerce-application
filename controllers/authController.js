const User=require("../models/User");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const dotenv=require("dotenv");
dotenv.config();
const crypto=require("crypto");
const nodemailer=require("nodemailer");

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
};
const registeredUser=async(req,res)=>{
    try{
        const{name,email,password}=req.body;
         if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }
        const existedEmail=await User.findOne({email});
        if(existedEmail){
            return res.status(409).json({message:"Email Already Exists"});
        }
        const hashedPassword=await bcrypt.hash(password,10);
        await User.create({name,email,password:hashedPassword})
        return res.status(201).json({ message: "Registration successful" });
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "Email does not exist"
            });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }
        if (user.role !== req.body.role) {
    return res.status(403).json({
        message: "You are not authorized to login with this role."
    });
}
            const accessToken = jwt.sign(
            { userId: user._id,role:user.role},
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
             );
             const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );
        user.accessToken=accessToken;
        user.refreshToken=refreshToken;
        await user.save();
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
            path: "/"
        });
        res.cookie("refreshToken",refreshToken,{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path:"/"
        });
        return res.status(200).json({
            message: "Login successful",
            name: user.name,
            email: user.email,
            role:user.role,
            accessToken,
            refreshToken
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "Email does not exist"
            });
        }
        const resetOtp = crypto.randomInt(100000, 1000000).toString();
        user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.resetPasswordOtp = crypto
            .createHash("sha256")
            .update(resetOtp)
            .digest("hex");
        user.otpVerified = false;
        await user.save();

        res.cookie("verifyEmail", email, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 10 * 60 * 1000,
            path: "/"
        });

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset OTP",
            text: `Your password reset OTP is ${resetOtp}. It expires in 10 minutes.`
        });
        return res.status(200).json({
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error("Forgot password request failed:", error.code || error.name, error.responseCode || "", error.message);
        return res.status(500).json({
            message: error.message
        });
    }
};
const verifyResetOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const email = req.cookies.verifyEmail;
        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }
        const hashedOtp = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");
        const user = await User.findOne({
            email,
            resetPasswordOtp: hashedOtp,
            resetOtpExpires: { $gt: new Date() }
        });
        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired OTP"
            });
        }
        user.otpVerified = true;
        await user.save();
        return res.status(200).json({
            message: "OTP verified successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};
const resetPassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const email = req.cookies.verifyEmail || req.body.email;

        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "Email and both passwords are required"
            });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Both passwords do not match"
            });
        }
        const user = await User.findOne({
            email,
            otpVerified: true,
            resetOtpExpires: { $gt: new Date() }
        });
        if (!user) {
            return res.status(400).json({
                message: "OTP is not verified or has expired"
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.otpVerified = false;
        user.resetPasswordOtp = undefined;
        user.resetOtpExpires = undefined;
        await user.save();

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        };

        res.clearCookie("verifyEmail", cookieOptions);

        const resetToken = jwt.sign(
            {
                userId: user._id,
                purpose: "password-reset"
            },
            process.env.RESET_TOKEN_SECRET,
            { expiresIn: "10m" }
        );
        res.cookie("resetToken", resetToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 10 * 60 * 1000,
            path: "/"
        });
        return res.status(200).json({
            message: "Password reset successful"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};
const newAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token is required"
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decoded.userId);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        const newAccessToken = jwt.sign(
            { userId: user._id,role:user.role },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "10s" }
        );

        user.accessToken = newAccessToken;
        await user.save();

        res.cookie("accessToken", newAccessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000
        });

        return res.status(200).json({
            message: "New access token generated"
        });

    } catch (err) {
        if (
            err.name === "TokenExpiredError" ||
            err.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                message: "Refresh token is invalid or expired"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};
const logoutUser = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token is required"
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decoded.userId);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        user.accessToken = undefined;
        user.refreshToken = undefined;
        await user.save();

        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);

        return res.status(200).json({
            message: "Logout successful"
        });

    } catch (err) {
        if (
            err.name === "TokenExpiredError" ||
            err.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                message: "Invalid or expired refresh token"
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};
const createInitialAdmin=async(req,res)=>{
   try{
     const {email,name,password,setUpSecret}=req.body;
    if(!email||!name||!password||!setUpSecret){
        return res.status(400).json({message:"Email,name,password,setUpSecrt are required"})
    }
    if(setUpSecret!==process.env.ADMIN_SETUP_SECRET){
        return res.status(403).json({message:"ForBidden"});
    }
    const user=await User.findOne({role:"admin"});
    if(user){
        return res.status(403).json({message:"ForBidden"});
    }
    const registeredUser=await User.findOne({email:email});
    if(registeredUser){
        return res.status(409).json({message:"Already Email Registered"});
    }
    const hashPassword=await bcrypt.hash(password,10);
    const newUser=await User.create({
        name:name,
        email:email,
        password:hashPassword,
        role:"admin"
    })
    if(newUser){
        const{email,role}=newUser;
        return res.status(201).json({message:"New Admin Created",email,role});
    }
   }
   catch(err){
    res.status(500).json({message:err.message});
   }
}
const getCurrentUser=async(req,res)=>{
       try{
         const id=req.user.userId;
        const user=await User.findById(id);
        if(user){
            return res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
});}
else{
        return res.status(400).json({message:"User Does not exists"});
        }
       }
       catch(err){
        return res.status(500).json({message:err.message});
       }
}
module.exports={registeredUser,loginUser,newAccessToken,forgotPassword,verifyResetOtp,resetPassword,logoutUser,createInitialAdmin,getCurrentUser};
