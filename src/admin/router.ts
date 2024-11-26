import { Router } from "express";
import middleWare from "../middleware/middleware";
import { lessonRole, subLessonRole } from "../validators";
import adminController from "./controller";


const adminRouter = Router()
const adminAuth = new middleWare().adminAuth
const controller = new adminController()


adminRouter.post('/create-lesson' , lessonRole  , controller.createLesson)

adminRouter.post('/create-sublesson/:lesson' , subLessonRole , adminAuth , controller.createSublesson)

adminRouter.post('/create-content/:sublesson' , adminAuth ,controller.createContent)

adminRouter.post('/create-level/:lesson' , adminAuth , controller.creteNewLevel )

adminRouter.delete('/delete-level' , adminAuth , controller.deleteLevel)

adminRouter.post('/create-questions/:levelId' , adminAuth ,controller.createQuestion)

adminRouter.post('/update-content/:contentId' , adminAuth , controller.updateContent)

adminRouter.post('/update-lesson/:lessonId' , adminAuth , controller.updateLesson)

adminRouter.post('/update-subLesson/:subLessonId' , adminAuth , controller.updateSubLesson)

adminRouter.get('/get-lessons' , adminAuth , controller.getLessons)

adminRouter.get('/get-sublessons' , adminAuth , controller.getSubLesson)

adminRouter.get('/get-content' , adminAuth , controller.getContent)

adminRouter.get('/get-levels' , adminAuth , controller.getLevels)


export default adminRouter;