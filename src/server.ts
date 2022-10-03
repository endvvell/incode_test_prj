import { createApp } from "./app"

;(async() => {
    // connecting to db here:

    // initializing webserver here:
    const app = createApp()

    app.listen(3000, () => {
        console.log('Listening on port 3000, running in dev')
    }).on('error', (error) => {
        // <log the error here>
        process.exit()
    })
})()