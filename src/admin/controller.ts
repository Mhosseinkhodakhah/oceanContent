import { validationResult } from "express-validator"
import { response } from "../service/responseService"
import lessonModel from "../DB/models/lesson"
import subLessonModel from "../DB/models/subLesson"
import contentModel from "../DB/models/content"
import levelModel from "../DB/models/level"
import questionModel from "../DB/models/questions"
import internalCache from "../service/cach"
import cacher from "../service/cach"




export default class adminController {


    async createLesson(req: any, res: any, next: any) {
        const bodyError = validationResult(req)
        if (!bodyError.isEmpty()) {
            return next(new response(req, res, 'create lesson', 400, bodyError['errors'][0].msg, null))
        }
        await lessonModel.create(req.body)
        await cacher.reset()
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
        await cacher.reset()
        return next(new response(req, res, 'create subLesson', 200, null, 'new subLesson create successfully'))
    }


    async createContent(req: any, res: any, next: any) {
        const sublesson = await subLessonModel.findById(req.params.sublesson)
        if (!sublesson) {
            return next(new response(req, res, 'create content', 404, 'this lesson is not exist', null))
        }
        const data = {...req.body , subLesson: sublesson._id}
        const content = await contentModel.create(data)
        
        await subLessonModel.findByIdAndUpdate(req.params.sublesson, { $push: { contents: content._id } })
        await cacher.reset()
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
        await cacher.reset()
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
        await cacher.reset()
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
        await cacher.reset()
        return next(new response(req, res, 'create question', 200, null, 'question created successfully!'))
    }


    async getLevels(req: any, res: any, next: any) {
        const level = await levelModel.find()
        return next(new response(req, res, 'get levels', 200, null, level))
    }


    async getContent(req: any, res: any, next: any) {
        const content = await contentModel.findById(req.params.contentId).populate('subLesson')
        return next(new response(req, res, 'get specific content', 200, null, content))
    }

    async updateContent(req: any, res: any, next: any) {
        const content = await contentModel.findById(req.params.contentId).populate('subLesson')
        await content?.updateOne(req.body)
        await content?.save()
        return next(new response(req, res, 'get specific content', 200, null, content))
    }

    async updateLesson(req: any, res: any, next: any) {
        const lesson = await lessonModel.findById(req.params.lessonId).populate('subLesson')
        await lesson?.updateOne(req.body)
        await lesson?.save()
        return next(new response(req, res, 'get specific content', 200, null, lesson))
    }

    async updateSubLesson(req: any, res: any, next: any) {
        const sublesson = await subLessonModel.findById(req.params.sublessonId).populate('subLesson')
        await sublesson?.updateOne(req.body)
        await sublesson?.save()
        return next(new response(req, res, 'get specific content', 200, null, sublesson))
    }


    async getSubLesson(req: any, res: any, next: any) {
        let cacheData = await cacher.getter('admin-getSubLesson')
        let subLesson;
        if (cacheData) {
            console.log('read throw cach . . .')
            if (cacheData[req.params.sublesson]) {
                console.log('read throw cach . . .')
                subLesson = cacheData[req.params.sublesson]
            } else {
                console.log('cache is empty . . .')
                subLesson = await subLessonModel.findById(req.params.sublesson).populate('contents').populate('lesson')
                cacheData[req.params.sublesson] = subLesson
                await cacher.setter('admin-getSubLesson', cacheData)
            }
        } else {
            console.log('cache is empty . . .')
            subLesson = await subLessonModel.findById(req.params.sublesson).populate('contents').populate('lesson')
            cacheData = {}
            cacheData[req.params.sublesson] = subLesson
            await cacher.setter('admin-getSubLesson', cacheData)
        }
        return next(new response(req, res, 'get specific subLesson', 200, null, subLesson))
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