import mongoose, { Schema , model } from "mongoose";
import joi from 'joi'
import { subLessonDB } from "../../interfaces";


const subLessonSchema = new Schema<subLessonDB>({
    name : {type : String},
    eName : {type : String},
    aName : {type : String},
    number : {type : Number},
    lesson : {type : mongoose.Types.ObjectId , ref : 'lessons'},
    contents : [{type : mongoose.Types.ObjectId , ref : 'contents'}],
    seen:[String]
})


const subLessonModel = model<subLessonDB>('subLessons' , subLessonSchema)

export default subLessonModel