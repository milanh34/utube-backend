import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler( async ( req, res ) => {
    
    //TODO: create playlist
    // Steps
    // 1. check name and desc
    // 2. check User
    // 3. create playlist 
    // 4. check if playlist created or not 
    // 5. response

    const { name, description } = req.body

    if(!name || name.trim() === ""){
        throw new ApiError(400, "Name cannot be empty")
    }
    if(!description || description.trim() === ""){
        throw new ApiError(400, "Description cannot be empty")
    }

    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    if(!user){
        throw new ApiError(401, "Unauthorized request")
    }

    const playlist = await Playlist.create({
        name: name,
        description: description,
        createdBy: user
    })

    if(!playlist){
        throw new ApiError(500, "Something went wrong when creating playlist")
    }

    const createdPlaylist = await Playlist.findById(playlist?._id)
    if(!createdPlaylist){
        throw new ApiError(500, "Something went wrong while creating the playlist")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            createdPlaylist,
            "playlist created successfully"
        )
    )

})

export { createPlaylist }