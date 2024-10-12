import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
} 

const registerUser = asyncHandler( async ( req, res ) => {
    
    // TODO: register a user
    // Steps
    // 1. get details
    // 2. validate
    // 3. unique?
    // 4. check images 
    // 5. upload on cloudinary
    // 6. create a user object and entry in db
    // 7. remove pass and refreshtoken field from res
    // 8. check for user creation
    // 9. response

    const { username, email, password, fullName } = req.body

    if(
        [username, email, password, fullName].some((field) => field?.trim() === '')
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if(existingUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0]?.path;
    }
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }
    
    let avatar = await uploadOnCloudinary(avatarLocalPath)
    let coverImage;
    if(coverImageLocalPath){
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
        if(!coverImage){
            throw new ApiError(400, "Provide proper local path of cover image")
        }
    }
    if(!avatar){
        throw new ApiError(400, "Avatar is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        username: username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            createdUser,
            "User Registration Successful"
        )
    )

})

const loginUser = asyncHandler( async ( req, res ) => {

    // TODO: login a user
    // Steps
    // 1. get details
    // 2. username or email
    // 3. find user
    // 4. check password
    // 5. generate access and refresh token
    // 6. remove pass and refreshtoken field from response
    // 7. send secure cookies

    const { email, username, password } = req.body

    if(!(username || email)){
        throw new ApiError(400, "Username or Email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User Credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -avatar -coverImage");

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User Login Successful"
        )
    )

})

const logoutUser = asyncHandler( async ( req, res ) => {

    // TODO: log out user and clear cookies
    // Steps 
    // 1. find user
    // 2. clear refreshtoken
    // 3. response

    User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "User Logout Successful"
        )
    )
})

const refreshAccessToken = asyncHandler( async ( req, res ) => {

    // TODO: refresh/genrerate new access token
    // Steps
    // 1. check refresh token 
    // 2. decode refreshtoken to get user info 
    // 3. check user authorization
    // 4. generate new tokens
    // 5. response

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "Access Token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})

const changeCurrentPassword = asyncHandler( async ( req, res ) => {

    // TODO: change user's password
    // Steps 
    // 1. check if old and new passwords are present
    // 2. check if new and confirm password match
    // 3. check user 
    // 4. verify old password
    // 5. save new password
    // 6. response

    const { oldPassword, newPassword, confirmPassword } = req.body

    if(!(oldPassword && newPassword && confirmPassword)){
        throw new ApiError(400, "All passwor fields are required")
    }

    if(!(newPassword === confirmPassword)){
        throw new ApiError(400, "New Password and Confirm Password do not match")
    }

    const user = await User.findById(req.user?._id)

    const isPassCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPassCorrect){
        throw new ApiError(400, "Invalid Password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    )
})

const getCurrentUser = asyncHandler(async ( req, res ) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user, 
            "Current user fetched successfully"
        )
    )
})

const updateAccountDetails = asyncHandler( async ( req, res ) => {

    // TODO: update user's account details like name, email, cover image
    // Steps
    // 1. check if name or email is present 
    // 2. update details 
    // 3. response

    const { fullName, email } = req.body
    if(!(fullName || email)){
        throw new ApiError(400, "At least one field is required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName, 
                email: email
            }
        },
        {
            new: true
        }
    ).select("-password")

    if(!user){
        throw new ApiError(404, "Error updating details")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Account details updated successfully"
        )
    )
})

const updateUserAvatar = asyncHandler( async ( req, res ) => {

    // TODO: update user's avatar
    // Steps 
    // 1. check avatar local path
    // 2. upload avatar
    // 3. delete old avatar
    // 4. update avatar in user object
    // 5. response

    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar");
    }

    const oldAvatar = req.user?.avatar?.split('/').pop().split('.')[0]
    if(oldAvatar){
        const deletedAvatar = await cloudinary.uploader.destroy(oldAvatar, {resource_type: 'image', invalidate: true})
        console.log("Old avatar deleted? ", deletedAvatar)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")
    
    if(!user){
        throw new ApiError(404, "Error updating avatar")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
        )
    )
})

const updateUserCoverImage = asyncHandler( async ( req, res ) => {

    // TODO: update user's cover image
    // Steps 
    // 1. check cover image local path
    // 2. upload cover image
    // 3. delete old cover image
    // 4. update cover image in user object
    // 5. response

    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading Cover Image");
    }

    const oldCoverImage = req.user?.coverImage?.split('/').pop().split('.')[0]
    if(oldCoverImage){
        const deletedCoverImage = await cloudinary.uploader.destroy(oldCoverImage, {resource_type: 'image', invalidate: true})
        console.log("Old cover image deleted? ", deletedCoverImage)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    if(!user){
        throw new ApiError(404, "Error updating cover image")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover Image updated successfully"
        )
    )
})

const getUserChannelProfile = asyncHandler( async ( req, res ) => {

    // TODO: get channel profile of a user from user name
    // Steps 
    // 1. check username
    // 2. get channel
    // 3. find subscriptions and subscribers count
    // 4. check user's subscription status
    // 5. response

    const { username } = req.params
    if(!username?.trim()){
        throw new ApiError(400, "Username is missing");
    }
    
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                isSubscribed: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ]);

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exists");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel[0],
            "User channel fethed successfully"
        )
    )
})

const getUserWatchHistory = asyncHandler( async ( req, res ) => {

    // TODO: get watch history of the user
    // Steps 
    // 1. find user 
    // 2. get videos from watch history
    // 3. get video's creator details
    // 4. response

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory.video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "createdBy",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            createdBy: {
                                $first: "$createdBy"
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                watchHistory: {
                    $map: {
                        input: "$watchHistory",
                        as: "wh",
                        in: {
                            video: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$videoDetails",
                                            as: "vd",
                                            cond: {
                                                $eq: ["$$vd._id", "$$wh.video"]
                                            }
                                        }
                                    },
                                    0
                                ]
                            },
                            watchedAt: "$$wh.watchedAt"
                        }
                    }
                }
            }
        },
        {
            $project: {
                videoDetails: 0
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            user[0].watchHistory,
            "Watch History fetched Successfully"
        )
    )
})

export { registerUser , loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getUserWatchHistory }