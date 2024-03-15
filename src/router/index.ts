import { Router } from 'express'
import { userRouter } from './user'
import { adminRouter } from './admin'
import { nightTask } from '../helpers/cron'
const router = Router()

//user router
router.use('/user', userRouter)
router.use('/admin', adminRouter)
nightTask.start();
// test commit  

export { router }

