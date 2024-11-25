import { validationResult } from "express-validator"
import { response } from "../service/responseService"
import lessonModel from "../DB/models/lesson"
import subLessonModel from "../DB/models/subLesson"
import contentModel from "../DB/models/content"
import levelModel from "../DB/models/level"
import questionModel from "../DB/models/questions"




export default class adminController {
    async createLesson(req: any, res: any, next: any) {
        const bodyError = validationResult(req)
        if (!bodyError.isEmpty()) {
            return next(new response(req, res, 'create lesson', 400, bodyError['errors'][0].msg, null))
        }
        await lessonModel.create(req.body)
        return next(new response(req, res, 'create lesson', 200, null, 'new lesson create successfully'))
    }



    async createSublesson(req: any, res: any, next: any) {
        const bodyError = validationResult(req)
        if (!bodyError.isEmpty()) {
            return next(new response(req, res, 'create subLesson', 400, bodyError['errors'][0].msg, null))
        }
        const existance = await lessonModel.findById(req.params.lesson)
        if (!existance) {
            return next(new response(req, res, 'create subLesson', 404, 'this lesson is not exist on database', null))
        }
        const subData = { ...req.body, lesson: existance._id }
        const subLesson = await subLessonModel.create(subData)
        const lesson = await lessonModel.findByIdAndUpdate(req.params.lesson, { $push: { sublessons: subLesson._id } })
        return next(new response(req, res, 'create subLesson', 200, null, 'new subLesson create successfully'))
    }


    async createContent(req: any, res: any, next: any) {
        const sublesson = await subLessonModel.findById(req.params.sublesson)
        if (!sublesson) {
            return next(new response(req, res, 'create content', 404, 'this lesson is not exist', null))
        }

        const content = await contentModel.create({ internalContent: req.body.internalContent, subLesson: sublesson._id })

        await subLessonModel.findByIdAndUpdate(req.params.sublesson, { $push: { contents: content._id } })

        return next(new response(req, res, 'create content', 200, null, content))
    }



    async creteNewLevel(req: any, res: any, next: any) {
        const lesson = await lessonModel.findById(req.params.lessonId)
        if (!lesson) {
            return next(new response(req, res, 'create new level', 404, 'this lesson is not defined on database', null))
        }
        const level = { number: req.body.number, reward: req.body.reward, lesson: lesson._id }
        const existLevelNumber = await levelModel.findOne({ number: req.body.number })
        if (existLevelNumber) {
            const lesss = await levelModel.find({ number: { $gt: req.body.number } })
            for (let i = 0; i < lesss.length; i++) {
                // await lesss[i].updateOne({ $inc: { number: 1 } })
                lesss[i].number += 1
                await lesss[i].save()
            }
            await levelModel.findOneAndUpdate({ number: req.body.number }, { $inc: { number: 1 } })
            const levelCreation = await levelModel.create(level)
            await lesson.updateOne({ $addToSet: { levels: levelCreation._id } })
            await lesson.save()
            return next(new response(req, res, 'create new level', 200, null, 'new level creation successfully'))
        }
        const levelCreation = await levelModel.create(level)
        await lesson.updateOne({ $addToSet: { levels: levelCreation._id } })
        await lesson.save()
        return next(new response(req, res, 'create new level', 200, null, 'new level creation successfully'))
    }


    async deleteLevel(req: any, res: any, next: any) {
        const level = await levelModel.findById(req.params.levelId)
        if (!level) {
            return next(new response(req, res, 'delete level', 404, 'this level is not defined on database', null))
        }
        const lesson = await lessonModel.findOne({ levels: { $in: level._id } })
        const uppersLevels = await levelModel.find({ number: { $gt: level.number } })
        await lesson?.updateOne({ $pull: { levels: level._id } })
        await lesson?.save()
        await level.deleteOne()
        await level.save()
        for (let i = 0; i < uppersLevels.length; i++) {
            const newNumber = uppersLevels[i].number -= 1
            await uppersLevels[i].updateOne({ number: newNumber })
            await uppersLevels[i].save()
        }
        return next(new response(req, res, 'deleting level', 200, null, 'level deleted successfully'))
    }



    async createQuestion(req: any, res: any, next: any) {
        const level = await levelModel.findById(req.params.levelId)
        if (!level) {
            return next(new response(req, res, 'create content', 404, 'this level is not defined on database', null))
        }
        const data = { ...req.body, level: level._id }
        const question = await questionModel.create(data)
        await level.updateOne({ $addToSet: { questions: question._id } })
        await level.save()
        return next(new response(req, res, 'create question', 200, null, 'question created successfully!'))
    }


    async getLevels(req: any, res: any, next: any) {
        let userId = req.user.id;
        const closedLevels = await lessonModel.find({ seen: { $ne: userId } }).populate('levels').select('levels')
        const unPasseedLevels = await lessonModel.find({ $and: [{ seen: { $in: userId } }, { paasedQuize: { $ne: userId } }] }).populate('levels').select('levels')
        const passedLevels = await lessonModel.find({ $and: [{ seen: { $in: userId } }, { paasedQuize: { $in: userId } }] }).populate('levels').select('levels')

        return next(new response(req, res, 'get levels', 200, null, { closedLevels: closedLevels, unPasseedLevels: unPasseedLevels, passedLevels: passedLevels }))
    }


    async getContent(req: any, res: any, next: any) {
        const content = await contentModel.findById(req.params.contentId).populate('subLesson')
        return next(new response(req, res, 'get specific content', 200, null, content))
    }


    async getSubLesson(req: any, res: any, next: any) {
        const sublesson = await subLessonModel.findById(req.params.sublesson).populate('contents').populate('lesson')
        return next(new response(req, res, 'get specific subLesson', 200, null, sublesson))
    }


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




}