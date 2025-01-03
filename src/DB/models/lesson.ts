import mongoose, { Schema , model } from "mongoose";
import joi from 'joi'
import { lessonDB } from "../../interfaces";
import subLessonModel from "./subLesson";


const lessonSchema = new Schema<lessonDB>({
    name : {type : String},
    eName : {type : String},
    aName : {type : String},
    number : {type : Number},
    sublessons : [{type : mongoose.Types.ObjectId , ref : 'subLessons'}],
    reward : {type : Number , default : 100},
    seen:[String],
    rewarded :[String],
    levels : [{type : mongoose.Types.ObjectId , ref : 'levels'}],
    paasedQuize : [String],
},{timestamps:true})


// lessonSchema.pre('save', function(next) {
//     // do stuff
//     next();
//   });



const lessonModel = model<lessonDB>('lessons' , lessonSchema)

export default lessonModel;