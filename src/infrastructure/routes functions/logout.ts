import { Request, Response } from 'express'
import { logger } from '../../logger/prodLogger'
import { logOut } from '../helpers/authHelpers'

export const logoutUser = async (req: Request, res: Response) => {
    try {
        await logOut(req, res)
        return res.status(200).json({ status: 'success', message: 'User logged out' })
    } catch (error) {
        logger.error(`Error while logging out: ${error}`)
        return res.status(500).json({
            status: 'failed',
            reason: 'Error while logging out, please try again later',
        })
    }
}
