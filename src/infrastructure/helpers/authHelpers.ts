import { NextFunction, Request, Response } from 'express'
import { SESSION_NAME } from '../../configs/session-config'
import { User } from '../../core/entities/user.entity'

declare module 'express-session' {
    export interface SessionData {
        userId: string
        userRole: string
        createdAt: number
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
