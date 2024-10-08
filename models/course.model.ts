import mongoose,{Document,Model,Schema} from "mongoose";
import { User } from "./user.model";
import { timeStamp } from "console";

 interface IComment extends Document{
    user:User,
    question:string;
    questionReplies:IComment[];
}


  interface IReview extends Document{
    user:User,
    rating :number,
    comment:string;
    commentReplies:IComment[];
}

interface ILink extends Document {
    title:string,
    url:string;
}

interface ICourseData extends Document{
    title:string;
    description:string;
    videoUrl:string;
    videoThumbanail:string;
    videoSection:string;
    videoLength:number;
    videoPlayer:string;
    links:ILink[];
    suggestion:string;
    questions:IComment[];
    
}

interface ICourse extends Document{
    name:string;
    description?:string;
    categories:string;
    price:number;
    estimatedPrice?:number;
    videothumbanail:string;
    tags:string;
    level:string;
    demoUrl:string;
    benefits:{title:string}[];
    prerequisites:{title:string}[];
    reviews:IReview[];
    courseData:ICourseData[];
    ratings?:number;
    purchased?:number;
}

const reviewSchema=new Schema<IReview>({
    user:Object,
    rating:{
        type:Number,
        default:0,
    },
    comment:String,
    commentReplies:[Object],
});

const linkSchema=new Schema<ILink>({
    title:String,
    url:String,
})

const commentSchema=new Schema<IComment>({
    user:Object,
    question:String,
    questionReplies:[Object],
});

const courseDataSchema=new Schema<ICourseData>({
    videoUrl:String,
    title:String,
    videoSection:String,
    description:String,
    videoLength:Number,
    videoPlayer:String,
    links:[linkSchema],
    suggestion:String,
    questions:[commentSchema],

});

const courseSchema=new Schema<ICourse>({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    categories:{
        type:String,
    },
    price:{
        type:Number,
        required:true,
    },
    estimatedPrice:{
        type:Number,
    },
    videothumbanail:{
        // type: {
        //     public_id: String,
        //     url: String,
        // },
        type:String,
        required: true,
     
    },

    tags:{
        required:true,
        type:String,  
    },
    level:{
        required:true,
        type:String,  
    },
    demoUrl:{
        required:true,
        type:String,  
    },
    benefits:[{title:String}],
    prerequisites:[{title:String}],
    reviews:[reviewSchema],
    courseData:[courseDataSchema],
ratings:{
    type:Number,
    default:0,
},
purchased:{
    type:Number,
    default:0,
}
},{timestamps:true});

const CourseModel:Model<ICourse>=mongoose.model("Course",courseSchema);
export default CourseModel;
