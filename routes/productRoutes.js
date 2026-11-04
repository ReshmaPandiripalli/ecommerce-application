const {
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    getProducts
} = require("../controllers/productControllers");

const {
    authMiddleware,
    authorizeRole
} = require("../middleware/authMiddleWare");
const express = require("express");
const router = express.Router();
router.get("/", authMiddleware, getProducts);
router.get("/:id", authMiddleware, getProduct);

router.post(
    "/",
    authMiddleware,
    authorizeRole("admin"),
    createProduct
);

router.patch(
    "/:id",
    authMiddleware,
    authorizeRole("admin"),
    updateProduct
);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRole("admin"),
    deleteProduct
);

module.exports = router;