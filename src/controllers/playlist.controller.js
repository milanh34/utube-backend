import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose, { isValidObjectId } from "mongoose";
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

const getPlaylistById = asyncHandler(async (req, res) => {
    
    //TODO: get playlist by id
    // Steps 
    // 1. check playlist Id 
    // 2. get playlist details
    // 3. get creator of playlist
    // 4. get creator of videos in playlist 
    // 5. response

    const { playlistId } = req.params

    if(!playlistId || playlistId.trim() === ""){
        throw new ApiError(400, "Playlist Id cannot be empty")
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Playlist Id is not valid")
    }

    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId)
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
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
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
        }
    ])

    if(!playlist){
        throw new ApiError(401, "Playlist does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist fetched successfully"
        )
    )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {

    // TODO: add a video to the playlist
    // Steps 
    // 1. check olaylist Id 
    // 2. check video Id
    // 3. check user authorization
    // 4. add video to playlist 
    // 5. response

    const { playlistId, videoId } = req.params

    if(!playlistId || playlistId.trim() == ""){
        throw new ApiError(400, "Playlist Id cannot be empty")
    }
    if(!videoId || videoId.trim() == ""){
        throw new ApiError(400, "Video Id cannot be empty")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Playlist Id is not valid")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video Id is not valid")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "Playlist does not exist")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video does not exist")
    }
    const user = await User.findOne({
        refreshToken: req.cookies?.refreshToken
    })
    if(!user){
        throw new ApiError(400, "User not found")
    }
    
    if(user._id?.toString() !== playlist.createdBy?.toString()){
        throw new ApiError(401, "Unauthorized request")
    }

    let saved
    const findVideo = playlist.videos.find((video) => video.equals(videoId))
    if(!findVideo){
        playlist.videos.push(video)
        saved = await playlist.save()
    }
    else{
        throw new ApiError(409, "Video is already present in the playlist")
    }

    if(!saved){
        throw new ApiError(500, "Error while adding video to playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            saved,
            "video added successfully"
        )
    )
})



export { createPlaylist, getPlaylistById, addVideoToPlaylist }