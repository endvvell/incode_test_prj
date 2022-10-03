import mongoose from 'mongoose'
import { createApp } from './app'
import { HTTP_PORT, NODE_ENV } from './configs/global-config'
import { MONGODB_URI } from './configs/mongo-config'
import { logger } from './logger/prodLogger'
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

    // initializing webserver here:
    const app = createApp()

    app.listen(HTTP_PORT, () => {
        logger.info(`Listening on port ${HTTP_PORT}, running in ${NODE_ENV}`)
    }).on('error', (error) => {
        logger.error(`Error while starting up: ${error}`)
        process.exit()
    })
})()
