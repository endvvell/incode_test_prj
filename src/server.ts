import mongoose from 'mongoose'
import { createApp } from './app'
import { MONGODB_URI } from './configs/mongo-config'

;(async () => {
    // connecting to dbs here:
    try {
        await mongoose.connect(MONGODB_URI).then(() => {
            console.log('Connected to MongoDB successfully')
        })
    } catch (error) {
        // <log.error>
        process.exit()
    }

    // initializing webserver here:
    const app = createApp()

    app.listen(3000, () => {
        console.log('Listening on port 3000, running in dev')
    }).on('error', (error) => {
        // <log the error here>
        process.exit()
    })
})()
