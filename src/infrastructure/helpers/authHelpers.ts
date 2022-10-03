import { Request, Response } from 'express'
import { SESSION_NAME } from '../../configs/session-config'
import { User } from '../../core/entities/user.entity'

declare module 'express-session' {
    export interface SessionData {
        userId: string
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

export const logIn = (req: Request, userId: string) => {
    req.session.userId = userId
    req.session.createdAt = Date.now()
}

export const logOut = (req: Request, res: Response) => {
    req.session.destroy((error) => {
        if (error) throw new Error(`Error while logging out: ${error}`)
        res.clearCookie(SESSION_NAME)
    })
}
