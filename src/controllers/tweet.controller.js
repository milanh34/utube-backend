import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from '../models/tweet.model.js';
import { User } from "../models/user.models.js";

const createTweet = asyncHandler( async ( req, res ) => {

    // TODO: create a tweet
    // Steps
    // 1. check if content is empty
    // 2. check user authorization
    // 3. create tweet
    // 4. check if tweet is created or not
    // 5. response

    const { content } = req.body;
    if(!content || content.trim() === ""){
        throw new ApiError(404, "Content cannot be empty");
    }

    const user = req.user?._id || await User.findOne({
        refreshToken: req.cookies.refreshToken
    });
    if(!user){
        throw new ApiError(401, "Unauthorized request")
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
    .status(201)
    .json(
        new ApiResponse(
            200,
            createdTweet,
            "Tweeted Successfully"
        )
    )
})

const getUserTweets = asyncHandler( async( req, res ) => {

    // TODO: get all tweets of a user 
    // Steps
    // 1. check user Id 
    // 2. find tweets
    // 3. get likes and like status
    // 4. reposne

    const { userId } = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(404, "User is missing")
    }

    const user = await User.findById({_id: userId})
    if(!user){
        throw new ApiError(404, "User is missing")
    }

    const tweets = await Tweet.aggregate([
        {
            $match:{
                createdBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likeOfTweets",
                pipeline:[
                    {
                        $project:{
                            likedBy: 1,
                            tweet: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                numberOfLikes:{
                    $sum:{
                        $size: "$likeOfTweets"
                    }
                },
                hasUserLikedTweet:{
                    $cond:{
                        if:{
                            $in: [user?._id, "$likeOfTweets.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ])

    if(!tweets){
        throw new ApiError(404, "User has no tweets")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                tweets,
                numberOfTweets: tweets.length
            },
            "User tweets fetched successfully"
        )
    )
})

const getTweetById = asyncHandler( async ( req, res ) => {

    //TODO: get tweet by id
    // Steps
    // 1. check tweet Id
    // 2. get tweet 
    // 3. get creator info
    // 4. get tweet likes
    // 5. response

    const { tweetId } = req.params

    if(!tweetId || tweetId.trim() === ""){
        throw new ApiError(400, "Tweet ID is empty")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Not a valid tweet Id")
    }

    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    if(!user){
        throw new ApiError(404, "User does not exists")
    }

    const tweet = await Tweet.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline:[
                    {
                        $project:{
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                createdBy:{
                    $first: "$createdBy"
                }
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likesOfTweet",
                pipeline:[
                    {
                        $project:{
                            tweet: 1,
                            likedBy: 1
                        }
                    }
                ]
            }
        },{
            $addFields:{
                numberOfLikes:{
                    $sum:{
                        $size: "$likesOfTweet"
                    }
                },
                hasUserLikedTweet:{
                    $cond:{
                        if:{
                            $in: [user?._id, "$likesOfTweet.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ])
    
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet fetched successfully"
        )
    )

})

const updateTweet = asyncHandler( async( req, res ) => {

    // TODO: update a tweet from Id
    // Steps
    // 1. check tweet id 
    // 2. check if content is empty or not
    // 3. check user authorization
    // 4. update tweet
    // 5. response

    const { content } = req.body
    const { tweetId } = req.params

    if(!content || content.trim() === ""){
        throw new ApiError(404, "Content cannot be empty")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Tweet does not exists")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet does not exists")
    }

    if(tweet.createdBy.toString() !== req.user?.id.toString()){
        throw new ApiError(401, "Only User who created the tweet can update it")
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
    .status(201)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated successfully"
        )
    )
})

const deleteTweet = asyncHandler( async( req, res ) => {

    // TODO: delete a tweet from Id
    // Steps
    // 1. check tweet id 
    // 2. check user authorization
    // 3. delete tweet
    // 4. response

    const { tweetId } = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Tweet does not exists")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet does not exists")
    }

    if(tweet.createdBy.toString() !== req.user?.id.toString()){
        throw new ApiError(401, "Only User who created the tweet can delete it")
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            {},
            "Tweet Deleted Successfully"
        )
    )
})

export { createTweet, updateTweet, getUserTweets, getTweetById, deleteTweet }