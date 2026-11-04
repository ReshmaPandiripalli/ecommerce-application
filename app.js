require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const port = process.env.PORT || 3000;
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes=require("./routes/adminRoutes");
const addressRoutes=require("./routes/addressRoutes");
const { productPageAuthMiddleware } = require("./middleware/authMiddleWare");
const cartRoutes=require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishListRoutes=require("./routes/wishListRoutes");
const cookieParser = require("cookie-parser");
const app = express();
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "hbs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
const path = require("path");
const fileUpload = require("express-fileupload");
 app.use(fileUpload({
      createParentPath:true,
      limits:{
        fileSize:5*1000*1000
      },
      abortOnLimit:true
  }))
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/productdb")
  .then(() => {
    console.log("MongoDb Connected");
  })
  .catch((err) => {
    console.log("Database not connected:", err.message);
  });
  app.use("/admin",adminRoutes);
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart",cartRoutes);
app.use("/address",addressRoutes);
app.use("/orders", orderRoutes);
app.use("/wishlist",wishListRoutes);
app.get("/health", (_req, res) => res.status(200).send("ok"));
app.get("/", (_req, res) => res.redirect("/login"));
app.get("/register", (req, res) => {
    res.render("register");
});
app.get("/login", (req, res) => {
    res.render("login");
});
app.get("/forgot-password", (req, res) => {
    res.render("forgot-password");
});

app.get("/verify-otp", (req, res) => {
    res.render("verify-otp");
});
app.get("/reset-password", (req, res) => {
    res.render("reset-password");
});
app.get("/product-page", productPageAuthMiddleware, (req, res) => {
    res.render("product")
});
app.get("/cart-page", productPageAuthMiddleware, (req, res) => {
    res.render("cart");
});
app.get("/address-page",productPageAuthMiddleware,(req,res)=>{
    res.render("address");
});
app.get("/checkout-page",productPageAuthMiddleware,(req,res)=>{
  res.render("checkout");
})
app.get("/my-orders-page", productPageAuthMiddleware, (req, res) => {
    res.render("my-orders");
});
app.get("/admin-orders-page",productPageAuthMiddleware,(req,res)=>{
  res.render("admin-orders");
});
app.get("/wishlist-page",productPageAuthMiddleware,(req,res)=>{
  res.render("wishlist");
})
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});
