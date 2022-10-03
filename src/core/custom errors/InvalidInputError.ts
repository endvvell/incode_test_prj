export class InvalidInputError {
    public message: string = 'Invalid input'
    public statusCode: number = 400
    constructor(error: {message: string, statusCode: number}) {
        this.message = error.message
        this.statusCode = error.statusCode
    }
}