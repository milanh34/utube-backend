import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";

const toggleSubscription = asyncHandler( async ( req, res ) => {
    
    // TODO: toggle subscription
    // Steps 
    // 1. check channel Id
    // 2. check user authorization
    // 3. check if already subscribed or not 
    //    a. if not subscribed, subscribe
    //    b. if already subscribed, unsubscribe
    // 4. response 

    const { channelId } = req.params

    if(!channelId || channelId.trim() === ""){
        throw new ApiError(404, "channel Id cannot be empty")
    }
    if(!isValidObjectId(channelId)){
        throw new ApiError(404, "Not a valid channel Id")
    }

    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(404, "Channel does not exist")
    }

    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken
    })
    if(!user){
        throw new ApiError(401, "Unauthorized request")
    }

    const subscriptionObject = {
        channel: channel,
        subscriber: user
    }
    const hasUserSubscribed = await Subscription.findOne(subscriptionObject)
    
    let toggledSubscription
    let message
    if(!hasUserSubscribed){
        toggledSubscription = await Subscription.create(subscriptionObject)
        message = "Subscribed to channel successfully" 
    }
    else{
        toggledSubscription = await Subscription.findOneAndDelete(subscriptionObject)
        message = "Unsubscribed to channel successfully"
    }

    return res 
    .status(200)
    .json(
        new ApiResponse(
            200,
            toggledSubscription,
            message
        )
    )

})

export { toggleSubscription }