import { Router } from "express";
import middleWare from "../middleware/middleware";
import { lessonRole, subLessonRole } from "../validators";
import adminController from "./controller";



const adminRouter = Router()
const adminAuth = new middleWare().adminAuth
const controller = new adminController()


adminRouter.post('/create-lesson' , lessonRole , adminAuth , controller.createLesson)

adminRouter.post('/create-sublesson/:lesson' , subLessonRole , adminAuth , controller.createSublesson)

adminRouter.post('/create-content/:sublesson' , adminAuth ,controller.createContent)

adminRouter.post('/create-level/:lesson' , adminAuth , controller.creteNewLevel )

adminRouter.delete('/delete-level' , adminAuth , controller.deleteLevel)

adminRouter.post('/create-questions/:levelId' , adminAuth ,controller.createQuestion)

export default adminRouter;