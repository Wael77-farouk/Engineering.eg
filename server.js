console.log("🔍 Starting Server...");

import 'dotenv/config';  
import express from 'express';
import cors from 'cors';
import connectDB from './Config/mongodb.js';
import connectCloudinary from './Config/cloudinary.js';
import userRouter from './Routes/userRoute.js'
import productRouter from './Routes/productRoute.js'
import projectRoutes from './Routes/projectRoutes.js';

// App config
const app = express();
const port = process.env.PORT || 4000;
connectDB()
console.log("✅ connectDB() finished");

connectCloudinary()
console.log("✅ connectCloudinary() finished");


// middlewares
app.use(express.json());
app.use(cors());

app.use("/api/projects", projectRoutes);
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)

// api endpoints
app.get('/', (req, res) => {
    res.send("API Working");
});


app.listen(port, () => console.log('Server started on PORT : ' + port));