import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return "Could not find path"

        // upload file on cloudinary
        let res = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // after successful upload
        console.log("File is uploaded on cloudinary", res.url);
        fs.unlinkSync(localFilePath)
        return res;
    } catch (error) {
        fs.unlinkSync(localFilePath)  //removes locally saved temp files as the upload operation got failed
        return null;
    }
}

export { uploadOnCloudinary }