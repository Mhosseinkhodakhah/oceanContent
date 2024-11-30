import { validationResult } from "express-validator";
import contentService from "./services";
import { lessonRole } from "./validators";
import { response } from "./service/responseService";
import lessonModel from "./DB/models/lesson";
import subLessonModel from "./DB/models/subLesson";
import { lessonDB } from "./interfaces";
import contentModel from "./DB/models/content";
import levelModel from "./DB/models/level";
import questionModel from "./DB/models/questions";
import { level } from "winston";
import interConnection from "./interservice/connection";
import internalCache from "./service/cach";
import cacher from "./service/cach";


const services = new contentService()

const connection = new interConnection()



export default class contentController {


    async seenContent(req: any, res: any, next: any) {
        const content = await contentModel.findByIdAndUpdate(req.params.contentId, { $addToSet: { seen: req.user.id } })
        await services.checkSeen(content?.subLesson, req.user.id)
        await connection.resetCache()
        return next(new response(req, res, 'seen content', 200, null, 'content seen by user!'))
    }
    


}