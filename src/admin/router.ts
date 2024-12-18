import { Router } from "express";
import middleWare from "../middleware/middleware";
import { lessonRole, subLessonRole } from "../validators";
import adminController from "./controller";


const adminRouter = Router()
const adminAuth = new middleWare().adminAuth
const controller = new adminController()


adminRouter.post('/create-lesson' , lessonRole   ,controller.createLesson)

adminRouter.post('/create-sublesson/:lesson' , subLessonRole , adminAuth , controller.createSublesson)

adminRouter.post('/create-title/:sublessonId' , controller.createTitle)

adminRouter.post('/create-content/:sublesson'  ,controller.createContent)

adminRouter.post('/update-content/:contentId' , adminAuth , controller.updateContent)

adminRouter.post('/update-lesson/:lessonId' , adminAuth , controller.updateLesson)

adminRouter.post('/update-subLesson/:subLessonId' , adminAuth , controller.updateSubLesson)

adminRouter.post('/update-title/:titleId' , controller.updateTitle)

adminRouter.delete('/delete-content/:contentId' , controller.deleteContent)

adminRouter.get('/getAll' , controller.getAll)

export default adminRouter;