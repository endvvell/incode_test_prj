import { NextFunction, Request, Response } from 'express'
import { isLoggedIn } from '../helpers/authHelpers'

export const isNotLoggedIn = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (isLoggedIn(req)) {
            return res.status(403).json({
                status: 'failed',
                reason: 'You are already logged in',
            })
        } else {
            next()
        }
    } catch (error) {
        next(error)
    }
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!isLoggedIn(req)) {
            return res.status(403).json({ status: 'failed', reason: 'Not logged in' })
        } else {
            next()
        }
    } catch (error) {
        next(error)
    }
}
