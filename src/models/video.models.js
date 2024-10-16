import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
    {
        videoFile:{
            type: String, //cloudinary url
            required: [true, "Video is required"]
        },
        thumbnail:{
            type: String, //cloudinary url
            required: [true, "Thumbnail is required"]
        },
        title:{
            type: String,
            required: [true, "Title is required"]
        },
        description:{
            type: String,
            required: [true, "Description is required"]
        },
        tags:[
            {
                type: String,
            }
        ],
        duration:{
            type: Number,
            required: true
        },
        views:{
            type: Number,
            default: 0
        },
        isPublished:{
            type: Boolean,
            default: true
        },
        createdBy:{
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }, {timestamps: true}
)

export const Video = mongoose.model("Video", videoSchema)