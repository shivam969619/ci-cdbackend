"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genrateVideoUrl = exports.deleteCourse = exports.getAdminAllCourses = exports.addReplyToReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseByUser = exports.getAllCourses = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const axios_1 = __importDefault(require("axios"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
//upload course
exports.uploadCourse = (0, catchAsyncErrors_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // console.log("create course is called")
        const data = req.body;
        console.log(data);
        const videoThumbnail = data.videothumbanail;
        if (videoThumbnail) {
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(videoThumbnail, {
                folder: "courses"
            });
            //  data.videothumbanail={
            //         public_id:myCloud.public_id,
            //         url:myCloud.secure_url
            //     }
            data.videothumbanail = myCloud.secure_url;
            console.log(data);
        }
        (0, course_service_1.createCourse)(data, res, next);
    }
    catch (error) {
        console.log(error);
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//edit course 
exports.editCourse = (0, catchAsyncErrors_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const courseId = req.params.id;
        const thumbnail = data.thumbnail;
        const courseData = yield course_model_1.default.findById(courseId);
        if (thumbnail && !thumbnail.startsWith("https")) {
            yield cloudinary_1.default.v2.uploader.destroy(thumbnail.public_id);
            const myCloud = yield cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
            if (thumbnail.startsWith("https")) {
                data.thumbnail = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
        }
        const course = yield course_model_1.default.findById(courseId, { $set: data, }, { new: true });
        res.status(201).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//get single course --without purchasing
exports.getSingleCourse = (0, catchAsyncErrors_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.id;
        const isCacheExist = yield redis_1.redis.get(courseId);
        if (isCacheExist) {
            const course = JSON.parse(isCacheExist);
            res.status(200).json({
                success: true,
                course,
            });
        }
        else {
            const course = yield course_model_1.default.findById(req.params.id).select("-courseData.videoUrl --courseData.suggestion --courseData.questions --courseData.links ");
            yield redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
            res.status(200).json({
                success: true,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//get all courses -- without purchasing
exports.getAllCourses = (0, catchAsyncErrors_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions-courseData.links ");
        yield redis_1.redis.set("allCourses", JSON.stringify(courses));
        res.status(200).json({
            success: true,
            courses
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//get course content --only for purchased course and valid user
exports.getCourseByUser = (0, catchAsyncErrors_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userCourseList = (_a = req.user) === null || _a === void 0 ? void 0 : _a.courses;
        const courseId = req.params.id;
        const coursesExists = userCourseList === null || userCourseList === void 0 ? void 0 : userCourseList.find((course) => course._id.toString() === courseId.toString());
        if (!coursesExists) {
            return next(new ErrorHandler_1.default("You are not eligible to access this course please purchase it", 404));
        }
        const course = yield course_model_1.default.findById(courseId);
        const content = course === null || course === void 0 ? void 0 : course.courseData;
        res.status(200).json({
            success: true,
            content,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.addQuestion = (0, catchAsyncErrors_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    try {
        const { question, courseId, contentId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        const courseContent = (_b = course === null || course === void 0 ? void 0 : course.courseData) === null || _b === void 0 ? void 0 : _b.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("Invalid content id", 400));
        }
        //create a new question object
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: []
        };
        //add this question to our curse content
        courseContent.questions.push(newQuestion);
        yield notificationModel_1.default.create({
            user: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
            title: "New question Recieved",
            message: `You have a new question in ${courseContent.title}`,
        });
        yield (course === null || course === void 0 ? void 0 : course.save());
        res.status(200).json({
            success: true,
            course
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.addAnswer = (0, catchAsyncErrors_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f, _g;
    try {
        const { answer, courseId, contentId, questionId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default(" Invalid content id", 400));
        }
        const courseContent = (_d = course === null || course === void 0 ? void 0 : course.courseData) === null || _d === void 0 ? void 0 : _d.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("", 400));
        }
        const question = (_e = courseContent === null || courseContent === void 0 ? void 0 : courseContent.questions) === null || _e === void 0 ? void 0 : _e.find((item) => item._id.equals(questionId));
        if (!question) {
            return next(new ErrorHandler_1.default(" Invalid content id", 400));
        }
        //create a new answer object
        const newAnswer = {
            user: req.user,
            answer,
        };
        //add this answer to our course content
        question.questionReplies.push(newAnswer);
        yield (course === null || course === void 0 ? void 0 : course.save());
        if (((_f = req.user) === null || _f === void 0 ? void 0 : _f._id) === question.user._id) {
            //create a notification 
            yield notificationModel_1.default.create({
                user: (_g = req.user) === null || _g === void 0 ? void 0 : _g._id,
                title: "New Question Reply Recieved",
                message: `You have a new question reply in${courseContent.title} `
            });
        }
        else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
            };
            const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
                yield (0, sendMail_1.default)({
                    email: question.user.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 500));
            }
            res.status(200).json({
                success: true,
                course,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.addReview = (0, catchAsyncErrors_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    try {
        const userCourseList = (_h = req.user) === null || _h === void 0 ? void 0 : _h.courses;
        const courseId = req.params.id;
        //if the course allredday exist
        const courseExists = userCourseList === null || userCourseList === void 0 ? void 0 : userCourseList.some((course) => course._id.toString() === courseId.toString());
        if (!courseExists) {
            return next(new ErrorHandler_1.default("You are not eligible to access this course", 404));
        }
        const course = yield course_model_1.default.findById(courseId);
        const { review, rating } = req.body;
        const reviewData = {
            user: req.user,
            comment: review,
            rating,
        };
        course === null || course === void 0 ? void 0 : course.reviews.push(reviewData);
        let avg = 0;
        course === null || course === void 0 ? void 0 : course.reviews.forEach((rev) => {
            avg += rev.rating;
        });
        if (course) {
            course.ratings = avg / course.reviews.length;
        }
        yield (course === null || course === void 0 ? void 0 : course.save());
        const notification = {
            title: "New Revies Recieved",
            message: `$(req.user?.name) has given a review in ${course === null || course === void 0 ? void 0 : course.name}`,
        };
        //create notification
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.addReplyToReview = (0, catchAsyncErrors_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    try {
        const { comment, courseId, reviewId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Review not found", 404));
        }
        const review = (_j = course === null || course === void 0 ? void 0 : course.reviews) === null || _j === void 0 ? void 0 : _j.find((rev) => rev._id.toString() === reviewId);
        const replyData = {
            user: req.user,
            comment,
        };
        if (!review) {
            return next(new ErrorHandler_1.default("Review not found", 404));
        }
        if (!review.commentReplies) {
            review.commentReplies = [];
        }
        review.commentReplies.push(replyData);
        yield (course === null || course === void 0 ? void 0 : course.save());
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
////get all courses--only for admins
exports.getAdminAllCourses = (0, catchAsyncErrors_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, course_service_1.getAllCoursesService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
//Delete Course --only for admin
exports.deleteCourse = (0, catchAsyncErrors_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const course = yield course_model_1.default.findById(id);
        if (!course) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        yield course.deleteOne({ id });
        yield redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "course deleted successfully"
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
//genrate video url
exports.genrateVideoUrl = (0, catchAsyncErrors_1.catchAsyncError)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { videoId } = req.body;
        const response = yield axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`
            }
        });
        res.json(response.data);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
}));
