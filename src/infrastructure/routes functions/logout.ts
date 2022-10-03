import { Request, Response } from "express";
import { logger } from "../../logger/prodLogger";
import { logOut } from "../helpers/authHelpers";

export const logoutUser = (req: Request, res: Response) => {
    try {
        logOut(req, res)
    } catch (error) {
        logger.error(`Error while logging out: ${error}`)
        return res.status(500).json({status: 'failed', reason: 'Error while logging out, please try again later'})
    }
}