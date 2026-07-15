import app from "./src/app.js";
import { Server } from "socket.io";
import config from "./src/config/config.js";
import ConnectDB from "./src/config/db.js";
import dns from "dns"

dns.setServers(["8.8.8.8", "8.8.4.4"]);

ConnectDB()




app.listen(config.PORT,()=>{
    console.log(`Server is running on port ${config.PORT}`)
})