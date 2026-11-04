const mongoose = require("mongoose");
const Product = require("../models/product");
const path=require("path");
const fs=require("fs");
const productFields = ["name", "category", "price", "quantity", "images"];

function validateProductInput(body, partial = false) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return "Product details must be an object.";
    }
    const fields = Object.keys(body);
    if (fields.length === 0) {
        return "At least one product field is required.";
    }
    if (fields.some(field => !productFields.includes(field))) {
        return "Invalid product fields.";
    }

    const requiredFields = ["name", "category", "price", "quantity"];
    if (!partial && requiredFields.some(field => !fields.includes(field))) {
        return "Name, category, price and quantity are required.";
    }

    for (const field of fields) {
        const value = body[field];

        if (field === "name" || field === "category") {
            if (typeof value !== "string" || !value.trim()) {
                return `${field} must be a non-empty string.`;
            }
        }
        if (field === "price" || field === "quantity") {
            if (
                value === "" ||
                !Number.isFinite(Number(value)) ||
                Number(value) < 0
            ) {
                return `${field} must be a non-negative number.`;
            }
        }
        if (field === "images") {
            if (!Array.isArray(value) || !value.every(img => typeof img === "string")) {
                return "Images must be an array of strings.";
            }
        }
    }
    return null;
}
const validateProductId = (id, res) => {
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId < 100000 || productId > 999999) {
        res.status(400).json({
            message: "Invalid product ID."
        });
        return false;
    }
    return true;
};
const createProduct = async (req, res) => {
    try {
        const body = req.body || {};
        const validationError = validateProductInput(body);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }
        let productId;
while (true) {
    productId = Math.floor(100000 + Math.random() * 900000);
    const existingProduct = await Product.findOne({ productId });
    if (!existingProduct) {
        break;
    }
}
let uploadedFiles = req.files?.images;
if (uploadedFiles && !Array.isArray(uploadedFiles)) {
    uploadedFiles = [uploadedFiles];
}
if (!uploadedFiles) {
    uploadedFiles = [];
}
const images = [];
const uploadDir = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadDir, { recursive: true });
for (const file of uploadedFiles) {
    const fileName =
        Date.now() +
        "-" +
        Math.random().toString(36).slice(2) +
        path.extname(file.name);
    const uploadPath = path.join(uploadDir, fileName);
    await file.mv(uploadPath);
    images.push(`/uploads/${fileName}`);
}
        const product = await Product.create({
            productId:productId,
            name: body.name,
            category: body.category,
            price: Number(body.price),
            quantity: Number(body.quantity),
            images
        });
        console.log("Generated Product ID:", productId);
        return res.status(201).json(product);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getProducts = async (req, res) => {
    try {
        const { keyword, category, minPrice, maxPrice, sort } = req.query;
        let query = {};
        if (keyword && keyword.trim()) {
            query.name = {
                $regex: keyword.trim(),
                $options: "i"
            };
        }
        if (category && category.trim()) {
            query.category = {
                $regex: `^${category.trim()}$`,
                $options: "i"
            };
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) {
                query.price.$gte = Number(minPrice);
            }
            if (maxPrice !== undefined) {
                query.price.$lte = Number(maxPrice);
            }
            if (
                (minPrice !== undefined && (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0)) ||
                (maxPrice !== undefined && (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0))
            ) {
                return res.status(400).json({
                    message: "Invalid price range"
                });
            }

            if (
                minPrice !== undefined &&
                maxPrice !== undefined &&
                Number(minPrice) > Number(maxPrice)
            ) {
                return res.status(400).json({
                    message: "Minimum price cannot exceed maximum price"
                });
            }
        }

        // Sorting
        let sortOption = { createdAt: -1 };

        switch (sort) {
            case "price_asc":
                sortOption = { price: 1 };
                break;

            case "price_desc":
                sortOption = { price: -1 };
                break;

            case "oldest":
                sortOption = { createdAt: 1 };
                break;

            case "newest":
            default:
                sortOption = { createdAt: -1 };
        }

        const products = await Product.find(query).sort(sortOption);

        return res.status(200).json(products);

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};
const getProduct = async (req, res) => {
    if (!validateProductId(req.params.id, res)) return;
    try {
        const product = await Product.findOne({
            productId: Number(req.params.id)
        });
        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }
        return res.status(200).json(product);
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};
const updateProduct = async (req, res) => {
    if (!validateProductId(req.params.id, res)) return;
    try {
        const product = await Product.findOne({
            productId: Number(req.params.id)
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        const updatePayload = { ...req.body };

        const validationError = validateProductInput(updatePayload, true);
        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        let uploadedFiles = req.files?.images;

        if (uploadedFiles && !Array.isArray(uploadedFiles)) {
            uploadedFiles = [uploadedFiles];
        }

        if (!uploadedFiles) {
            uploadedFiles = [];
        }

        const images = [...product.images];

        const uploadDir = path.join(__dirname, "../uploads");
        fs.mkdirSync(uploadDir, { recursive: true });

        for (const file of uploadedFiles) {
            const fileName = Date.now() + "-" +
                Math.random().toString(36).slice(2) +
                path.extname(file.name);

            const uploadPath = path.join(uploadDir, fileName);

            await file.mv(uploadPath);

            images.push(`/uploads/${fileName}`);
        }

        if (uploadedFiles.length > 0) {
            updatePayload.images = images;
        }
        Object.assign(product, updatePayload);
        await product.save();
        return res.status(200).json(product);
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};
const deleteProduct = async (req, res) => {
    if (!validateProductId(req.params.id, res)) return;

    try {
        const product = await Product.findOne({
            productId: Number(req.params.id)
        });
        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }
        for (const image of product.images) {
            const imagePath = path.join(__dirname, "..", image);

            if (fs.existsSync(imagePath)) {
                await fs.promises.unlink(imagePath);
            }
        }

        await Product.findOneAndDelete({
            productId: Number(req.params.id)
        });

        return res.status(200).json({
            message: "Product and images deleted successfully"
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

module.exports = { createProduct, getProducts, getProduct, updateProduct, deleteProduct };