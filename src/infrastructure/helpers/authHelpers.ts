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

export const checkSubsExist = async (bossUser: Partial<User>, checkBossRelation: boolean) => {
    let subList: mongoose.Types.ObjectId[] = []
    if (bossUser.role === 'BOSS') {
        // "!" - because if the "req.body.role" is "BOSS" then the validation for subordinates would be performed in the "createNewUserObj" function above, so "subordinates" are certain to be truthy here.

        const customQuery = checkBossRelation ? [{ role: { $ne: 'ADMIN' } }, { boss: bossUser.id }] : [{ role: { $ne: 'ADMIN' } }]

        for (let sub_username of bossUser.subordinates!) {
            const foundSub = await userMongoModel.findOne(
                {
                    username: sub_username,
                    $and: customQuery,
                },
                '_id',
            )
            if (!foundSub) {
                throw new InvalidInputError({
                    message: `Invalid value for subordinate: '${sub_username}' - no such user with a subordinate role found or user already has a different boss`,
                    statusCode: 404,
                })
            } else {
                subList.push(foundSub._id)
            }
        }
        return subList
    } else {
        return []
    }
}

// this function exists only to allow us to create(and therefore validate) a new user obj asynchronously
export const createNewUserObj = async (req: Request) => {
    return new User({ ...req.body })
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
