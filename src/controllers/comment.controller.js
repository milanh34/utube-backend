import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { Tweet } from "../models/tweet.model.js";

const getVideoComments = asyncHandler( async ( req, res ) => {

    // TODO: get all comments for a video
    // Steps
    // 1. check video Id
    // 2. get all comments
    // 3. response

    const { videoId } = req.params

    if(!videoId || videoId.trim() === ""){
        throw new ApiError(404, "Video Id cannot be empty")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "Video does not exist")
    }

    const comments = await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
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
                foreignField: "comment",
                as: "likesOfComment",
                pipeline:[
                    {
                        $project:{
                            comment: 1,
                            likedBy: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                numberOfLikes:{
                    $sum:{
                        $size: "$likesOfComment"
                    }
                },
                hasUserLikedComment:{
                    $cond:{
                        if:{
                            $in: [req.user?._id, "$likesOfComment.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ])

    if(!comments || comments.length === 0){
        throw new ApiError(404, "No comments found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comments,
            "Video's comments fetched successfully"
        )
    )
})

const getTweetComments = asyncHandler( async ( req, res ) => {

    // TODO: get all comments for a tweet
    // Steps
    // 1. check tweet Id
    // 2. get all comments
    // 3. response

    const { tweetId } = req.params

    if(!tweetId || tweetId.trim() === ""){
        throw new ApiError(404, "Tweet Id cannot be empty")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Tweet does not exist")
    }

    const comments = await Comment.aggregate([
        {
            $match:{
                tweet: new mongoose.Types.ObjectId(tweetId)
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
                foreignField: "comment",
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
                            $in: [req.user?._id, "$likesOfTweet.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ])

    if(!comments || comments.length === 0){
        throw new ApiError(404, "No comments found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comments,
            "Tweet's comments fetched successfully"
        )
    )
})

const addCommentToVideo = asyncHandler( async ( req, res ) => {

    // TODO: add a comment to a video
    // Steps 
    // 1. check video Id
    // 2. check if content is empty or not
    // 3. check authorization
    // 4. create comment
    // 5. check if comment is created or not
    // 6. response

    const { videoId } = req.params
    const { content } = req.body

    if(!videoId || videoId.trim() === ""){
        throw new ApiError(404, "Video Id cannot be empty")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "Video does not exist")
    }

    if(!content || content.trim() === ""){
        throw new ApiError(404, "Content cannot be empty");
    }
    
    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    if(!user){
        throw new ApiError(401, "Unauthorized request")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video doesn't exist")
    }

    const comment = await Comment.create({
        content: content,
        video: video,
        createdBy: user
    })

    if(!comment){
        throw new ApiError(500, "Error while commenting")
    }
    
    const createdComment = await Comment.findById(comment?._id)
    if(!createdComment){
        throw new ApiError(500, "Error while posting comment")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            createdComment,
            "Comment added successfully"
        )
    )
})

const addCommentToTweet = asyncHandler( async ( req, res ) => {

    // TODO: add a comment to a tweet
    // Steps 
    // 1. check tweet Id
    // 2. check if content is empty or not
    // 3. check authorization
    // 4. create comment
    // 5. check if comment is created or not
    // 6. response

    const { tweetId } = req.params
    const { content } = req.body

    if(!tweetId || tweetId.trim() === ""){
        throw new ApiError(404, "Tweet Id cannot be empty")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Tweet does not exist")
    }

    if(!content || content.trim() === ""){
        throw new ApiError(404, "Content cannot be empty");
    }
    
    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    if(!user){
        throw new ApiError(401, "Unauthorized request")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet doesn't exist")
    }

    const comment = await Comment.create({
        content: content,
        tweet: tweet,
        createdBy: user
    })

    if(!comment){
        throw new ApiError(500, "Error while commenting")
    }
    
    const createdComment = await Comment.findById(comment?._id)
    if(!createdComment){
        throw new ApiError(500, "Error while posting comment")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            createdComment,
            "Comment added successfully"
        )
    )
})

const updateComment = asyncHandler( async ( req, res ) => {

    // TODO: update a comment
    // Steps 
    // 1. check comment Id
    // 2. check if content is empty
    // 3. check for user authorization
    // 4. update comment 
    // 5. respone

    const { commentId } = req.params
    const { content } = req.body

    if(!commentId || commentId.trim() === ""){
        throw new ApiError(404, "Comment Id cannot be empty")
    }
    if(!isValidObjectId(commentId)){
        throw new ApiError(404, "Comment does not exist")
    }

    if(!content || content.trim() === ""){
        throw new ApiError(404, "Content cannot be empty");
    }
    
    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    const comment = await Comment.findById(commentId)

    if(!user){
        throw new ApiError(404, "User does not exists")
    }
    if(!comment){
        throw new ApiError(404, "Comment doesn't exist")
    }
    if(user._id?.toString() !== comment.createdBy.toString()){
        throw new ApiError(401, "Unauthorized request")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        comment._id,
        {
            $set:
            {
                content: content
            }
        },
        {
            new: true
        }
    )

    if(!updateComment){
        throw new ApiError(500, "Error while updating comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedComment,
            "Comment updated successfully"
        )
    )
})

const deleteComment = asyncHandler( async ( req, res ) => {

    // TODO: delete a comment
    // Steps 
    // 1. check comment Id
    // 2. check for user authorization
    // 3. delete comment 
    // 4. respone

    const { commentId } = req.params

    if(!commentId || commentId.trim() === ""){
        throw new ApiError(404, "Comment Id cannot be empty")
    }
    if(!isValidObjectId(commentId)){
        throw new ApiError(404, "Comment does not exist")
    }
    
    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    const comment = await Comment.findById(commentId)

    if(!user){
        throw new ApiError(404, "User does not exists")
    }
    if(!comment){
        throw new ApiError(404, "Comment doesn't exist")
    }
    if(user._id?.toString() !== comment.createdBy.toString()){
        throw new ApiError(401, "Unauthorized request")
    }

    const deletedComment = await Comment.findByIdAndDelete(comment._id)

    if(!deletedComment){
        throw new ApiError(500, "Error while deleting comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    )
    
})

export { getVideoComments, getTweetComments, addCommentToVideo, addCommentToTweet, updateComment, deleteComment }