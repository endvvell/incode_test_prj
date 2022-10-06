import { NextFunction, Request, Response } from 'express';
import { InvalidInputError } from '../../core/custom errors/InvalidInputError';
import { checkSubsExist, createNewUserObj, logIn } from '../helpers/authHelpers';
import { IUser, userMongoModel } from '../tools & frameworks/mongo/user.mongo-model';

// const checkSubRank = async (subList: Awaited<ReturnType<typeof checkSubsExist>>) => {
//     // boss1 -> boss2 -> boss3 -> boss1 - boss3 cannot be a boss of boss 1 if boss3 is somewhere in the subordinate chain under boss1
// }

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // error handling is done inside of encapsulating routes error handler in "app.ts", so if this is to fail, that error handler will catch the error
        const newUser = await createNewUserObj(req, 'register');
        const foundUser = await userMongoModel.exists({ username: newUser.username });

        if (foundUser) {
            return res.status(409).json({ status: 'failed', reason: 'Username is taken' });
        } else {
            const subList = (await checkSubsExist(newUser, false)) || [];
            // await checkSubRank(subList)

            let bossToBeAssigned: IUser | null = null;
            if (req.body.role.toUpperCase() === 'REGULAR' && req.body.boss) {
                // check if the boss subordinates
                const foundBoss = await userMongoModel.findOne({ username: req.body.boss });
                if (foundBoss) {
                    bossToBeAssigned = foundBoss;
                } else {
                    throw new InvalidInputError({
                        message: `Didn't find a boss with a username of "${req.body.boss}"`,
                        statusCode: 400,
                    });
                }
            }
            let createdUser = new userMongoModel({
                ...newUser,
                boss: bossToBeAssigned?._id || null,
                subordinates: subList || null,
            });

            if (bossToBeAssigned && createdUser.boss === bossToBeAssigned._id) {
                bossToBeAssigned.subordinates.push(createdUser._id);
                bossToBeAssigned.save();
            }

            if (subList.length > 0) {
                for (let id of subList) {
                    // updating the "boss" field on a user
                    const oldSubDoc = await userMongoModel.findByIdAndUpdate({ _id: id }, { boss: createdUser._id });
                    if (oldSubDoc && oldSubDoc.boss) {
                        // updating the previous boss
                        await userMongoModel.findByIdAndUpdate(
                            { _id: oldSubDoc.boss },
                            { $pull: { subordinates: oldSubDoc._id } },
                        );
                    }
                }
            }

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
