import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models.js";
import { User } from "../models/user.models.js";
import { Reply } from "../models/reply.models.js";

const getCommentReplies = asyncHandler( async ( req, res ) => {

    // TODO: get all replies for a comment
    // Steps
    // 1. check comment Id
    // 2. get all replies
    // 3. get likes and like status of replies
    // 4. response

    const { commentId } = req.params

    if(!commentId || commentId.trim() === ""){
        throw new ApiError(400, "Comment Id cannot be empty")
    }
    if(!isValidObjectId(commentId)){
        throw new ApiError(404, "Comment does not exist")
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    const replies = await Reply.aggregate([
        {
            $match:{
                comment: new mongoose.Types.ObjectId(commentId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "repliedBy",
                foreignField: "_id",
                as: "repliedBy",
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
                repliedBy:{
                    $first: "$repliedBy"
                }
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "reply",
                as: "likesOfReply",
                pipeline:[
                    {
                        $project:{
                            reply: 1,
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
                        $size: "$likesOfReply"
                    }
                },
                hasUserLikedReply:{
                    $cond:{
                        if:{
                            $in: [req.user?._id, "$likesOfReply.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ])

    if(!replies || replies.length === 0){
        throw new ApiError(404, "No replies found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            replies,
            "Comment's replies fetched successfully"
        )
    )
})

const addReply = asyncHandler( async ( req, res ) => {

    // TODO: add a reply to a comment
    // Steps 
    // 1. check comment Id
    // 2. check if content is empty or not
    // 3. check authorization
    // 4. create reply
    // 5. check if reply is created or not
    // 6. response

    const { commentId } = req.params
    const { content } = req.body

    if(!commentId || commentId.trim() === ""){
        throw new ApiError(400, "Comment Id cannot be empty")
    }
    if(!isValidObjectId(commentId)){
        throw new ApiError(404, "Comment does not exist")
    }

    if(!content || content.trim() === ""){
        throw new ApiError(400, "Content cannot be empty");
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment doesn't exist")
    }

    const reply = await Reply.create({
        content: content,
        comment: comment,
        repliedBy: req?.user
    })

    if(!reply){
        throw new ApiError(400, "Error occurred when replying")
    }
    
    const createdReply = await Reply.findById(reply?._id)
    if(!createdReply){
        throw new ApiError(500, "Error while replying")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            createdReply,
            "Replied successfully"
        )
    )
})

const updateReply = asyncHandler( async ( req, res ) => {

    // TODO: update a reply
    // Steps 
    // 1. check reply Id
    // 2. check if content is empty
    // 3. check for user authorization
    // 4. update reply 
    // 5. respone

    const { replyId } = req.params
    const { content } = req.body

    if(!replyId || replyId.trim() === ""){
        throw new ApiError(400, "Reply Id cannot be empty")
    }
    if(!isValidObjectId(replyId)){
        throw new ApiError(404, "Reply does not exist")
    }

    if(!content || content.trim() === ""){
        throw new ApiError(400, "Content cannot be empty");
    }
    
    const reply = await Reply.findById(replyId)

    if(!reply){
        throw new ApiError(404, "Reply doesn't exist")
    }
    if(req?.user._id?.toString() !== reply.repliedBy.toString()){
        throw new ApiError(403, "Unauthorized request")
    }

    const updatedReply = await Reply.findByIdAndUpdate(
        reply._id,
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

    if(!updatedReply){
        throw new ApiError(500, "Error while updating reply")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedReply,
            "Reply updated successfully"
        )
    )
})

const deleteReply = asyncHandler( async ( req, res ) => {

    // TODO: delete a reply
    // Steps 
    // 1. check reply Id
    // 2. check for user authorization
    // 3. delete reply 
    // 4. respone

    const { replyId } = req.params

    if(!replyId || replyId.trim() === ""){
        throw new ApiError(400, "Reply Id cannot be empty")
    }
    if(!isValidObjectId(replyId)){
        throw new ApiError(404, "Reply does not exist")
    }
    
    const reply = await Reply.findById(replyId)

    if(!reply){
        throw new ApiError(404, "Reply doesn't exist")
    }
    if(req?.user._id?.toString() !== reply.repliedBy.toString()){
        throw new ApiError(403, "Unauthorized request")
    }

    const deletedreply = await Reply.findByIdAndDelete(reply._id)

    if(!deletedreply){
        throw new ApiError(500, "Error while deleting reply")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Reply deleted successfully"
        )
    )
    
})

export { getCommentReplies, addReply, updateReply, deleteReply }