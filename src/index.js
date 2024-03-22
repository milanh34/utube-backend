import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env"
})

connectDB()
.then(() => {
    app.on("error", (err) => {
        console.error("Error in connecting MONGODB: ",err)
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Sever is running at PORT ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGODB connection Failure: ", err)
})





// Method 2
/*
import express from "express";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
const app = express()

;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error) => {
            console.error("Error: ", error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening at PORT ${process.env.PORT}`);
        })
    } catch (error) {
        console.error(error)
        throw error
    }
})()
*/