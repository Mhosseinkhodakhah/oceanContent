import contentModel from "./DB/models/content";
import lessonModel from "./DB/models/lesson";
import subLessonModel from "./DB/models/subLesson";
import interConnection from "./interservice/connection";

const connection = new interConnection()


export default class contentService{
    
    async checkSeen(id:string , userId : string){
        const contents = await contentModel.find({subLesson : id})
        const seenContents = await contentModel.find({$and:[{subLesson : id} , {seen : {$in :userId}}]})
        const sublesson = await subLessonModel.findById(id)
        let lessonId = sublesson?.lesson
        if (contents.length == seenContents.length){
            await subLessonModel.findByIdAndUpdate(id , {$push:{seen : userId}})
            const sublessons = await subLessonModel.find({lesson : lessonId})
            const seenSubLessons = await subLessonModel.find({$and:[{lesson : id} , {$in : {seen : userId}}]})
            if (sublessons.length == seenSubLessons.length){
                const seenLesson = await lessonModel.findByIdAndUpdate(lessonId , {$push:{seen : userId}})
                const rewardResponse = await connection.putReward(userId , seenLesson?.reward , `finished ${seenLesson?.name} Lesson`)
                if (rewardResponse.success){
                    await lessonModel.findByIdAndUpdate(lessonId , {rewarded : true})
                }
            }
        }
    }
}