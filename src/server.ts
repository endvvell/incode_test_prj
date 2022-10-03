import mongoose from 'mongoose'
import { createApp } from './app'
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

    app.listen(3000, () => {
        console.log('Listening on port 3000, running in dev')
    }).on('error', (error) => {
        logger.error(`Error while starting up: ${error}`)
        process.exit()
    })
})()
