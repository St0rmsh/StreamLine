import mongoose from "mongoose"
import config from "./config.js"

async function ConnectDB(){
    await mongoose.connect(config.MONGODB_URI)
    console.log("Connected to MongoDB");
    
}

export default ConnectDB