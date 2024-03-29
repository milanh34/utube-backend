import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Video } from "../models/video.models.js";

const getChannelStats = asyncHandler( async ( req, res ) => {

    // TODO: Get the channel stats like total video views, total videos, total likes, total comments etc.
    // Steps 
    // 1. get count of all videos
    // 2. get count of total views
    // 3. get count of total likes
    // 4. get list and count of comments on videos
    // 5. get count of replies 
    // 6. get list and count of videos added in playlists
    // 7. response

    // -------- Method 1 - one aggregation pipeline (complex) with few javascript functions to return data in a simple format --------
    
    const channelStats = await Video.aggregate([
        {
            $match:{
                createdBy: new mongoose.Types.ObjectId(req?.user._id)
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes"
            }
        },
        {
            $lookup:{
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "videoComments",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "commentedBy",
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
                        $lookup:{
                            from: "videos",
                            localField: "video",
                            foreignField: "_id",
                            as: "videoInfo",
                            pipeline:[
                                {
                                    $project:{
                                        title: 1,
                                        description: 1,
                                        thumbnail: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            commentedBy:{
                                $first: "$commentedBy"
                            },
                            videoInfo:{
                                $first: "$videoInfo"
                            }
                        }
                    },
                    {
                        $project:{
                            content: 1,
                            commentedBy: 1,
                            videoInfo: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "replies",
                localField: "videoComments._id",
                foreignField: "comment",
                as: "videoReplies"
            }
        },
        {
            $lookup:{
                from: "playlists",
                localField: "_id",
                foreignField: "videos",
                as: "playlistVideos",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: 'playlistCreator',
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
                            playlistCreator:{
                                $first: "$playlistCreator"
                            }
                        }
                    },
                    {
                        $project:{
                            name: 1,
                            description: 1,
                            playlistCreator: 1
                        }
                    }
                ]
            }
        },
        {
            $group:{
                _id: null,
                videoCount: { $sum: 1 },
                totalViews: { $sum: "$views" },
                totalLikes: { $sum: { $size: "$videoLikes" } },
                totalComments: { $sum: { $size: "$videoComments" } },
                totalReplies: { $sum: { $size: "$videoReplies" } },
                totalVideosInPlaylists: { $sum: { $size: "$playlistVideos" } },
                videoComments: { $push: "$videoComments" },
                playlistVideos: { $push: "$playlistVideos" }
            }
        },
    ])

    if(!channelStats || channelStats.length === 0){
        throw new ApiError(404, "User has no videos")
    }

    let videoComments = []
    let videoPlaylists = []

    const getVideoComments = () => {
        channelStats?.[0]?.videoComments?.map((arrayOfComments) => {
            arrayOfComments?.map((actualComment) => {
                if(actualComment){
                    videoComments.push(actualComment)
                }
            })
        })
    }

    const getVideoPlaylists = () => {
        channelStats?.[0]?.playlistVideos?.map((arrayOfPlaylists) => {
            arrayOfPlaylists?.map((actualPlaylist) => {
                if(actualPlaylist){
                    videoPlaylists.push(actualPlaylist)
                }
            })
        })
    }

    getVideoComments();
    getVideoPlaylists();

    const stats = {
        totalVideos: channelStats?.[0]?.videoCount || 0,
        totalViews: channelStats?.[0]?.totalViews || 0,
        totalLikes: channelStats?.[0]?.totalLikes || 0,
        totalComments: channelStats?.[0]?.totalComments || 0,
        totalReplies: channelStats?.[0]?.totalReplies || 0,
        totalVideosInPlaylists: channelStats?.[0]?.totalVideosInPlaylists || 0,
        videoComments,
        videoPlaylists
    }


    
    // -------- Method 2 - multiple aggregation pipelines (simple) with no javascript function for formatting data --------
    
    // const videoStats = await Video.aggregate([
    //     {
    //         $match:{
    //             createdBy: new mongoose.Types.ObjectId(req?.user._id)
    //         }
    //     },
    //     {
    //         $lookup:{
    //             from: "likes",
    //             localField: "_id",
    //             foreignField: "video",
    //             as: "videoLikes"
    //         }
    //     },
    //     {
    //         $group:{
    //             _id: null,
    //             videoCount: { $sum: 1 },
    //             totalViews: { $sum: "$views" },
    //             totalLikes: { $sum: { $size: "$videoLikes" } },
    //         }
    //     },
    // ])

    // if(!videoStats || videoStats.length === 0){
    //     throw new ApiError(404, "User has no videos")
    // }
    
    // const videoComments = await Video.aggregate([
    //     {
    //         $match:{
    //             createdBy: new mongoose.Types.ObjectId(req?.user?._id)
    //         }
    //     },
    //     {
    //         $lookup:{
    //             from: "comments",
    //             localField: "_id",
    //             foreignField: "video",
    //             as: "Comment",
    //             pipeline:[
    //                 {
    //                     $lookup:{
    //                         from: "users",
    //                         localField: "createdBy",
    //                         foreignField: "_id",
    //                         as: "commentedBy",
    //                         pipeline:[
    //                             {
    //                                 $project:{
    //                                     fullName: 1,
    //                                     username: 1,
    //                                     avatar: 1
    //                                 }
    //                             }
    //                         ]
    //                     }
    //                 },
    //                 {
    //                     $lookup:{
    //                         from: "videos",
    //                         localField: "video",
    //                         foreignField: "_id",
    //                         as: "videoInfo",
    //                         pipeline:[
    //                             {
    //                                 $project:{
    //                                     title: 1,
    //                                     description: 1,
    //                                     thumbnail: 1
    //                                 }
    //                             }
    //                         ]
    //                     }
    //                 },
    //                 {
    //                     $addFields:{
    //                         commentedBy:{
    //                             $first: "$commentedBy"
    //                         },
    //                         videoInfo:{
    //                             $first: "$videoInfo"
    //                         }
    //                     }
    //                 },
    //                 {
    //                     $project:{
    //                         content: 1,
    //                         commentedBy: 1,
    //                         videoInfo: 1
    //                     }
    //                 }
    //             ]
    //         }
    //     },
    //     {
    //         $project:{
    //             Comment: 1
    //         }
    //     },
    //     {
    //         $unwind: "$Comment"
    //     }
    // ])

    // const playlistVideos = await Video.aggregate([
    //     {
    //         $match:{
    //             createdBy: new mongoose.Types.ObjectId(req?.user)
    //         }
    //     },
    //     {
    //         $lookup:{
    //             from: "playlists",
    //             localField: "_id",
    //             foreignField: "videos",
    //             as: "playlist",
    //             pipeline:[
    //                 {
    //                     $lookup:{
    //                         from: "users",
    //                         localField: "createdBy",
    //                         foreignField: "_id",
    //                         as: 'playlistCreator',
    //                         pipeline:[
    //                             {
    //                                 $project:{
    //                                     fullName: 1,
    //                                     username: 1,
    //                                     avatar: 1
    //                                 }
    //                             }
    //                         ]
    //                     }
    //                 },
    //                 {
    //                     $project:{
    //                         name: 1,
    //                         description: 1,
    //                         playlistCreator: 1
    //                     }
    //                 }
    //             ]
    //         }
    //     },
    //     {
    //         $project:{
    //             title: 1,
    //             playlist: 1
    //         }
    //     },
    //     {
    //         $unwind: "$playlist"
    //     }
    // ])

    // const stats = {
    //     totalVideos: videoStats?.[0]?.videoCount || 0,
    //     totalViews: videoStats?.[0]?.totalViews || 0,
    //     totalLikes: videoStats?.[0]?.totalLikes || 0,
    //     totalComments: videoComments?.length || 0,
    //     totalVideosInPlaylist: playlistVideos?.length || 0,
    //     videoComments,
    //     playlistVideos
    // }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            stats,
            "Channel stats fetched successfully"
        )
    )
})

const getChannelVideos = asyncHandler( async ( req, res ) => {

    // TODO: Get all the videos uploaded by the channel
    // Steps 
    // 1. get list of all videos
    // 2. get views of each video
    // 3. get count of likes on each video
    // 4. get count of comments on each video 
    // 5. get count of replies on each video 


})

export { getChannelStats, getChannelVideos }