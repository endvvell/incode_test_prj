import mongoose, { Document, Schema } from 'mongoose';
import { hash, compare } from 'bcryptjs';
import { BCRYPT_ROUNDS } from '../../../configs/global-config';
import { userRole } from '../../../core/entities/user.entity';
import { logger } from '../../../logger/prodLogger';

export interface IUser extends Document {
    username: string;
    password: string;
    firstName: string | null;
    lastName: string | null;
    role: userRole;
    boss: IUser | null;
    subordinates: IUser[];
    matchesPassword: (password: string) => Promise<boolean>;
    populateAllSubs: () => Promise<
        IUser & {
            _id: mongoose.Types.ObjectId;
        }
    >;
    populateAllSubsIds: () => Promise<
        IUser &
            {
                _id: mongoose.Types.ObjectId;
            }[]
    >;
    adjustRole: () => Promise<void>;
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
                    const pattern = /^[\p{sc=Latn}\p{Nd}_.-]*$/u;
                    return pattern.test(username);
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
                    const pattern = /^(?=.*[!@#$%^&*.])(?=.*[A-z]).*$/u;
                    return pattern.test(password);
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
        boss: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        subordinates: {
            type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

// Hashes the password
userMongoSchema.pre<IUser>('save', async function () {
    if (this.isModified('password')) {
        this.password = await hash(this.password, BCRYPT_ROUNDS);
    }
});

// Checks user's password against the hashed password
userMongoSchema.methods.matchesPassword = async function (password: string) {
    const passwordMatches = await compare(password, this.password);
    return passwordMatches;
};

// Changes user's role if a user gets at least one subordinate or if the user no longer has any subordinates
userMongoSchema.methods.adjustRole = async function (this: IUser) {
    if (this.subordinates.length === 0 && this.role === 'BOSS') {
        await userMongoModel.findByIdAndUpdate({ _id: this._id }, { role: 'REGULAR' });
    } else if (this.subordinates.length > 0 && this.role === 'REGULAR') {
        await userMongoModel.findByIdAndUpdate({ _id: this._id }, { role: 'BOSS' });
    }
};

// Populates all subordinates recursively
userMongoSchema.methods.populateAllSubs = async function (this: IUser) {
    let subList: IUser[] = [];
    let idsList: mongoose.Types.ObjectId[] = [];
    let rootId = this._id;
    async function autoPopulate(parent: IUser) {
        if (parent.subordinates && parent.subordinates.length !== 0) {
            for (let sub of parent.subordinates!) {
                // "!" - because "this.subordinates" above already checks if the "subordinates" list is empty, so by this point it is not.
                // the "if" here is to avoid infinite recursion in case "boss1 > boss2 > boss3 > boss1", which should never(ideally) be a case in the first place due to "checkSubsExist" function implemented in the "change-boss" and "register" paths, but in case it is ever to occur this "if" will prevent it. Could also log such a case to errors.log, but that would introduce another O(n) operation in an already expensive function. So, considering that this edge-case is never supposed to occur in the first place I won't place a logger here.
                if (sub._id.toString() !== parent._id.toString() && sub._id.toString() !== rootId.toString()) {
                    const downsub = await userMongoModel.findOne<IUser>(
                        {
                            _id: sub._id,
                        },
                        '-password -__v',
                    );
                    if (downsub) {
                        // !(idsList.length > 5)
                        subList.push(downsub);
                        idsList.push(downsub._id);
                        await autoPopulate(downsub);
                    }
                }
            }
        }
    }
    await autoPopulate(this);

    const readyUser = this.toObject();

    readyUser.subordinates = subList;

    return readyUser;
};

// Populates all subordinates' ids recursively
userMongoSchema.methods.populateAllSubsIds = async function (this: IUser) {
    let subList: IUser[] = [];
    async function autoPopulate(parent: IUser) {
        if (parent.subordinates && parent.subordinates.length !== 0) {
            for (let sub of parent.subordinates!) {
                if (sub._id !== parent._id || !subList.includes(sub._id)) {
                    const downsub = await userMongoModel.findOne<IUser>(
                        {
                            _id: sub._id,
                        },
                        '-password -__v',
                    );
                    if (downsub) {
                        subList.push(downsub._id);
                        await autoPopulate(downsub);
                    }
                }
            }
        }
    }
    await autoPopulate(this);
    return subList;
};

export const userMongoModel = mongoose.model<IUser>('User', userMongoSchema);
