const {getAllUsers,updateUserRole}=require("../controllers/adminController");
const{authMiddleware,authorizeRole}=require("../middleware/authMiddleWare");
const{deleteUser}=require("../controllers/userController");
const express=require("express");
const router=express.Router();
router.get("/users",authMiddleware,authorizeRole("admin"),getAllUsers);
router.patch("/users/:id/role",authMiddleware,authorizeRole("admin"),updateUserRole);
router.delete("/users/:id",authMiddleware,authorizeRole("admin"),deleteUser);
router.get("/dashboard", authMiddleware, authorizeRole("admin"), (req, res) => {
    res.render("admin-dashboard");
});
module.exports=router;