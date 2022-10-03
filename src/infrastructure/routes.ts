import e from "express";
import { methodNotAllowed } from "./middleware/methodNotAllowed";
import { loginUser } from "./routes functions/login";
import { logoutUser } from "./routes functions/logout";
import { registerUser } from "./routes functions/register";

export const usersRouter = e.Router()


// Register user:
usersRouter.route('/register').post(registerUser).all(methodNotAllowed)

// Authenticate a user: 
usersRouter.route('/login').post(loginUser).all(methodNotAllowed)
usersRouter.route('/logout').post(logoutUser).all(methodNotAllowed)

// Return list of users
usersRouter.route('/get-users').get().all(methodNotAllowed)

// Change user's boss
usersRouter.route('/change-boss').post().all(methodNotAllowed)