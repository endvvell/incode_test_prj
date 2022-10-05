import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { InvalidInputError } from '../../core/custom errors/InvalidInputError'
import { User } from '../../core/entities/user.entity'
import { checkSubsExist, createNewUserObj, logIn } from '../helpers/authHelpers'
import { userMongoModel } from '../tools & frameworks/mongo/user.mongo-model'

// const checkSubRank = async (subList: Awaited<ReturnType<typeof checkSubsExist>>) => {
//     // boss1 -> boss2 -> boss3 -> boss1 - boss3 cannot be a boss of boss 1 if boss3 is somewhere in the subordinate chain under boss1
// }

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
            const subList = (await checkSubsExist(newUser, false)) || []
            // await checkSubRank(subList)

            let createdUser = new userMongoModel({
                ...newUser,
                subordinates: subList || null,
            })

            if (subList.length > 0) {
                for (let id of subList) {
                    // updating the "boss" field on a user
                    const oldSubDoc = await userMongoModel.findByIdAndUpdate(
                        { _id: id },
                        { boss: createdUser._id },
                    )
                    if (oldSubDoc && oldSubDoc.boss) {
                        // updating the previous boss
                        await userMongoModel.findByIdAndUpdate(
                            { _id: oldSubDoc.boss },
                            { $pull: { subordinates: oldSubDoc._id } },
                        )
                    }
                }
            }

            logIn(
                req,
                <string>createdUser.toObject()._id,
                <string>createdUser.toObject().role,
            )

            if (createdUser.role === 'BOSS') {
                createdUser = await (await createdUser.save()).populateAllSubs()
                const { password, __v, ...readyUser } = createdUser
                return res.status(200).json({
                    status: 'success',
                    data: {
                        ...readyUser,
                    },
                })
            } else {
                await createdUser.save()
                const { password, __v, ...readyUser } = createdUser.toObject()

                return res.status(200).json({
                    status: 'success',
                    data: {
                        ...readyUser,
                    },
                })
            }
        }
    } catch (error) {
        next(error)
    }
}
