import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import { Tweet } from '../models/tweet.model.js';
import { User } from "../models/user.models.js";

const createTweet = asyncHandler( async ( req, res ) => {

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

const getUserTweets = asyncHandler( async( req, res ) => {
    const { userId } = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "User is missing")
    }

    const user = await User.findById({_id: userId})
    if(!user){
        throw new ApiError(400, "User is missing")
    }

    const tweets = await Tweet.find({
        createdBy: userId
    })
    if(!tweets){
        throw new ApiError(404, "No Tweets")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                tweets,
                tweetsLength: tweets.length
            },
            "User tweets fetched successfully"
        )
    )
})

const updateTweet = asyncHandler( async( req, res ) => {
    const { content } = req.body
    const { tweetId } = req.params
    if(!content || content.trim() === ""){
        throw new ApiError(400, "Content cannot be empty")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Tweet does not exists")
    }

    const tweetCreatedBy = await Tweet.findById(tweetId)
    if(!tweetCreatedBy){
        throw new ApiError(404, "Tweet does not exists")
    }

    if(tweetCreatedBy.createdBy.toString() !== req.user?.id.toString()){
        throw new ApiError(400, "Only User who created the tweet can update it")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content: content
            }
        },
        { new: true }
    );
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated successfully"
        )
    )
})

const deleteTweet = asyncHandler( async( req, res ) => {
    const { tweetId } = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Tweet does not exists")
    }

    const tweetCreatedBy = await Tweet.findById(tweetId)
    if(!tweetCreatedBy){
        throw new ApiError(404, "Tweet does not exists")
    }

    if(tweetCreatedBy.createdBy.toString() !== req.user?.id.toString()){
        throw new ApiError(400, "Only User who created the tweet can delete it")
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Tweet Deleted Successfully"
        )
    )
})

export { createTweet, updateTweet, getUserTweets, deleteTweet }