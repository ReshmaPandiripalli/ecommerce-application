const User=require('../models/User');
const Cart=require('../models/Cart');
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if (userId === req.user.userId) {
            return res.status(400).json({
                message: "You cannot delete your own account"
            });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        if (user.role === "admin") {
            const adminCount = await User.countDocuments({
                role: "admin"
            });
            if (adminCount <= 1) {
                return res.status(400).json({
                    message: "Cannot delete the last admin"
                });
            }
        }
        await Cart.deleteOne({
            user: userId
        });
        await User.findByIdAndDelete(userId);
        return res.status(200).json({
            message: "User deleted successfully"
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

module.exports={deleteUser};