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
    // 3. response

    const { commentId } = req.params

    if(!commentId || commentId.trim() === ""){
        throw new ApiError(404, "Comment Id cannot be empty")
    }
    if(!isValidObjectId(commentId)){
        throw new ApiError(404, "Comment does not exist")
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

export { getCommentReplies }