import e, { NextFunction, Request, Response } from 'express';
import session, { Store } from 'express-session';
import { SESSION_OPTIONS } from './configs/session-config';
import { InvalidInputError } from './core/custom errors/InvalidInputError';
import { usersRouter } from './infrastructure/routes';
import { logger } from './logger/prodLogger';

export const createApp = (sessionStore: Store) => {
    const app = e();

    // EXPRESS MIDDLEWARE
    app.use(e.urlencoded({ extended: true }));
    app.use(e.json());

    // JSON input error handler
    app.use((error: Error | any, req: Request, res: Response, next: NextFunction) => {
        if (error.status === 400) return res.status(error.status).json({ status: 'failed', reason: 'Invalid JSON provided' });
        next();
    });

    // SESSION MIDDLEWARE
    app.use(
        session({
            ...SESSION_OPTIONS,
            store: sessionStore,
        }),
    );

    // ROUTERS
    app.use('/api/v1/users', usersRouter);

    // Routers error handler
    app.use((error: Error | InvalidInputError, req: Request, res: Response, next: NextFunction) => {
        if (error instanceof InvalidInputError) {
            // logger.error(`Error while processing user's input: ${error.message}`)
            return res.status(error.statusCode).json({
                status: 'failed',
                reason: error.message,
            });
        } else {
            logger.error(`Error while processing a request: ${error}`);
            return res.status(500).json({
                status: 'failed',
                reason: 'Request failed due to a server error, please try again later',
            });
        }
    });

    // IN CASE 404 - NOT FOUND
    app.all('*', (req: Request, res: Response) => {
        return res.status(404).send('404 - resource not found');
    });

    return app;
};
