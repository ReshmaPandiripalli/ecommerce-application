
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/product");
const Address = require("../models/Address");
const placeOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            addressId,
            paymentMethod,
            buyNowProductId
        } = req.body;

        if (!addressId) {
            return res.status(400).json({
                message: "Please select a delivery address"
            });
        }

        if (paymentMethod !== "COD") {
            return res.status(400).json({
                message: "Invalid payment method"
            });
        }
        const address = await Address.findOne({
            _id: addressId,
            user: userId
        });
        if (!address) {
            return res.status(404).json({
                message: "Address not found"
            });
        }

        let orderItems = [];
        let totalAmount = 0;
        if (buyNowProductId !== null &&
            buyNowProductId !== undefined &&
            buyNowProductId !== "") {

            const numericProductId = Number(buyNowProductId);

            if (
                !Number.isSafeInteger(numericProductId) ||
                numericProductId <= 0
            ) {
                return res.status(400).json({
                    message: "Invalid product ID"
                });
            }

            const product = await Product.findOne({
                productId: numericProductId
            });

            if (!product) {
                return res.status(404).json({
                    message: "Product not found"
                });
            }

            if (product.quantity < 1) {
                return res.status(400).json({
                    message: `Insufficient stock for ${product.name}`
                });
            }

            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: 1
            });

            totalAmount = product.price;
        }
        else {
            const cart = await Cart.findOne({
                user: userId
            }).populate("items.product");

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({
                    message: "Your cart is empty"
                });
            }

            for (const item of cart.items) {
                const product = item.product;

                if (!product) {
                    return res.status(404).json({
                        message: "A product in your cart was not found"
                    });
                }

                if (product.quantity < item.quantity) {
                    return res.status(400).json({
                        message: `Insufficient stock for ${product.name}`
                    });
                }

                orderItems.push({
                    product: product._id,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity
                });

                totalAmount += product.price * item.quantity;
            }
        }
        for (const item of orderItems) {
            const stockUpdate = await Product.updateOne(
                {
                    _id: item.product,
                    quantity: { $gte: item.quantity }
                },
                {
                    $inc: {
                        quantity: -item.quantity
                    }
                }
            );
            if (stockUpdate.modifiedCount !== 1) {
                return res.status(400).json({
                    message: `Insufficient stock for ${item.name}`
                });
            }
        }

        // CREATE ORDER
        const createdOrder = await Order.create({
            user: userId,
            items: orderItems,
            shippingAddress: {
                fullName: address.fullName,
                phone: address.phone,
                addressLine: address.addressLine,
                city: address.city,
                state: address.state,
                pincode: address.pincode
            },
            totalAmount,
            paymentMethod: "COD",
            paymentStatus: "PENDING",
            orderStatus: "CONFIRMED"
        });

        // CLEAR CART ONLY FOR CART CHECKOUT
        if (
            buyNowProductId === null ||
            buyNowProductId === undefined ||
            buyNowProductId === ""
        ) {
            await Cart.findOneAndUpdate(
                { user: userId },
                { $set: { items: [] } }
            );
        }

        return res.status(201).json({
            message: "Order placed successfully",
            order: createdOrder
        });

    } catch (error) {
        console.error("Place order error:", error);

        return res.status(500).json({
            message: "Failed to place order",
            error: error.message
        });
    }
};
const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.userId;

        const orders = await Order.find({ user: userId })
            .populate("items.product")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Order history fetched successfully",
            orders
        });

    } catch (error) {
        console.error("Get my orders error:", error);

        return res.status(500).json({
            message: "Failed to fetch order history",
            error: error.message
        });
    }
};
const cancelOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orderId = req.params.orderId;
        const isAdmin = req.user.role === "admin";
        const filter = {
            _id: orderId,
            orderStatus: {
                $in: ["PENDING", "CONFIRMED"]
            }
        };
        if (!isAdmin) {
            filter.user = userId;
        }
        const order = await Order.findOneAndUpdate(
            filter,
            {
                $set: {
                    orderStatus: "CANCELLED"
                }
            },
            {
                new: true
            }
        );

        if (!order) {
            const existingFilter = { _id: orderId };

            if (!isAdmin) {
                existingFilter.user = userId;
            }

            const existingOrder = await Order.findOne(existingFilter);

            if (!existingOrder) {
                return res.status(404).json({
                    message: "Order not found"
                });
            }

            return res.status(400).json({
                message: `Order cannot be cancelled. Current status: ${existingOrder.orderStatus}`
            });
        }
        for (const item of order.items) {
            await Product.updateOne(
                { _id: item.product },
                {
                    $inc: {
                        quantity: item.quantity
                    }
                }
            );
        }
        return res.status(200).json({
            message: "Order cancelled successfully",
            order
        });
    } catch (error) {
        console.error("Cancel order error:", error);
        return res.status(500).json({
            message: "Failed to cancel order",
            error: error.message
        });
    }
};
module.exports = { placeOrder,getMyOrders,cancelOrder };
