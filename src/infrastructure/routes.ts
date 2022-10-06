import e from 'express';
import { isAuthenticated, isNotLoggedIn } from './middleware/checkUserLoggedIn';
import { methodNotAllowed } from './middleware/methodNotAllowed';
import { changeBoss } from './routes functions/changeBoss';
import { getUsers } from './routes functions/getUsers';
import { loginUser } from './routes functions/login';
import { logoutUser } from './routes functions/logout';
import { registerUser } from './routes functions/register';

export const usersRouter = e.Router();

// Register user:
usersRouter.route('/register').post(isNotLoggedIn, registerUser).all(methodNotAllowed);

// Authenticate a user:
usersRouter.route('/login').post(isNotLoggedIn, loginUser).all(methodNotAllowed);
usersRouter.route('/logout').post(isAuthenticated, logoutUser).all(methodNotAllowed);

// Return list of users
usersRouter.route('/get-users').get(isAuthenticated, getUsers).all(methodNotAllowed);

// Change user's boss
usersRouter.route('/change-boss').post(isAuthenticated, changeBoss).all(methodNotAllowed);
