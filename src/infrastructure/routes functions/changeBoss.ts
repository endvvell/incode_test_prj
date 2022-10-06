import { NextFunction, Request, Response } from 'express';
import { InvalidInputError } from '../../core/custom errors/InvalidInputError';
import { logger } from '../../logger/prodLogger';
import { checkProperSubordination } from '../helpers/checkSubordination';
import { userMongoModel } from '../tools & frameworks/mongo/user.mongo-model';

export const changeBoss = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check if user is authorized
        if (req.session.userRole === 'BOSS' || req.session.userRole === 'ADMIN') {
            if (!req.body.newboss || !req.body.subordinates) {
                throw new InvalidInputError({
                    message:
                        'Invalid input: required fields are missing - "newboss" and "subordinates" must be sent in the request',
                    statusCode: 400,
                });
            }

            // check if both bosses specified by the user exist:
            const foundCurrentBoss = await userMongoModel.findOne(
                // this could also find an admin user
                {
                    _id: req.session.userId,
                },
                '-password -__v',
            );

            if (!foundCurrentBoss) {
                // this is a very unlikely edge-case, and the only reason I can think of this happening in the current state of the app is if the Redis session store went down, so I decided to send "500" code in this case
                return res.status(500).json({
                    status: 'failed',
                    reason: `No boss user with your id was found was found, please re-login and try again`,
                });
            }

            const foundNewBoss = await userMongoModel.findOne({
                username: req.body.newboss,
            });

            if (!foundNewBoss) {
                throw new InvalidInputError({
                    message: `No boss with username of "${req.body.newboss}" was found`,
                    statusCode: 404,
                });
            } else {
                try {
                    // check if subordination is preserved
                    const checkList = await checkProperSubordination(
                        {
                            id: foundCurrentBoss._id,
                            username: foundCurrentBoss.username,
                            role: foundCurrentBoss.role,
                            subordinates: req.body.subordinates,
                        },
                        foundNewBoss,
                    );

                    if (checkList.directSubs) {
                        for (let user_id of checkList.directSubs) {
                            const oldSubDoc = await userMongoModel.findOne({ _id: user_id });
                            
                            if (oldSubDoc) {

                                // removing subordinate from its previous boss
                                const foundOldBoss = await userMongoModel.findByIdAndUpdate(
                                    { _id: oldSubDoc.boss },
                                    { $pull: { subordinates: oldSubDoc._id } },
                                    { new: true },
                                )
                                if (foundOldBoss) {
                                    await (
                                        foundOldBoss                                    
                                    ).adjustRole();
                                } else {
                                    logger.error(`Error while updating the old boss of user ${oldSubDoc.username}`)
                                    return res.status(500).json({status: 'failed', reason: `Error while updating the old boss of user ${oldSubDoc.username}`})
                                }

                                // updating the "boss" field on a subordinate
                                const newUserBossField = await userMongoModel.findByIdAndUpdate(
                                    { _id: user_id },
                                    { boss: foundNewBoss._id },
                                    { new: true },
                                )
                                if (newUserBossField) {
                                    await (
                                        newUserBossField
                                    ).adjustRole();
                                } else {
                                    logger.error(`Error while updating user ${oldSubDoc.username} with a new boss`)
                                    return res.status(500).json({status: 'failed', reason: `Error while updating user ${oldSubDoc.username} with a new boss`})
                                }

                                // updating new boss to contain a new subordinate
                                const newBoss = await userMongoModel.findByIdAndUpdate(
                                    { _id: foundNewBoss._id },
                                    { $push: { subordinates: user_id } },
                                    { new: true },
                                )
                                if (newBoss) {
                                    await (
                                        newBoss
                                    ).adjustRole();
                                } else {
                                    logger.error(`Error while updating new boss of user ${oldSubDoc.username}`)
                                    return res.status(500).json({status: 'failed', reason: `Error while updating new boss of user ${oldSubDoc.username}`})
                                }
                            } else {
                                logger.error(`Error while looking up subordinates of ${foundCurrentBoss.username}`)
                                return res.status(500).json({status: 'failed', reason: `Error while looking up subordinates of the ${foundCurrentBoss.username}`})
                            }
                        }
                    }

                    return res.status(200).json({
                        status: 'success',
                        message: `The following users - ${req.body.subordinates.join(', ')} - are now subordinates of ${
                            req.body.newboss
                        }`,
                    });
                } catch (error) {
                    next(error);
                }
            }
        } else {
            return res.status(403).json({
                status: 'failed',
                reason: 'You are not authorized to use this path',
            });
        }
    } catch (error) {
        next(error);
    }
};
