import { Router } from 'express'
import { userRouter } from './user'
import { adminRouter } from './admin'
const router = Router()

//user router
router.use('/user', userRouter)
router.use('/admin', adminRouter)

// test commit  

export { router }

