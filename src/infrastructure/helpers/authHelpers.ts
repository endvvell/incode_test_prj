import { NextFunction, Request, Response } from 'express'
import mongoose, { Types } from 'mongoose'
import { SESSION_NAME } from '../../configs/session-config'
import { InvalidInputError } from '../../core/custom errors/InvalidInputError'
import { User } from '../../core/entities/user.entity'
import { IUser, userMongoModel } from '../tools & frameworks/mongo/user.mongo-model'

declare module 'express-session' {
    export interface SessionData {
        userId: string
        userRole: string
        createdAt: number
    }
}

export const checkSubsExist = async (currentBossUser: Partial<User>, checkBossRelation: boolean, newBossUser?: IUser) => {
    let subList: mongoose.Types.ObjectId[] = []
    const recursiveSubordinates = await (await userMongoModel.findOne({ username: currentBossUser.username }))?.populateAllSubsIds()
    console.log('these are the recursive subs', recursiveSubordinates)
    if (currentBossUser.role === 'BOSS') {
        
        const customQuery = checkBossRelation
        ? [{ role: { $ne: 'ADMIN' } }, { _id: { $in: recursiveSubordinates }}] // "if user specified subordinate is not an admin and IS in the user's subordinates(because bosses should only be able to alter THEIR subordinates)"
        : [{ role: { $ne: 'ADMIN' } }]
        console.log('this is the chosen query', customQuery)
        for (let sub_username of currentBossUser.subordinates!) {
            // ^^ "!" - because if the "req.body.role" is "BOSS" then the validation for subordinates would be performed in the "createNewUserObj" function above, so "subordinates" are certain to be truthy here.
            const foundSub = await userMongoModel.findOne({
                username: sub_username,
                $and: customQuery,
            })
            if (!foundSub) {
                throw new InvalidInputError({
                    message: `Invalid value for subordinate: '${sub_username}' - no such user with a subordinate role found or user already has a different boss`,
                    statusCode: 404,
                })
            } else {
                if (newBossUser && foundSub.subordinates.includes(newBossUser._id)) {
                    throw new InvalidInputError({
                        message: `A subordinate of ${foundSub.username} (which is ${newBossUser.username}) cannot be the boss of ${foundSub.username}`,
                        statusCode: 400,
                    })
                }
                subList.push(foundSub._id)
            }
        }
        return subList
    } else {
        return []
    }
}

export const createNewUserObj = async (req: Request, path: 'login' | 'register') => {
    if (path) {
        if (req.body.subordinates) delete req.body.subordinates
        if (req.body.role) delete req.body.role
    }

    return new User({ ...req.body, pathIgnoreRules: path})
}

export const isLoggedIn = (req: Request) => {
    if (req.session.userId) {
        return true
    } else {
        return false
    }
}

export const logIn = (req: Request, userId: string, userRole: string) => {
    req.session.userId = userId
    req.session.userRole = userRole
    req.session.createdAt = Date.now()
}

export const logOut = async (req: Request, res: Response) => {
    return new Promise((resolve, reject) => {
        req.session.destroy((error) => {
            if (error) {
                reject(error)
            } else {
                res.clearCookie(SESSION_NAME)
                resolve(res)
            }
        })
    })
}
