import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";


const getAllVideos = asyncHandler( async( req, res ) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = 1 } = req.query
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
    if(!(!getVideos || getVideos.length === 0)){
        searchedVideos = await Video.aggregatePaginate(
            Video.aggregate(getVideos), 
            {
                page: pageNum, 
                limit: limitNum
            }
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
                NumOfVideos: searchedVideos?.length || 0
            },
            "Videos fetched successfully"
        )
    )
    
})

export { getAllVideos }