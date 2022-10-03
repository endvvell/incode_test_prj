import e from "express";
import { methodNotAllowed } from "./middleware/methodNotAllowed";

export const usersRouter = e.Router()


// Register user:
usersRouter.route('/register').post().all(methodNotAllowed)

// Authenticate a user: 
usersRouter.route('/login').post().all(methodNotAllowed)
usersRouter.route('/logout').post().all(methodNotAllowed)

// Return list of users
usersRouter.route('/get-users').get().all(methodNotAllowed)

// Change user's boss
usersRouter.route('/change-boss').post().all(methodNotAllowed)