const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware")

const authRouter = Router();

/** *
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register", authController.registerUserController);


/**
 * @route POST /api/auth/login
 * @description login user with email and password
 * @access Public
 */
authRouter.post("/login", authController.loginUserController);


/**
 * @route GET /api/auth/logout
 * @description Clear the token from the cookie and add it to the blacklist
 * @access Public
 */
authRouter.get("/logout", authController.logoutUserController);


/**
 * @route GET /api/auth/get-me
 * @description Get the current logged in user details
 * @access Private
 */
authRouter.get("/get-me", authMiddleware.authUser,authController.getMeController)



module.exports = authRouter;