import { Router } from 'express'
import contentController from './controler'
import middleWare from './middleware/middleware'
import { lessonRole, subLessonRole } from './validators'

const controller = new contentController()
const auth = new middleWare().auth

const router = Router()


router.put('/seen-content/:contentId' , auth , controller.seenContent)

router.put('/time' , controller.time)

export default router;