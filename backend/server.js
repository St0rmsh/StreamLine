import app from "./src/app.js";
import {Server} from "socket.io";
import config from "./src/config/config.js";


app.listen(config.PORT,()=>{
    console.log(`Server is running on port ${config.PORT}`)
})