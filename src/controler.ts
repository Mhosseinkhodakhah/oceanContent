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


const services = new contentService()

const connection = new interConnection()

export default class contentController {


    async getLessons(req: any, res: any, next: any) {
        const lessons = await lessonModel.find().populate({
            path: 'sublessons',
            populate: {
                path: 'contents',
                select: 'internalContent',
            }
        })
        return next(new response(req, res, 'get lessons', 200, null, lessons))
    }


    async getSubLesson(req: any, res: any, next: any) {
        const sublesson = await subLessonModel.findById(req.params.sublesson).populate('contents').populate('lesson')
        return next(new response(req, res, 'get specific subLesson', 200, null, sublesson))
    }


    async getContent(req: any, res: any, next: any) {
        const content = await contentModel.findById(req.params.contentId).populate('subLesson')
        return next(new response(req, res, 'get specific content', 200, null, content))
    }


    async seenContent(req: any, res: any, next: any) {
        const content = await contentModel.findByIdAndUpdate(req.params.contentId, { $push: { seen: req.user.id } })
        await services.checkSeen(req.params.contentId, req.user.id)
        return next(new response(req, res, 'seen content', 200, null, 'content seen by user!'))
    }


    async getLevels(req: any, res: any, next: any) {
        let userId = req.user.id;
        const closedLevels = await lessonModel.find({ seen: { $ne: userId } }).populate('levels').select('levels')
        const unPasseedLevels = await lessonModel.find({ $and: [{ seen: { $in: userId } }, { paasedQuize: { $ne: userId } }] }).populate('levels').select('levels')
        const passedLevels = await lessonModel.find({ $and: [{ seen: { $in: userId } }, { paasedQuize: { $in: userId } }] }).populate('levels').select('levels')

        return next(new response(req, res, 'get levels', 200, null, { closedLevels: closedLevels, unPasseedLevels: unPasseedLevels, passedLevels: passedLevels }))
    }

    async openLevel(req: any, res: any, next: any) {
        let userId = req.user.id;
        const level = await levelModel.findOne({ number: req.params.number })
        if (level?.passedUsers.includes(userId)) {
            const questiotns = await questionModel.find({ level: level?._id }).limit(10)
            return next(new response(req, res, 'open level', 200, null, { questions: questiotns }))
        }
        const questiotns = await questionModel.find({ $and: [{ level: level?._id }, { passedUser: { $ne: userId } }] }).limit(10)
        return next(new response(req, res, 'open level', 200, null, { questions: questiotns }))
    }


    //! needs to review
    async answer(req: any, res: any, next: any) {
        const answers = req.body
        let trueAnswers: number = 0;
        const question = await questionModel.findOne({ questionForm: answers[0].questionForm })
        for (let i = 0; i < answers.length; i++) {
            let title = answers[i].questionForm;
            if (question?.options[question?.trueOption] == answers[i].answer) {
                trueAnswers++;
                await questionModel.findOneAndUpdate({ questionForm: title }, { $push: { passedUser: req.user.id } })
            }
        }
        if (trueAnswers == 10) {
            const level = await levelModel.findByIdAndUpdate(question?.level, { $push: { passedUsers: req.user.id } })
            const rewarded = await connection.putReward(req.user.id, level?.reward, `passed ${level?.number} level`)
            if (rewarded.success) {
                await levelModel.findByIdAndUpdate(level?._id, { rewarded: true })
            }
            const lessonLevels = await lessonModel.findById(level?.lesson).populate('levels').select('levels')
            for (let j = 0; j < lessonLevels?.levels.length; j++) {
                if (lessonLevels?.levels[j].passedUser.includes(req.user.id)) {
                    await lessonModel.findByIdAndUpdate(level?.lesson, { $push: { paasedQuize: req.user.id } })
                    return next(new response(req, res, 'answer questions', 200, null, { message: 'congratulation! you passed this quize' }))
                }
            }
        } else {
            return next(new response(req, res, 'answer questions', 200, null, { message: 'sorry! you cant pass this level! please review the lesson and try again' }))
        }
    }




}