import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import validator from "validator";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required for creating an account"],
        trim: true,
        unique: [true, "Email already exists, please use a different email"],
        lowercase: true,
        validate: {
            validator: (value) => validator.isEmail(value),
            message: "Please enter a valid email address",
        }
    },
    name: {
        type: String,
        required: [true, "Name is required for creating an account"]
    },
    password: {
        type: String,
        required: [true, "Password is required for creating an account"],
        minlength: [8, "Password must be at least 8 characters long"],
        select: false
    },
    cartData: {
        type: Object,
        default: {}
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,
        select: false
  }
},{
    minimize: false,
    timestamps: true
});

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;

    return;
});

userSchema.methods.comparePassword = async function (password) {

    return await bcrypt.compare(password, this.password);

};

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;