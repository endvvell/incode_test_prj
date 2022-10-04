import { NextFunction, Request, Response } from 'express'
import { IUser, userMongoModel } from '../tools & frameworks/mongo/user.mongo-model'

const goThroughSubordinates = (user: IUser) => {}

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    switch (req.session.userRole) {
        case 'ADMIN':
            try {
                const foundUsers = await userMongoModel
                    .find({ $rename: { _id: 'id' } }, '-password -__v')
                    .populate({ path: 'subordinates', select: '-__v -password' })

                if (foundUsers) {
                    foundUsers.forEach((user) => {
                        if (user.subordinates) {
                        }
                    })
                    return res
                        .status(200)
                        .json({ status: 'success', data: foundUsers })
                } else {
                    return res
                        .status(404)
                        .json({ status: 'failed', reason: 'No users found' })
                }
            } catch (error) {
                next(error)
            }
        case 'BOSS':
            try {
                const foundUser = await userMongoModel
                    .findOne(
                        { _id: req.session.userId, $rename: { _id: 'id' } },
                        '-password -__v',
                    )
                    .populate({ path: 'subordinates', select: ' -__v -password' })
                    
                if (foundUser) {
                    res.status(200).json({
                        status: 'success',
                        data: foundUser,
                    })
                } else {
                    return res
                        .status(404)
                        .json({ status: 'failed', reason: 'User not found' })
                }
            } catch (error) {
                next(error)
            }
        case 'REGULAR':
        default:
            console.log('fell through to default')
            try {
                const selfUser = await userMongoModel.findOne({
                    _id: req.session.userId,
                })

                if (selfUser) {
                    const { password, __v, _id, ...readyUser } = selfUser.toObject()

                    // readyUser.id = (<string>selfUser.toObject()._id).toString()
                    res.status(200).json({
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
