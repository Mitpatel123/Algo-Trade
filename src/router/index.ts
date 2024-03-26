import { Router } from 'express'
import { userRouter } from './user'
import { adminRouter } from './admin'
import { nightTask } from '../helpers/cron'
import { uploadRouter } from './upload'
const router = Router()

//user router
router.use('/user', userRouter)
router.use('/admin', adminRouter)
router.use('/upload', uploadRouter)
nightTask.start();
// test commit  

export { router }

