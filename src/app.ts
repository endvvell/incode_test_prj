import e from "express";

export const createApp = () => {
    const app = e()

    // MIDDLEWARE:
    app.use(e.urlencoded({extended: true}))
    app.use(e.json())

    // IN CASE 404 - NOT FOUND:
    app.all('*', (req, res) => {
        return res.status(404).send('404 - resource not found')
    })

    return app
}