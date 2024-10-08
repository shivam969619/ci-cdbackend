import { Response } from "express";
import CourseModel from "../models/course.model";
import { catchAsyncError } from "../middleware/catchAsyncErrors";

//create course 

export const createCourse=catchAsyncError(async(data:any,res:Response)=>{
const course=await CourseModel.create(data);
// console.log("loging data here" ,data);
res.status(201).json({
    success:true,
    course
});
// console.log("loging course here" ,course)
})

//get All courses

export const getAllCoursesService=async(res:Response)=>{
    const courses=await CourseModel.find().sort({createdAt:-1});
    res.status(201).json({
        success:true,
        courses,
    })
};