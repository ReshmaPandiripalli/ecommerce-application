const express = require("express");
const router = express.Router();
const{getAllOrders,updateOrderStatus}=require("../controllers/adminController");
const { authMiddleware, authorizeRole } = require("../middleware/authMiddleWare");
const {
    placeOrder,
    getMyOrders,
    cancelOrder
} = require("../controllers/orderController");
router.post("/", authMiddleware, placeOrder);
router.get("/my-orders", authMiddleware, getMyOrders);
router.get("/",authMiddleware,authorizeRole("admin"),getAllOrders);
router.patch("/:orderId/cancel", authMiddleware,authorizeRole("admin"),cancelOrder);
router.patch(
    "/:orderId/status",
    authMiddleware,
    authorizeRole("admin"),
    updateOrderStatus
);
module.exports = router;