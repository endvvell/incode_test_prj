import mongoose from 'mongoose';
import { InvalidInputError } from '../../core/custom errors/InvalidInputError';
import { User } from '../../core/entities/user.entity';
import { IUser, userMongoModel } from '../tools & frameworks/user.mongo-model';

export interface IEndResult {
    directSubs: mongoose.Types.ObjectId[] | null;
    boss?: IUser | null;
}

const compileSubs = async (subList: mongoose.Types.ObjectId[], allRecursiveSubs: mongoose.Types.ObjectId[]) => { 
    // boss1 -> boss2 -> boss3 -> boss1 –– "boss3" cannot be a boss of "boss 1" if "boss3" is somewhere in the subordinate chain under "boss1" this would cause an infinite loop of subordination, so "allRecursiveSubs" keeps track of all the subordinates while "subList"/"tempList" only of those encountered in each iteration
    let tempList: mongoose.Types.ObjectId[] = [];
    for (let sub_id of subList) {
        const foundUser = await userMongoModel.findOne({ _id: sub_id });

        if (foundUser) {
            if (!allRecursiveSubs.includes(foundUser._id)) { 
                allRecursiveSubs.push(foundUser._id); 
            }

            if (foundUser.subordinates) { 
                for (let sub of foundUser.subordinates) {
                    tempList.push(sub._id);
                }
                await compileSubs(tempList, allRecursiveSubs);
            }
        }
    }
    return allRecursiveSubs;
};

export const checkProperSubordination = async (currentUser: Partial<User>, newBossUser?: IUser) => {
    const subList: mongoose.Types.ObjectId[] = [];
    let allSubs: mongoose.Types.ObjectId[] = [];
    let endResult: IEndResult = { directSubs: null, boss: null };
    let allRecursiveSubs: mongoose.Types.ObjectId[] = [];

    if (currentUser.subordinates) {
        for (let user_input_sub_username of currentUser.subordinates) {
            const foundSub = await userMongoModel.findOne({ username: user_input_sub_username });
            if (foundSub) {
                subList.push(foundSub._id);
            } else {
                throw new InvalidInputError({
                    message: `Invalid value for subordinate: '${user_input_sub_username}' - no such user with a subordinate role found or user already has a different boss`,
                    statusCode: 404,
                });
            }
        }

        // found all direct subordinates
        endResult.directSubs = subList;

        // compile together all recursively found subordinates
        allSubs = await compileSubs(subList, allRecursiveSubs);
    }

    if (currentUser.boss || newBossUser) { // "if boss is specified either during the user's creation or changing of the user's boss"
        let actionBoss = currentUser.boss || newBossUser?.username; // ^^ the "newBossUser" is only provided during the changing of the user's boss
        // check if specified boss exists
        const foundBoss = await userMongoModel.findOne({ username: actionBoss }, '-__v -password -boss');
        if (foundBoss) {
            // check if specified boss is in recursively found subordinates
            if (allSubs.length > 0) {
                const breakingSub = await userMongoModel.findOne({
                    subordinates: { _id: foundBoss._id },
                    $and: [{ _id: { $in: allSubs } }],
                });
                if (breakingSub) {
                    throw new InvalidInputError({
                        message: `One of the subordinates down the subordination chain (${breakingSub.username}) includes specified boss(${foundBoss.username}) as a subordinate, meaning it would cause a loop of subordination - you cannot have ${foundBoss.username} be someone's boss while having ${breakingSub?.username} as that someone's subordinate`,
                        statusCode: 400,
                    });
                }
            }
            // specified boss isn't found in all recursively found subordinates -- good
            endResult.boss = foundBoss;
        } else {
            throw new InvalidInputError({
                message: `Didn't find a boss with a username of "${actionBoss}"`,
                statusCode: 400,
            });
        }
    }
    return endResult;
};
