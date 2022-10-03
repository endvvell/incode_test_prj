import Redis from 'ioredis'
import mongoose from 'mongoose'
import connectRedis from 'connect-redis'
import { createApp } from './app'
import { HTTP_PORT, NODE_ENV } from './configs/global-config'
import { MONGODB_URI } from './configs/mongo-config'
import { logger } from './logger/prodLogger'
import { REDIS_OPTIONS } from './configs/redis-config'
import session, { Store } from 'express-session'

;(async () => {
    // connecting to dbs here:
    try {
        await mongoose.connect(MONGODB_URI).then(() => {
            logger.info('Connected to MongoDB successfully')
        })
    } catch (error) {
        logger.error(`Error while connecting to MongoDB: ${error}`)
        process.exit()
    }

    let sessionStore: Store
    try {
        const RedisStore = connectRedis(session)
        const RedisClient = new Redis(REDIS_OPTIONS)
        sessionStore = new RedisStore({ client: RedisClient })
    } catch (error) {
        logger.error(`Error while connecting to Redis: ${error}`)
        process.exit()
    }

    // initializing webserver here:
    const app = createApp(sessionStore)

    app.listen(HTTP_PORT, () => {
        logger.info(`Listening on port ${HTTP_PORT}, running in ${NODE_ENV}`)
    }).on('error', (error) => {
        logger.error(`Error while starting up: ${error}`)
        process.exit()
    })
})()
