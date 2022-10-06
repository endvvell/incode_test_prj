import { NextFunction, Request, Response } from 'express';
import { createNewUserObj, logIn } from '../helpers/authHelpers';
import { checkProperSubordination, IEndResult } from '../helpers/checkSubordination';
import { userMongoModel } from '../tools & frameworks/user.mongo-model';

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // validate input data, create a model based on it
        const newUser = await createNewUserObj(req, 'register');
        
        // check if user with duplicate data already exists in db
        const foundUser = await userMongoModel.exists({ username: newUser.username });

        if (foundUser) {
            return res.status(409).json({ status: 'failed', reason: 'Username is taken' });
        } else {
            let checkList: IEndResult = await checkProperSubordination(newUser);

            // create new user with items from checkList
            const createdUser = new userMongoModel({
                ...newUser,
                boss: checkList.boss || null,
                subordinates: checkList.directSubs || [],
            });

            await createdUser.save();

            // if a boss was specified, push new user into boss' subordinates
            if (checkList.boss && createdUser.boss && createdUser.boss._id === checkList.boss._id) {
                if (checkList.boss.subordinates === null) {
                    // just in case user was created with a null in place of "subordinates"
                    checkList.boss.subordinates = [];
                }
                checkList.boss.subordinates.push(createdUser._id);
                await checkList.boss.adjustRole();
                await checkList.boss.save();
            }

            if (checkList.directSubs && checkList.directSubs.length > 0) {
                for (let user_id of checkList.directSubs) {
                    // updating the "boss" field on a user
                    const oldSubDoc = await userMongoModel.findByIdAndUpdate({ _id: user_id }, { boss: createdUser._id });

                    if (oldSubDoc) {
                        await oldSubDoc.adjustRole();
                        if (oldSubDoc.boss) {
                            // updating the previous boss
                            const previousBoss = await userMongoModel.findByIdAndUpdate(
                                { _id: oldSubDoc.boss },
                                { $pull: { subordinates: oldSubDoc._id } },
                            );
                            if (previousBoss) await previousBoss.adjustRole();
                        }
                    }
                }
            }

            logIn(req, <string>createdUser.toObject()._id, <string>createdUser.toObject().role);

            if (createdUser.role === 'BOSS') {
                const newUser = await createdUser.populateAllSubs();
                const { password, __v, ...readyUser } = newUser;
                return res.status(200).json({
                    status: 'success',
                    data: {
                        ...readyUser,
                    },
                });
            } else {
                const { password, __v, boss, subordinates, ...readyUser } = createdUser.toObject();
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
