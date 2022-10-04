import mongoose, { Document, Schema } from 'mongoose'
import { hash, compare } from 'bcryptjs'
import { BCRYPT_ROUNDS } from '../../../configs/global-config'
import { userRole } from '../../../core/entities/user.entity'

export interface IUser extends Document {
    username: string
    password: string
    firstName: string | null
    lastName: string | null
    role: userRole
    subordinates: IUser[] | null
    matchesPassword: (password: string) => Promise<boolean>
}

export const userMongoSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            maxlength: [32, 'Username must not be longer than 32 characters'],
            minlength: [3, 'Username must be longer than 3 characters'],
            validate: {
                validator: (username: string) => {
                    const pattern = /^[\p{sc=Latn}\p{Nd}_.-]*$/u
                    return pattern.test(username)
                },
                message:
                    'Invalid value for username provided: must be at least 3 alphanumeric characters long - underscores, dots, and dashes are allowed',
            },
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            validate: {
                validator: (password: string) => {
                    const pattern = /^(?=.*[!@#$%^&*.])(?=.*[A-z]).*$/u
                    return pattern.test(password)
                },
                message: 'Incomplete password',
            },
            maxlength: [80, 'Password must not be longer than 80 characters'],
            minlength: [8, 'Password must be longer than 8 characters'],
        },
        firstName: {
            type: String,
            trim: true,
            default: null,
            maxlength: [100, 'First name must not be longer than 100 characters'],
        },
        lastName: {
            type: String,
            trim: true,
            default: null,
            maxlength: [100, 'Last name must not be longer than 100 characters'],
        },
        role: {
            type: String,
            enum: ['ADMIN', 'BOSS', 'REGULAR'],
            default: 'REGULAR',
        },
        subordinates: {
            type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
            default: null,
        }
    },
    {
        timestamps: true,
    },
)

userMongoSchema.pre<IUser>('save', async function () {
    if (this.isModified('password')) {
        this.password = await hash(this.password, BCRYPT_ROUNDS)
    }
})

userMongoSchema.methods.matchesPassword = async function (password: string) {
    const passwordMatches = await compare(password, this.password)
    return passwordMatches
}

userMongoSchema.methods.goThroughSubs = async function (user: IUser) {
    if (user.subordinates && user.subordinates.length !== 0 ) {
        user.subordinates.forEach((sub) => {
            if (sub.username !== this.username) {
                sub.populate({path: 'subordinates', select: '-_id -__v -password'})
                sub.id = sub._id.toString()
                this.goThroughSubordinates(sub)
            }
        })
    }
}

export const userMongoModel = mongoose.model<IUser>('User', userMongoSchema)
