import mongoose from "mongoose"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: [true, "username is required"],
        unique: [true, "username is already taken"],
        trim: true
    },
    name: {
        type: String
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: [true, "email is already registered"],
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "password is required"],
    },
    avatar: {
        type: String,
        default: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop",
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    bio: {
        type: String,
        trim: true
    },
    banner: {
        type: String,
        default: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop",
    },
    videosCount: {
        type: Number,
        default: 0
    },
    totalViews: {
        type: Number,
        default: 0
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    suspendReason: {
        type: String,
        default: ""
    },
    provider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },
    subscribedChannels: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Channel"
        }
    ]

}, {
    timestamps: true
})

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return
    }

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

const userModel = mongoose.model("User", userSchema)

export default userModel