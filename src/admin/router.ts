import { Router } from "express";
import middleWare from "../middleware/middleware";
import { lessonRole, subLessonRole } from "../validators";
import adminController from "./controller";


const adminRouter = Router()
const adminAuth = new middleWare().adminAuth
const controller = new adminController()


adminRouter.post('/create-lesson' , lessonRole  ,adminAuth ,controller.createLesson)

adminRouter.post('/create-sublesson/:lesson' , subLessonRole , adminAuth , controller.createSublesson)

adminRouter.post('/create-title/:sublessonId' , controller.createTitle)

adminRouter.post('/create-content/:sublesson'  ,controller.createContent)

adminRouter.post('/create-level/:lessonId' , adminAuth , controller.creteNewLevel )

adminRouter.delete('/delete-level/:levelId' , adminAuth , controller.deleteLevel)

adminRouter.post('/create-questions/:levelId' , adminAuth ,controller.createQuestion)

adminRouter.post('/update-content/:contentId' , adminAuth , controller.updateContent)

adminRouter.post('/update-lesson/:lessonId' , adminAuth , controller.updateLesson)

adminRouter.post('/update-subLesson/:subLessonId' , adminAuth , controller.updateSubLesson)

adminRouter.get('/get-lessons' , adminAuth , controller.getLessons)

adminRouter.get('/get-sublessons/:sublessonId' , adminAuth , controller.getSubLesson)

adminRouter.get('/get-content/:contentId' , adminAuth , controller.getContent)

adminRouter.get('/get-levels' , adminAuth , controller.getLevels)


export default adminRouter;