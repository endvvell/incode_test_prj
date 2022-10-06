import { Request, Response } from 'express';
import { SESSION_NAME } from '../../configs/session-config';
import { User } from '../../core/entities/user.entity';

declare module 'express-session' {
    export interface SessionData {
        userId: string;
        userRole: string;
        createdAt: number;
    }
}

export const createNewUserObj = async (req: Request, path: 'login' | 'register') => {
    if (path === 'login') {
        if (req.body.subordinates) delete req.body.subordinates;
        if (req.body.role) delete req.body.role;
    }

    return new User({ ...req.body, pathIgnoreRules: path });
};

export const isLoggedIn = (req: Request) => {
    if (req.session.userId) {
        return true;
    } else {
        return false;
    }
};

export const logIn = (req: Request, userId: string, userRole: string) => {
    req.session.userId = userId;
    req.session.userRole = userRole;
    req.session.createdAt = Date.now();
};

export const logOut = async (req: Request, res: Response) => {
    return new Promise((resolve, reject) => {
        req.session.destroy((error) => {
            if (error) {
                reject(error);
            } else {
                res.clearCookie(SESSION_NAME);
                resolve(res);
            }
        });
    });
};
