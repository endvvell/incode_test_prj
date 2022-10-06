export const { NODE_ENV = 'dev', HTTP_PORT = 3000 } = process.env;

export const IS_IN_PROD = NODE_ENV === 'prod';

export const BCRYPT_ROUNDS = 13;
