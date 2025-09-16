import { v2 as cloudinary } from "cloudinary"
import productModel from "../Models/productModel.js"

// function for add product
const addProduct = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    const image1 = req.files.image1?.[0];
    const image2 = req.files.image2?.[0];
    const image3 = req.files.image3?.[0];
    const image4 = req.files.image4?.[0];
    const file = req.files.file?.[0];

    const images = [image1, image2, image3, image4].filter(Boolean);

    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    let fileUrl = "";
    if (file) {
      const uploadedFile = await cloudinary.uploader.upload(file.path, {
        resource_type: "raw",
      });
      fileUrl = uploadedFile.secure_url;
    }

    const productData = {
      name,
      description,
      category,
      file: fileUrl,
      image: imagesUrl,
      date: Date.now(),
    };

    console.log("Product Data:", productData);

    const product = new productModel(productData);
    await product.save();

    res.json({ success: true, message: "Product added successfully" });
  } catch (error) {
    console.error("Add Product Error:", error.message, error.stack);
    res.json({ success: false, message: error.message });
  }
};


// function for list product
const listProducts = async (req,res) => {
    try {
        const products = await productModel.find({});
        res.json({ success: true, products });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// function for removing product
const removeProduct = async (req,res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Product Removed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// function for single product info
const singleProduct = async (req,res) => {
    try {
        const { productId } = req.body;
        const product = await productModel.findById(productId);
        res.json({ success: true, product });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addProduct, removeProduct, singleProduct, listProducts };