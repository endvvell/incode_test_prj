import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { InvalidInputError } from '../../core/custom errors/InvalidInputError'
import { User } from '../../core/entities/user.entity'
import { createNewUserObj, logIn } from '../helpers/authHelpers'
import { userMongoModel } from '../tools & frameworks/mongo/user.mongo-model'

async function checkSubsExist(newUser: User) {
    let subList: mongoose.Types.ObjectId[] = []
    if (newUser.role === 'BOSS') {
        // "!" - because if the "req.body.role" is "BOSS" then the validation for subordinates would be performed in the "createNewUserObj" function above, so "subordinates" are certain to be truthy here.
        for (let sub_username of newUser.subordinates!) {
            console.log('Inside the sub loop', sub_username)
            const foundSub = await userMongoModel.findOne(
                {
                    username: sub_username,
                    $and: [{ role: { $ne: 'ADMIN' } }, { boss: { $eq: null } }],
                },
                '_id',
            )
            console.log('this is found sub', foundSub)
            if (!foundSub) {
                throw new InvalidInputError({
                    message: `Invalid value for subordinate: '${sub_username}' - no such user with subordinate role found or user already has a different boss`,
                    statusCode: 404,
                })
            } else {
                subList.push(foundSub._id)
            }
        }
        return subList
    }
}

export const registerUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        // error handling is done inside of encapsulating routes error handler in "app.ts", so if this is to fail, that error handler will catch the error
        const newUser = await createNewUserObj(req)
        const foundUser = await userMongoModel.exists({ username: newUser.username })

        if (foundUser) {
            return res
                .status(409)
                .json({ status: 'failed', reason: 'Username is taken' })
        } else {
            const subList = await checkSubsExist(newUser)

            console.log('This is sublist:', subList)
            const user = new userMongoModel({
                ...newUser,
                subordinates: subList || null,
            })
            await user.save()

            logIn(req, <string>user.toObject()._id, <string>user.toObject().role)

            const { password, __v, _id, ...readyUser } = user.toObject()

            return res.status(200).json({
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
