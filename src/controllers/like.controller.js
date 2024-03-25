import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.models.js";

const toggleVideoLike = asyncHandler( async ( req, res ) => {

    //TODO: toggle like on video
    // Steps
    // 1. check video id
    // 2. check authorization
    // 3. check if already liked or not
    //    a. if already liked, delete object
    //    b. if not liked, create object
    // 4. response

    const { videoId } = req.params

    if(!videoId || videoId.trim() === ""){
        throw new ApiError(404, "Video Id cannot be empty")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "Video does not exist")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video doesn't exist")
    }

    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    if(!user){
        throw new ApiError(401, "Unauthorized request")
    }

    const hasUserLikedBefore = await Like.findOne({
        likedBy: user
    })

    let toggledVideoLike
    let message
    if(!hasUserLikedBefore){
        toggledVideoLike = await Like.create({
            video: video,
            likedBy: user
        })
        message= "Video liked successfully"
    }
    else{
        toggledVideoLike = await Like.findOneAndDelete({
            video: video,
            likedBy: user
        })
        message= "Like removed from video successfully"
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            toggledVideoLike,
            message
        )
    )
})

export { toggleVideoLike }