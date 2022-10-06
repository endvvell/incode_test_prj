import { checkEmpty } from '../../infrastructure/helpers/checkEmpty';
import { InvalidInputError } from '../custom errors/InvalidInputError';

export type userRole = 'ADMIN' | 'BOSS' | 'REGULAR';

export class User {
    public id: string | null = null;
    public username: string = '';
    public password: string = '';
    public firstName: string | null = null;
    public lastName: string | null = null;
    public role: userRole = 'REGULAR';
    public boss: string | null = null;
    public subordinates: string[] | null = null;
    public pathIgnoreRules: 'login' | 'register' | '' = '';

    constructor({
        ...inputObj
    }: {
        username: string;
        password: string;
        firstName: string | null;
        lastName: string | null;
        boss: string | null;
        role: userRole;
        subordinates: string | string[] | null;
        pathIgnoreRules: 'login' | 'register';
    }) {
        if (inputObj.username) {
            this.username = this.validUsername(inputObj.username);
        } else {
            throw new InvalidInputError({
                message: "Invalid input: user's username not provided",
                statusCode: 400,
            });
        }
        if (inputObj.password) {
            this.password = this.validPassword(inputObj.password);
        } else {
            throw new InvalidInputError({
                message: "Invalid input: user's password not provided",
                statusCode: 400,
            });
        }
        if (inputObj.firstName) {
            this.firstName = this.validFirstName(inputObj.firstName);
        }
        if (inputObj.lastName) {
            this.lastName = this.validLastName(inputObj.lastName);
        }
        if (inputObj.boss) {
            this.boss = this.validUsername(inputObj.boss);
        }
        if (inputObj.role) {
            if (inputObj.role.toUpperCase() === 'BOSS') {
                if (!inputObj.subordinates || inputObj.subordinates.length === 0) {
                    throw new InvalidInputError({
                        message:
                            'Invalid input: a user with a role of a boss must have at least one subordinate: "subordinates" field missing',
                        statusCode: 400,
                    });
                } else {
                    this.role = this.validUserRole(inputObj.role, inputObj.subordinates);
                }
            } else {
                this.role = this.validUserRole(inputObj.role);
            }
        } else {
            if (inputObj.pathIgnoreRules !== 'login') {
                throw new InvalidInputError({
                    message: "Invalid input: user's role not provided",
                    statusCode: 400,
                });
            }
        }
    }

    validUsername(username: string) {
        const pattern = /^[\p{sc=Latn}\p{Nd}_.-]*$/u.test(username);
        if (!checkEmpty(username) || username.trim().length < 3 || username.trim().length > 32 || !pattern) {
            throw new InvalidInputError({
                message: `Invalid username (${username}): must be at least 3 alphanumeric characters long - underscores(_), dots(.), and dashes(-) are allowed`,
                statusCode: 400,
            });
        } else {
            return username;
        }
    }

    validPassword(password: string) {
        const pattern = /^(?=.*[!@#$%^&*.])(?=.*[A-z]).*$/u.test(password);

        if (!checkEmpty(password) || password.trim().length < 8 || password.trim().length > 80 || !pattern) {
            throw new InvalidInputError({
                message: 'Invalid password: must consist of at least 8 alphanumeric characters including 1 special character',
                statusCode: 400,
            });
        } else {
            return password;
        }
    }

    validFirstName(value: string) {
        if (!checkEmpty(value) || value.trim().length > 100) {
            throw new InvalidInputError({
                message: 'Invalid value for the "first name" provided',
                statusCode: 400,
            });
        } else {
            return value;
        }
    }

    validLastName(value: string) {
        if (!checkEmpty(value) || value.trim().length > 100) {
            throw new InvalidInputError({
                message: 'Invalid value for the "last name" provided',
                statusCode: 400,
            });
        } else {
            return value;
        }
    }

    validUserRole(value: Partial<userRole>, subordinates?: string | string[]): userRole {
        if (!checkEmpty(value) || !['ADMIN', 'BOSS', 'REGULAR'].includes(value.trim().toUpperCase())) {
            throw new InvalidInputError({
                message: "Invalid value for the user's role provided, options - admin, boss, regular",
                statusCode: 400,
            });
        } else {
            switch (value.toUpperCase()) {
                case 'ADMIN':
                    return <Partial<userRole>>value.trim().toUpperCase();
                case 'BOSS':
                    this.validateSubordinates(subordinates!); // "!" - because if the code reached this point that would mean that "subordinates" was truthy in the constructor
                    return <Partial<userRole>>value.trim().toUpperCase();
                case 'REGULAR':
                default:
                    return <Partial<userRole>>value.trim().toUpperCase();
            }
        }
    }

    validateSubordinates(value: string | string[]) {
        if (typeof value === 'string') {
            if (value === this.username) {
                throw new InvalidInputError({
                    message: 'Invalid value: a boss cannot be their own subordinate',
                    statusCode: 400,
                });
            } else {
                try {
                    if (Array.isArray(this.subordinates)) {
                        this.subordinates.push(this.validUsername(value));
                    } else {
                        this.subordinates = [this.validUsername(value)];
                    }
                } catch (error) {
                    throw new InvalidInputError({
                        message: `Invalid value: '${value}' is an invalid username - must be at least 3 alphanumeric characters long - underscores(_), dots(.), and dashes(-) are allowed`,
                        statusCode: 400,
                    });
                }
            }
        } else if (Array.isArray(value)) {
            value.forEach((sub_username) => {
                if (sub_username === this.username) {
                    throw new InvalidInputError({
                        message: 'Invalid value: a boss cannot be their own subordinate',
                        statusCode: 400,
                    });
                } else {
                    try {
                        if (Array.isArray(this.subordinates)) {
                            this.subordinates.push(this.validUsername(sub_username));
                        } else {
                            this.subordinates = [this.validUsername(sub_username)];
                        }
                    } catch (error) {
                        throw new InvalidInputError({
                            message: `Invalid value: '${sub_username}' is an invalid username - must be at least 3 alphanumeric characters long - underscores(_), dots(.), and dashes(-) are allowed`,
                            statusCode: 400,
                        });
                    }
                }
            });
        }
    }
}
