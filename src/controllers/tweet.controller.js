import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import { Tweet } from '../models/tweet.model.js';
import { User } from "../models/user.models.js";

const createTweet = asyncHandler( async ( req, res) => {

    const { content } = req.body;
    if(content.trim() === ""){
        throw new ApiError(400, "Content cannot be empty");
    }

    const user = req.user?._id || await User.findOne({
        refreshToken: req.cookies.refreshToken
    });
    if(!user){
        throw new ApiError(400, "Unauthorized request")
    }

    const tweet = await Tweet.create({
        content,
        createdBy: user
    })

    const createdTweet = await Tweet.findById(tweet._id)

    if(!createTweet){
        throw new ApiError(500, "Something went wrong while tweeting");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            createdTweet,
            "Tweeted Successfully"
        )
    )
})

const getUserTweets = asyncHandler( async( req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "User is missing")
    }
})

export { createTweet }