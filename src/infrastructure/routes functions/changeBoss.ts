import { NextFunction, Request, Response } from 'express'
import { InvalidInputError } from '../../core/custom errors/InvalidInputError'
import { User } from '../../core/entities/user.entity'
import { checkSubsExist } from '../helpers/authHelpers'
import { IUser, userMongoModel } from '../tools & frameworks/mongo/user.mongo-model'

export const changeBoss = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.session.userRole === 'BOSS') {
            if (!req.body.newboss || !req.body.subordinates) {
                throw new InvalidInputError({
                    message:
                        'Invalid input: required fields are missing - "newboss" and "subordinates" must be sent in the request',
                    statusCode: 400,
                })
            }
            
            // check both bosses exist

            const foundCurrentBoss = await userMongoModel.findOne(
                {
                    _id: req.session.userId,
                },
                '-password -__v',
            )

            if (!foundCurrentBoss) {
                // this is a very unlikely edge-case, and the only reason I can think of this happening in the current state of the app is if the Redis session store went down, so I decided to send "500" code in this case
                return res.status(500).json({
                    status: 'failed',
                    reason: `No boss user with your id was found was found, please re-login and try again`,
                })
            }

            const foundNewBoss = await userMongoModel.findOne({
                username: req.body.newboss,
            })

            if (!foundNewBoss) {
                throw new InvalidInputError({
                    message: `No boss with username of "${req.body.newboss}" was found`,
                    statusCode: 404,
                })
            } else {
                try {
                    // check if specified subordinates exist on the current user
                    const subList = await checkSubsExist(
                        {
                            id: foundCurrentBoss._id,
                            username: foundCurrentBoss.username,
                            role: foundCurrentBoss.role,
                            subordinates: req.body.subordinates,
                        },
                        true,
                        foundNewBoss,
                    )

                    if (subList.length > 0) {
                        for (let id of subList) {
                            // updating the previous boss
                            const oldDoc = await userMongoModel.findOne({ _id: id })
                            if (oldDoc) {
                                await userMongoModel.updateOne({ _id: oldDoc.boss }, { $pull: { subordinates: oldDoc._id } })
                            }
                            // updating the "boss" field on a user
                            await userMongoModel.updateOne({ _id: id }, { boss: foundNewBoss._id })
                            // updating new boss
                            await userMongoModel.updateOne({ _id: foundNewBoss._id }, { $push: { subordinates: id } })
                        }
                    }

                    return res.status(200).json({
                        status: 'success',
                        message: `The following users - ${req.body.subordinates.join(', ')} - are now subordinates of ${
                            req.body.newboss
                        }`,
                    })
                } catch (error) {
                    next(error)
                }
            }
        } else {
            return res.status(403).json({
                status: 'failed',
                reason: 'You are not authorized to use this path',
            })
        }
    } catch (error) {
        next(error)
    }
}