import { NextFunction, Request, Response } from 'express'
import { createNewUserObj, logIn } from '../helpers/authHelpers'
import { userMongoModel } from '../tools & frameworks/mongo/user.mongo-model'

export const registerUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const newUser = await createNewUserObj(req) // error handling is done inside of encapsulating routes error handler in "app.ts", so if this is to fail, that error handler will catch the error
        const foundUser = await userMongoModel.exists({ username: newUser.username }) // this function could also be made into express middleware

        if (foundUser) {
            res.status(409).json({ status: 'failed', reason: 'Username is taken' })
        } else {
            const user = new userMongoModel({
                ...newUser,
            })
            await user.save()

            logIn(req, <string>user.toObject()._id, <string>user.toObject().role)

            const { password, __v, _id, ...readyUser } = user.toObject()

            res.status(200).json({
                status: 'success',
                data: {
                    id: user.toObject()._id,
                    ...readyUser,
                },
            })
        }
    } catch (error) {
        next(error)
    }
}
