import { NextFunction, Request, Response } from 'express';

export const methodNotAllowed = (req: Request, res: Response, next: NextFunction) => {
    return res.status(405).json({
        status: 'failed',
        message: 'REST method is not allowed for this path',
    });
};
