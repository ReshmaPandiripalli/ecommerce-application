const mongoose=require("mongoose");
const productSchema=new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    productId: {
    type: Number,
    unique: true
},
    images: {
        type: [String],
        default: []
    }
});
module.exports=mongoose.model("Product",productSchema);