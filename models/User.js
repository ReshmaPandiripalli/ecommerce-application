const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,           
  },
  password: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
resetPasswordOtp:String,
resetOtpExpires:Date,
otpVerified:{
    type:Boolean,
    default:false
},
role:{
  type:String,
  enum:["admin","user"],
  default:"user"
}
});
  module.exports = mongoose.model("User", UserSchema);