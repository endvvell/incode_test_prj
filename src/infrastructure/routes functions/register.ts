import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { InvalidInputError } from '../../core/custom errors/InvalidInputError';
import { createNewUserObj, logIn } from '../helpers/authHelpers';
import { checkProperSubordination, IEndResult } from '../helpers/checkSubordination';
import { IUser, userMongoModel } from '../tools & frameworks/mongo/user.mongo-model';


export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // validate input data, create a model based on it
        const newUser = await createNewUserObj(req, 'register');

        // check if user with duplicate data already exists in db
        const foundUser = await userMongoModel.exists({ username: newUser.username });

        if (foundUser) {
            return res.status(409).json({ status: 'failed', reason: 'Username is taken' });
        } else {
            let checkList: IEndResult = (await checkProperSubordination(newUser))

            // create new user with items from checkList
            let createdUser = new userMongoModel({
                ...newUser,
                boss: checkList.boss || null,
                subordinates: checkList.directSubs || null,
            });

            // if a boss was specified, push new user into boss' subordinates
            if (checkList.boss && createdUser.boss === checkList.boss._id) {
                checkList.boss.subordinates.push(createdUser._id);
                checkList.boss.save();
            }

            // if (checkList.subList && checkList.subList.length > 0) {
            //     for (let user of checkList.subList) {
            //         // updating the "boss" field on a user
            //         const oldSubDoc = await userMongoModel.findByIdAndUpdate({ _id: user._id }, { boss: createdUser._id });
            //         if (oldSubDoc && oldSubDoc.boss) {
            //             // updating the previous boss
            //             await userMongoModel.findByIdAndUpdate(
            //                 { _id: oldSubDoc.boss },
            //                 { $pull: { subordinates: oldSubDoc._id } },
            //             );
            //         }
            //     }
            // }

            logIn(req, <string>createdUser.toObject()._id, <string>createdUser.toObject().role);

            if (createdUser.role === 'BOSS') {
                createdUser = await (await createdUser.save()).populateAllSubs();
                const { password, __v, ...readyUser } = createdUser;
                return res.status(200).json({
                    status: 'success',
                    data: {
                        ...readyUser,
                    },
                });
            } else {
                await createdUser.save();
                const { password, __v, ...readyUser } = createdUser.toObject();

                return res.status(200).json({
                    status: 'success',
                    data: {
                        ...readyUser,
                    },
                });
            }
        }
    } catch (error) {
        next(error);
    }
};
