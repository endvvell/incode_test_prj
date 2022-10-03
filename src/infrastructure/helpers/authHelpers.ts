import { Request, Response } from 'express'
import { SESSION_NAME } from '../../configs/session-config'

declare module 'express-session' {
    export interface SessionData {
        userId: string
        createdAt: number
    }
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
