import { validationResult } from "express-validator"
import { response } from "../service/responseService"
import lessonModel from "../DB/models/lesson"
import subLessonModel from "../DB/models/subLesson"
import contentModel from "../DB/models/content"
import levelModel from "../DB/models/level"
import questionModel from "../DB/models/question"
import internalCache from "../service/cach"
import cacher from "../service/cach"
import interConnection from "../interservice/connection"
const { translate } = require('free-translate');



const connection = new interConnection()
export default class adminController {

    async createLesson(req: any, res: any, next: any) {
        const bodyError = validationResult(req)
        if (!bodyError.isEmpty()) {
            return next(new response(req, res, 'create lesson', 400, bodyError['errors'][0].msg, null))
        }
        if (!req.body.aName) {          // translation for arabic
            const translatedText = await translate(req.body.name, { to: 'ar' });
            req.body.aName = translatedText
        }
        if (!req.body.eName) {          // translation for arabic
            const translatedText = await translate(req.body.name, { to: 'en' });
            req.body.eName = translatedText
        }
        const lesson = await lessonModel.create(req.body)
        const firstLevel = await levelModel.create({
            number: req.body.number,
            lesson: lesson._id,
            reward: 0
        })
        await lessonModel.findByIdAndUpdate(lesson._id , {$addToSet:{levels:firstLevel._id}})
        const h = await connection.resetCache()
        console.log(h)
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

        await connection.resetCache()
        return next(new response(req, res, 'create subLesson', 200, null, 'new subLesson create successfully'))
    }



    async createTitle(req: any, res: any, next: any) {
        const sublesson = await subLessonModel.findById(req.params.sublessonId)
        if (!sublesson) {
            return next(new response(req, res, 'create title', 404, 'this sublesson is not exist on database', null))
        }
        await sublesson.updateOne({ $addToSet: { subLessons: req.body } })
        await connection.resetCache()
        return next(new response(req, res, 'create title', 200, null, 'the title created successfulle'))
    }


    
    
    async createContent(req: any, res: any, next: any) {
        let sublesson;
        sublesson = await subLessonModel.findById(req.params.sublesson)
        if (sublesson) {
            const data = { ...req.body, subLesson: sublesson._id , state : 0 }
            const content = await contentModel.create(data)
            
            await subLessonModel.findByIdAndUpdate(req.params.sublesson, { content: content._id })
            await connection.resetCache()
            return next(new response(req, res, 'create content', 200, null, content))
        }
        sublesson = await subLessonModel.findOne({ 'subLessons._id': req.params.sublesson })
        console.log('is it here??', sublesson)
        if (!sublesson) {
            return next(new response(req, res, 'creating content', 404, 'this sublesson is not exist on database', null))
        }
        const data = { ...req.body , subLesson: req.params.sublesson , state : 0 }
        const content = await contentModel.create(data)
        
        
        sublesson.subLessons.forEach(element => {
            if (element._id == req.params.sublesson) {
                element['content'] = content._id
                console.log('new content . . .', element)
            }
        });
        await sublesson.save()
        await connection.resetCache()
        console.log('check for last time , , , ,')
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
        await connection.resetCache()
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
        for (let i = 0; i < uppersLevels.length; i++) {
            uppersLevels[i].number -= 1
            await uppersLevels[i].save()
        }
        await connection.resetCache()
        return next(new response(req, res, 'deleting level', 200, null, 'level deleted successfully'))
    }
    
    
    
    async createQuestion(req: any, res: any, next: any) {
        const level = await levelModel.findById(req.params.levelId)
        if (!level) {
            return next(new response(req, res, 'create content', 404, 'this level is not defined on database', null))
        }
        req.body.trueOption -= 1
        const data = { ...req.body, level: level._id }
        const question = await questionModel.create(data)
        await level.updateOne({ $addToSet: { questions: question._id } })
        await level.save()
        await connection.resetCache()
        return next(new response(req, res, 'create question', 200, null, 'question created successfully!'))
    }
    
    
    async getLevels(req: any, res: any, next: any) {
        let cacheData = await cacher.getter('admin-getLevels')
        let finalData;
        if (cacheData) {
            console.log('read throw cache . . .')
            finalData = cacheData;
        } else {
            console.log('cache is empty . . .')
            finalData = await levelModel.find()
            await cacher.setter('admin-getLevels', finalData)
        }
        return next(new response(req, res, 'get levels', 200, null, finalData))
    }
    
    
    async getContent(req: any, res: any, next: any) {
        let cacheData = await cacher.getter(`admin-getContent-${req.params.contentId}`)
        let finalData;
        if (cacheData) {
            console.log('read throw cache . . .')
            finalData = cacheData
        } else {
            console.log('cache is empty . . .')
            finalData = await contentModel.findById(req.params.contentId).populate('subLesson')
            if (!finalData) {
                return next(new response(req, res, 'get specific content', 404, 'this content is not exist on database', null))
            }
            await cacher.setter(`admin-getContent-${req.params.contentId}`, finalData)
        }
        return next(new response(req, res, 'get specific content', 200, null, finalData))
    }
    
