import { SessionOptions } from 'express-session';
import { IS_IN_PROD } from './global-config';

export const {
    SESSION_SECRET = `top secret string`,
    SESSION_NAME = 'sid',
    SESSION_IDLE_TIMEOUT = 1000 * 60 * 30, // half an hour
} = process.env;

export const SESSION_OPTIONS: SessionOptions = {
    secret: SESSION_SECRET,
    name: SESSION_NAME,
    cookie: {
        maxAge: +SESSION_IDLE_TIMEOUT,
        secure: IS_IN_PROD,
        sameSite: true,
    },
    rolling: true,
    resave: false,
    saveUninitialized: false,
};
