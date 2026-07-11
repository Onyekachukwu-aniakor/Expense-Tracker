import mongoose from "mongoose";
export const connectDB = async (req,res) => {
    try {
      await mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected to database successfully')
    } catch (error) {
        console.log('Not connected to database')
        process.exit(1);
    }
}