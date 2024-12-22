import { validationResult } from "express-validator";
import contentService from "./services";
import { lessonRole } from "./validators";
import { response } from "./service/responseService";
import lessonModel from "./DB/models/lesson";
import subLessonModel from "./DB/models/subLesson";
import { lessonDB } from "./interfaces";
import contentModel from "./DB/models/content";
import levelModel from "./DB/models/level";
import questionModel from "./DB/models/question";
import { level } from "winston";
import interConnection from "./interservice/connection";
import internalCache from "./service/cach";
import cacher from "./service/cach";


const services = new contentService()

const connection = new interConnection()



export default class contentController {


    async seenContent(req: any, res: any, next: any) {
        const content = await contentModel.findById(req.params.contentId)
        if (!content){
            return next(new response(req, res, 'seen content', 404, 'this content is not exist on databse',null))
        }
        await services.makeLog(req.user , `seen content` , `seen content ${content?.internalContent.title}`)
        let subLesson;
        if (content?.state == 1) {
            console.log('its title . . .')
            subLesson = await subLessonModel.findOne({ 'subLessons._id': content?.subLesson })
            subLesson?.subLessons.forEach((element : any) => {
                if (element._id == content?.subLesson) {
                    element.seen.push(req.user.id)
                    console.log('sublesson seen successfully . . .' , element['seen'])
                }
            });
            await subLesson?.save()
            console.log('update the sublesson')
            await services.makeLog(req.user , `seen content` , `seen all content of subLesson ${subLesson?.name}`)
            let allSublessonsSeen =0;
            subLesson?.subLessons.forEach((element:any) => {
                if (element.seen.includes(req.user.id)) {
                    allSublessonsSeen++;
                }
            });
            if (allSublessonsSeen == subLesson?.subLessons.length){                        // if all sublessons seen in level 1
                await subLesson?.updateOne({$addToSet:{seen : req.user.id}})
            }
            console.log('update the second sublessons')
            let lesson = await lessonModel.findById(subLesson?.lesson).populate('sublessons')
            let allLessonSeen=0;
            lesson?.sublessons.forEach((element:any)=>{
                if (element.seen.includes(req.user.id)){
                    allLessonSeen++;
                }
            })
            if (lesson?.sublessons.length == allLessonSeen){
                await lesson.updateOne({$addToSet:{seen : req.user.id}})
                const rewardResponse = await connection.putReward(req.user.id, lesson?.reward, `finished ${lesson?.number} Lesson`)
                await services.makeLog(req.user , `seen content` , `seen all content of lesson ${lesson?.number}`)
                if (rewardResponse.success) {
                    await lesson.updateOne({$addToSet:{rewarded : req.user.id}})
                }
            }
            console.log('update the lesson')
        } else if(content?.state == 0) {
            subLesson = await subLessonModel.findById(content?.subLesson)
            await subLesson?.updateOne({$addToSet:{seen : req.user.id}})
            await services.makeLog(req.user , `seen content` , `seen all content of subLesson ${subLesson?.name}`)
            let lesson = await lessonModel.findById(subLesson?.lesson).populate('sublessons')
            let allLessonSeen=0;
            lesson?.sublessons.forEach((element:any)=>{
                if (element.seen.includes(req.user.id)){
                    allLessonSeen++;
                }
            })
            if (lesson?.sublessons.length == allLessonSeen){
                await lesson.updateOne({$addToSet:{seen : req.user.id}})
                const rewardResponse = await connection.putReward(req.user.id, lesson?.reward, `finished ${lesson?.number} Lesson`)
                await services.makeLog(req.user , `seen content` , `seen all content of lesson ${lesson?.number}`)
                if (rewardResponse.success) {
                    await lesson.updateOne({$addToSet:{rewarded : req.user.id}})
                }
            }
        }
        console.log(content)
        await content.updateOne({ $addToSet: { seen: req.user.id } })
        await connection.resetCache()
        return next(new response(req, res, 'seen content', 200, null, 'content seen by user!'))
    }



}