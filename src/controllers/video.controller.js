import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { v2 as cloudinary } from 'cloudinary';


const getAllVideos = asyncHandler( async( req, res ) => {

    //TODO: get all videos based on query, sort, pagination
    // Steps
    // 1. convert page, limit and sortyType to int and check
    // 2. check query
    // 3. getVideos
    //     a. should be published and match with title using regex
    //     b. sort if available
    //     c. add owner details of video
    //     d. check if videos available or not
    //     e. paginate
    // 4. response

    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = 1 } = req.query

    const pageNum = Number.parseInt(page)
    const limitNum = Number.parseInt(limit)
    const sortTypeNum = Number.parseInt(sortType)
    if(!(Number.isFinite(pageNum) && Number.isFinite(limitNum) && Number.isFinite(sortTypeNum))){
        throw new ApiError(404, "Page, Limit and sortType should be integers and finite");
    }

    if(!query || query.trim() === ""){
        throw new ApiError(404, "Query cannot be empty")
    }
    
    const getVideos = await Video.aggregate([
        {
            $match:{
                isPublished: true,
                title: {
                    $regex: query,
                    $options: "i"
                }
            }
        },
        {
            $addFields:{
                sortByField: `$${sortBy}`
            }
        },
        {
            $sort:{
                sortByField: sortTypeNum
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [
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
    ])

    let searchedVideos;
    const options = {
        page: pageNum,
        limit: limitNum,
      };
    if(!(!getVideos || getVideos.length === 0)){
        searchedVideos = await Video.aggregatePaginate(
            getVideos,
            options
        )
    }

    let videosFetched = searchedVideos? searchedVideos : "none"

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                videosFetched,
                NumOfVideos: getVideos?.length || 0
            },
            "Videos fetched successfully"
        )
    )
    
})

const publishAVideo = asyncHandler( async( req, res ) => {

    // TODO: get video, upload to cloudinary, create video
    // Steps
    // 1. check title and desc
    // 2. get local path of files
    // 3. check if localpath is empty
    // 4. upload on cloudinary
    // 5. check if uploaded or not
    // 6. get user details and check 
    // 7. create video and check
    // 8. response

    const { title, description } = req.body

    if(!title || title.trim() === ""){
        throw new ApiError(400, "Title cannot be empty")
    }
    if(!description || description.trim() === ""){
        throw new ApiError(400, "Description cannot be empty")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoFileLocalPath){
        throw new ApiError(400, "Video file is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required")
    }

    let videoFile = await uploadOnCloudinary(videoFileLocalPath)
    let thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile){
        throw new ApiError(500, "Error while uploading video")
    }
    if(!thumbnail){
        throw new ApiError(500, "Error while upploading thumbnail")
    }

    const user = req.user?._id || await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    if(!user){
        throw new ApiError(401, "Unauthorized request")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        createdBy: user
    })
    if(!video){
        throw new ApiError(500, "Something went wrong while creating video")
    }

    const uploadedVideo = await Video.findById(video._id)
    if(!uploadedVideo){
        throw new ApiError(500, "Something went wrong while uploading video")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            uploadedVideo,
            "Video has been uploaded successfully"
        )
    )

})

const updateVideo = asyncHandler( async ( req, res ) => {

    //TODO: update video details like title, description, thumbnail
    // Steps
    // 1. check if title or desc or thumbnail are present
    // 2. check authorization
    // 3. upload thumbnail
    // 4. check if uploaded
    // 5. update details
    // 6. response 

    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoId || videoId.trim() === ""){
        throw new ApiError(404, "Video Id cannot be empty")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "Video does not exist")
    }
    if((!title || title.trim() === "") && (!description || description.trim() === "") && (!thumbnailLocalPath || thumbnailLocalPath.trim() === "")){
        throw new ApiError(400, "Title or description or thumbnail file should be present")
    }

    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    const video = await Video.findById(videoId)

    if(!user){
        throw new ApiError(404, "User does not exists")
    }
    if(!video){
        throw new ApiError(404, "Video doesn't exist")
    }
    if(user._id?.toString() !== video.createdBy.toString()){
        throw new ApiError(401, "Unauthorized request")
    }
    
    let newThumbnail
    if(thumbnailLocalPath){
        newThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if(!newThumbnail || !newThumbnail.url){
            throw new ApiError(500, "Error while upploading thumbnail")
        }
    }

    let thumbnailToUpdate = newThumbnail? newThumbnail.url : video.thumbnail.url
    let titleToUpdate = title? title : video.title
    let descriptionToUpdate = description? description : video.description

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                thumbnail: thumbnailToUpdate,
                title: titleToUpdate,
                description: descriptionToUpdate
            }
        },
        {
            new: true
        }
    )

    if(!updatedVideo){
        throw new ApiError(500, "Error while updating video details")
    }

    if(newThumbnail){
        const oldThumbnailpublicId = video.thumbnail.split('/').pop().split('.')[0]
        const deletedThumbnail = await cloudinary.uploader.destroy(oldThumbnailpublicId, {resource_type: 'image', invalidate: true})
        console.log("Old thumbnail deleted? ", deletedThumbnail)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedVideo,
            "Video details updated successfully"
        )
    )

})


export { getAllVideos, publishAVideo, updateVideo }