    // it has problem
    async updateContent(req: any, res: any, next: any) {
        console.log( 'body', req.body)
        // let fcontent = await contentModel.findById(req.params.contentId)
        // await contentModel.findByIdAndUpdate(req.params.contentId , req.body)
        const content = await contentModel.findById(req.params.contentId)
        // let newData = {internalContent : req.body.internalContent}
        // delete req.body.internalContent;
        // const finalData = { ...(content?.toObject()) , ...req.body , internalContent : req.body.internalContent}
        await content?.updateOne(req.body)
        // await content?.save()
        let finalData = await contentModel.findById(req.params.contentId)
        await connection.resetCache()
        return next(new response(req, res, 'update content by admin', 200, null, finalData))
    }
    

    async updateLesson(req: any, res: any, next: any) {
        const lesson = await lessonModel.findById(req.params.lessonId).populate('sublessons')
        const finalData = { ...(lesson?.toObject()), ...req.body }
        await lesson?.updateOne(finalData)
        await lesson?.save()
        await connection.resetCache()
        return next(new response(req, res, 'update lesson by admin', 200, null, lesson))
    }
    
    async updateSubLesson(req: any, res: any, next: any) {
        const sublesson = await subLessonModel.findById(req.params.subLessonId)
        const finalData = { ...(sublesson?.toObject()), ...req.body }
        await sublesson?.updateOne(finalData)
        await sublesson?.save()
        await connection.resetCache()
        return next(new response(req, res, 'update sublessons', 200, null, finalData))
    }


    // it has a problemmmmm
    async updateTitle(req: any, res: any, next: any){
        console.log( 'body', req.params.titleId)

        const title = await subLessonModel.findOne({'subLessons._id' : req.params.titleId})
        console.log( 'title', title?.subLessons)
        if (!title){
            return next(new response(req , res , 'update title' , 404 , 'this title is not exist on database' , null))
        }
        let finalData;
        let newTitle = title.toObject()
        for (let i = 0 ; i < title?.subLessons.length ; i++){
            if (title.subLessons[i]._id.toString() == req.params.titleId){
                title.subLessons[i] = req.body
                await title.updateOne({})
            }
        }
        // await title.save()
        await connection.resetCache()
        return next(new response(req , res , 'update title' , 200 , null , title))
    }

    async deleteContent(req: any, res: any, next: any){
        console.log(req.params.contentId)
        const content = await contentModel.findById(req.params.contentId)
        if (!content){
            console.log('no content exist')
        }
        await contentModel.findByIdAndDelete(req.params.contentId)
        // here you shoud update sublesson . . .
        await connection.resetCache()
        return next(new response(req , res , 'delete content' , 200 , null , content))
    }

    async getAll(req: any, res: any, next: any){
        const content = await subLessonModel.find()
        return res.status(200).json({
            content : content
        })
    }


    async getSubLesson(req: any, res: any, next: any) {
        let cacheData = await cacher.getter(`admin-getSubLesson-${req.params.sublessonId}`)
        let subLesson;
        if (cacheData) {
            console.log('read throw cach . . .')
            subLesson = cacheData
        } else {
            console.log('cache is empty . . .')
            subLesson = await subLessonModel.findById(req.params.sublessonId).populate('contents').populate('lesson')
            if (!subLesson) {
                return next(new response(req, res, 'get specific subLesson', 404, 'this sublesson is not exist on database', null))
            }
            await cacher.setter(`admin-getSubLesson-${req.params.sublessonId}`, subLesson)

        }

        return next(new response(req, res, 'get specific subLesson', 200, null, subLesson))
    }


    async getLessons(req: any, res: any, next: any) {
        let cacheData = await cacher.getter('admin-getLessons')
        let finalData;
        if (cacheData) {
            finalData = cacheData;
        } else {
            const lessons = await lessonModel.find().populate({
                path: 'sublessons',
                populate: {
                    path: 'contents',
                    select: 'internalContent',
                }
            })
            await cacher.setter('admin-getLessons', lessons)
            finalData = lessons
        }
        return next(new response(req, res, 'get lessons', 200, null, finalData))
    }




}