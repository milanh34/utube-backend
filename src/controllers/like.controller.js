import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.models.js";
import { Reply } from "../models/reply.models.js";

const toggleVideoLike = asyncHandler( async ( req, res ) => {

    //TODO: toggle like on video
    // Steps
    // 1. check video id
    // 2. check authorization
    // 3. check if already liked or not
    //    a. if not liked, create object
    //    b. if already liked, delete object
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

    const likeObject = {
        likedBy: user,
        video: video
    }
    const hasUserLikedBefore = await Like.findOne(likeObject)

    let toggledVideoLike
    let message
    if(!hasUserLikedBefore){
        toggledVideoLike = await Like.create(likeObject)
        
        const likedVideo = await Like.aggregate([
            {
                $match:{
                    _id: toggledVideoLike._id
                }
            }
        ])

        toggledVideoLike = likedVideo
        message= "Video liked successfully"
    }
    else{
        toggledVideoLike = await Like.findOneAndDelete(likeObject)
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

const toggleTweetLike = asyncHandler( async ( req, res ) => {

    //TODO: toggle like on tweet
    // Steps
    // 1. check tweet id
    // 2. check authorization
    // 3. check if already liked or not
    //    a. if not liked, create object
    //    b. if already liked, delete object
    // 4. response

    const { tweetId } = req.params

    if(!tweetId || tweetId.trim() === ""){
        throw new ApiError(404, "Tweet Id cannot be empty")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Tweet does not exist")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet doesn't exist")
    }

    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    if(!user){
        throw new ApiError(401, "Unauthorized request")
    }

    const likeObject = {
        likedBy: user,
        tweet: tweet
    }
    const hasUserLikedBefore = await Like.findOne(likeObject)

    let toggledTweetLike
    let message
    if(!hasUserLikedBefore){
        toggledTweetLike = await Like.create(likeObject)
        
        const likedTweet = await Like.aggregate([
            {
                $match:{
                    _id: toggledTweetLike._id
                }
            }
        ])
        
        toggledTweetLike = likedTweet
        message= "Tweet liked successfully"
    }
    else{
        toggledTweetLike = await Like.findOneAndDelete(likeObject)
        message= "Like removed from tweet successfully"
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            toggledTweetLike,
            message
        )
    )
})

const toggleCommentLike = asyncHandler( async ( req, res ) => {

    //TODO: toggle like on comment
    // Steps
    // 1. check comment id
    // 2. check authorization
    // 3. check if already liked or not
    //    a. if not liked, create object
    //    b. if already liked, delete object
    // 4. response

    const { commentId } = req.params

    if(!commentId || commentId.trim() === ""){
        throw new ApiError(404, "Comment Id cannot be empty")
    }
    if(!isValidObjectId(commentId)){
        throw new ApiError(404, "Comment does not exist")
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment doesn't exist")
    }

    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    if(!user){
        throw new ApiError(401, "Unauthorized request")
    }

    const likeObject = {
        likedBy: user,
        comment: comment
    }
    const hasUserLikedBefore = await Like.findOne(likeObject)

    let toggledCommentLike
    let message
    if(!hasUserLikedBefore){
        toggledCommentLike = await Like.create(likeObject)

        const likedComment = await Like.aggregate([
            {
                $match:{
                    _id: toggledCommentLike._id
                }
            }
        ])
        
        toggledCommentLike = likedComment
        message= "comment liked successfully"
    }
    else{
        toggledCommentLike = await Like.findOneAndDelete(likeObject)
        message= "Like removed from comment successfully"
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            toggledCommentLike,
            message
        )
    )
})

const toggleReplyLike = asyncHandler( async ( req, res ) => {

    //TODO: toggle like on reply
    // Steps
    // 1. check reply id
    // 2. check authorization
    // 3. check if already liked or not
    //    a. if not liked, create object
    //    b. if already liked, delete object
    // 4. response

    const { replyId } = req.params

    if(!replyId || replyId.trim() === ""){
        throw new ApiError(404, "Reply Id cannot be empty")
    }
    if(!isValidObjectId(replyId)){
        throw new ApiError(404, "Reply does not exist")
    }

    const reply = await Reply.findById(replyId)
    if(!reply){
        throw new ApiError(404, "Reply doesn't exist")
    }

    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    if(!user){
        throw new ApiError(401, "Unauthorized request")
    }

    const likeObject = {
        likedBy: user,
        reply: reply
    }
    const hasUserLikedBefore = await Like.findOne(likeObject)

    let toggledReplyLike
    let message
    if(!hasUserLikedBefore){
        toggledReplyLike = await Like.create(likeObject)

        const likedReply = await Like.aggregate([
            {
                $match:{
                    _id: toggledReplyLike._id
                }
            }
        ])
        
        toggledReplyLike = likedReply
        message= "reply liked successfully"
    }
    else{
        toggledReplyLike = await Like.findOneAndDelete(likeObject)
        message= "Like removed from reply successfully"
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            toggledReplyLike,
            message
        )
    )
})

const getLikedVideos = asyncHandler( async ( req, res ) => {

    // TODO: get all liked videos
    // Steps
    // 1. check user
    // 2. get liked videos using match
    // 3. join creator of those videos
    // 4. response

    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    if(!user){
        throw new ApiError(404, "User not found")
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: user._id,
                video:{
                    $exists: true
                }
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline:[
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
                    }
                ]
            }
        },
        {
            $addFields:{
                video:{
                    $first: "$video"
                }
            }
        }
    ])

    if(!likedVideos){
        throw new ApiError(404, "No Liked Videos")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideos,
            "Liked videos fetched successfully0"
        )
    )
})

const getLikedTweets = asyncHandler( async ( req, res ) => {

    // TODO: get all liked tweets
    // Steps
    // 1. check user
    // 2. get liked tweets using match
    // 3. join creator of those tweets
    // 4. response

    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    if(!user){
        throw new ApiError(404, "User not found")
    }

    const likedTweets = await Like.aggregate([
        {
            $match: {
                likedBy: user._id,
                tweet:{
                    $exists: true
                }
            }
        },
        {
            $lookup:{
                from: "tweets",
                localField: "tweet",
                foreignField: "_id",
                as: "tweet",
                pipeline:[
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
                    }
                ]
            }
        },
        {
            $addFields:{
                tweet:{
                    $first: "$tweet"
                }
            }
        }
    ])

    if(!likedTweets){
        throw new ApiError(404, "No Liked Tweets")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedTweets,
            "Liked tweets fetched successfully0"
        )
    )
})

export { toggleVideoLike, toggleTweetLike, toggleCommentLike, toggleReplyLike, getLikedVideos, getLikedTweets }