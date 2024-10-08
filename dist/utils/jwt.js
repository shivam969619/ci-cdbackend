"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.refreshTokenOptions = exports.accessTokenOptions = exports.accessTokenExpire = void 0;
const redis_1 = require("./redis");
// Parse environment variables to integrate
exports.accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10);
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10);
// Options for cookies
exports.accessTokenOptions = {
    expires: new Date(Date.now() + exports.accessTokenExpire * 60 * 60 * 1000),
    maxAge: exports.accessTokenExpire * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
};
exports.refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
};
const sendToken = (user, statusCode, res) => {
    if (!user) {
        return res.status(500).json({
            success: false,
            message: "User not found",
        });
    }
    const accessToken = user.SignAcessToken();
    const refreshToken = user.SignRefreshToken();
    // Upload session to redis
    redis_1.redis.set(user._id, JSON.stringify(user));
    // Only set secure to true in production
    if (process.env.NODE_ENV === 'production') {
        exports.accessTokenOptions.secure = true;
    }
    res.cookie("access_token", accessToken, exports.accessTokenOptions);
    res.cookie("refresh_token", refreshToken, exports.refreshTokenOptions);
    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
    });
};
exports.sendToken = sendToken;
