import { Router } from 'express'
import contentController from './controler'
import middleWare from './middleware/middleware'
import { lessonRole, subLessonRole } from './validators'

const controller = new contentController()
const auth = new middleWare().auth

const router = Router()


router.get('/get-lessons/:lang' , controller.getLessons)

router.get('/get-sublesson/:sublessonId/:lang' , controller.getSubLesson)

router.get('/get-content/:contentId/:lang' , controller.getContent)

router.put('/seen-content/:contentId' , auth , controller.seenContent)

router.get('/get-levels' , auth , controller.getLevels)

router.get('/open-level/:number' , auth , controller.openLevel)

router.put('/answer-question' , auth , controller.answer)

export default router;