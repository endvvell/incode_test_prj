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
            console.log('this is the found user', foundUser)
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
            console.log('Went to error', error)
            next(error)
        }
    } else {
        try {
            const selfUser = await userMongoModel.findOne(
                {
                    _id: req.session.userId,
                },
                '-boss -password -__v -subordinates',
                // ^^ "REGULAR" users should not have any subordinates(empty list) anyway, but to prevent an edge-case of a potential real-life security breach "subordinates" are removed completely 
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
