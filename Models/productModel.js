import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: Array, required: true },
    file: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: Number, required: true }
});

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;