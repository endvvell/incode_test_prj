import e, { NextFunction, Request, Response } from 'express'
import { usersRouter } from './infrastructure/routes'

export const createApp = () => {
    const app = e()

    // MIDDLEWARE:
    app.use(e.urlencoded({ extended: true }))
    app.use(e.json())

    // JSON input error handler
    app.use(
        (error: Error | any, req: Request, res: Response, next: NextFunction) => {
            if (error.status === 400)
                return res
                    .status(error.status)
                    .json({ status: 'failed', reason: 'Invalid JSON provided' })
            next()
        },
    )

    // ROUTERS
    app.use('/api/v1/users', usersRouter)

    // TODO: implement routes error handling here

    // IN CASE 404 - NOT FOUND:
    app.all('*', (req, res) => {
        return res.status(404).send('404 - resource not found')
    })

    return app
}
