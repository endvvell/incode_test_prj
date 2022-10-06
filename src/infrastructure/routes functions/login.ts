import { NextFunction, Request, Response } from 'express';
import { createNewUserObj, logIn } from '../helpers/authHelpers';
import { userMongoModel } from '../tools & frameworks/mongo/user.mongo-model';

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userObj = await createNewUserObj(req, 'login'); // same as with "register" path, this function does the validation and if error occurs it gets caught in "app.ts" inside of the routes error handler

        const foundUser = await userMongoModel.findOne({
            username: userObj.username,
        });


        if (!foundUser || !(await foundUser.matchesPassword(userObj.password))) {
            return res.status(404).json({
                status: 'failed',
                reason: 'User not found or password is invalid',
            }); // could also just add one more "if" statement inside of this block so different status codes and reasons for the failure are sent out, but this approach seem to me to be more secure as it doesn't expose the fact of existence of the user – user convenience vs user security - because I'm feeling lazy, and because it appears my laziness can be rightly justified, I choose not to write one more "if" condition... and instead decide to spend that time writing exactly why the code is the way it is...
        } else {
            logIn(req, <string>foundUser.toObject()._id, <string>foundUser.toObject().role);
            return res.status(200).json({
                status: 'success',
                message: 'You are now logged in!',
            });
        }
    } catch (error) {
        next(error);
    }
};
