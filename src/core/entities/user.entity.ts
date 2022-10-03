import { checkEmpty } from '../../infrastructure/helpers/checkEmpty'

export type userRole = 'ADMIN' | 'BOSS' | 'REGULAR'

export class User {
    public id: string | null = null
    public username: string = ''
    public password: string = ''
    public firstName: string | null = null
    public lastName: string | null = null
    public role: userRole = 'REGULAR'

    constructor({
        ...inputObj
    }: {
        username: string
        password: string
        firstName: string | null
        lastName: string | null
        role: userRole
    }) {
        if (inputObj.username) {
            this.username = this.validUsername(inputObj.username)
        }
        if (inputObj.password) {
            this.password = this.validPassword(inputObj.password)
        }
        if (inputObj.firstName) {
            this.firstName = this.validFirstName(inputObj.firstName)
        }
        if (inputObj.lastName) {
            this.lastName = this.validLastName(inputObj.lastName)
        }
        if (inputObj.role) {
            this.role = this.validUserRole(inputObj.role)
        }
    }

    validUsername(username: string) {
        const pattern = /^[\p{sc=Latn}\p{Nd}_.-]*$/u.test(username)
        if (
            !checkEmpty(username) ||
            username.trim().length < 3 ||
            username.trim().length > 32 ||
            !pattern
        ) {
            throw new Error(
                'Invalid username: must be at least 3 alphanumeric characters long - underscores(_), dots(.), and dashes(-) are allowed',
            )
        } else {
            return username
        }
    }

    validPassword(password: string) {
        const pattern = /^(?=.*[!@#$%^&*.])(?=.*[A-z]).*$/u.test(password)

        if (
            !checkEmpty(password) ||
            password.trim().length < 8 ||
            password.trim().length > 50 ||
            !pattern
        ) {
            throw new Error(
                'Invalid password: must consist of at least 8 alphanumeric characters including 1 special character',
            )
        } else {
            return password
        }
    }

    validFirstName(value: string) {
        if (!checkEmpty(value) || value.trim().length > 100) {
            throw new Error('Invalid value for the "first name" provided')
        } else {
            return value
        }
    }

    validLastName(value: string) {
        if (!checkEmpty(value) || value.trim().length > 100) {
            throw new Error('Invalid value for the "last name" provided')
        } else {
            return value
        }
    }

    validUserRole(value: Partial<userRole>): userRole {
        if (
            !checkEmpty(value) ||
            !['ADMIN', 'BOSS', 'REGULAR'].includes(value.trim().toUpperCase())
        ) {
            throw new Error("Invalid value for the user's role provided")
        } else {
            return value
        }
    }
}
