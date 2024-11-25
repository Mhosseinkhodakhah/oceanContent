import mongoose,{ Schema , model } from "mongoose";
import joi from 'joi';
import { questionDB } from "../../interfaces";



const questionsSchema = new Schema<questionDB>({
    questionForm : {type : String , require : true},
    options : [String],
    trueOption : {type : Number},
    time : {type : Number},
    level : {type : mongoose.Types.ObjectId , ref : 'levels'},
    passedUser : [String]
})


const questionModel = model<questionDB>('questions' , questionsSchema)

export default questionModel