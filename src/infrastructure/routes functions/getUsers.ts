import { NextFunction, Request, Response } from 'express'
import { IUser, userMongoModel } from '../tools & frameworks/mongo/user.mongo-model'

const goThroughSubordinates = (user: IUser) => {}

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    if (req.session.userRole === 'ADMIN') {
        try {
            const foundUsers = await userMongoModel.find(
                { $rename: { _id: 'id' } },
                '-password -__v',
            )
            // .populate({
            //     path: 'subordinates',
            //     select: '-__v -password',
            //     populate: { path: 'subordinates', select: '-__v -password' },
            // })

            if (foundUsers) {
                let allUsers: IUser[] = []

                for (let user of foundUsers) {
                    const populatedUser = await user.populateAllSubs()
                    allUsers.push(populatedUser)
                }

                return res.status(200).json({ status: 'success', data: allUsers })
            } else {
                return res
                    .status(404)
                    .json({ status: 'failed', reason: 'No users found' })
            }
        } catch (error) {
            next(error)
        }
    } else if (req.session.userRole === 'BOSS') {
        try {
            const foundUser = await userMongoModel.findOne(
                { _id: req.session.userId, $rename: { _id: 'id' } },
                '-password -__v',
            )

            if (foundUser) {
                const userWithSubs = await foundUser.populateAllSubs()
                return res.status(200).json({
                    status: 'success',
                    data: userWithSubs,
                })
            } else {
                return res
                    .status(404)
                    .json({ status: 'failed', reason: 'User not found' })
            }
        } catch (error) {
            next(error)
        }
    } else {
        try {
            const selfUser = await userMongoModel.findOne(
                {
                    _id: req.session.userId,
                },
                '-boss -password -__v',
            )

            if (selfUser) {
                const { _id, ...readyUser } = selfUser.toObject()

                return res.status(200).json({
                    status: 'success',
                    data: {
                        id: selfUser.toObject()._id,
                        ...readyUser,
                    },
                })
            } else {
                return res
                    .status(404)
                    .json({ status: 'failed', reason: 'User not found' })
            }
        } catch (error) {
            next(error)
        }
    }
}
