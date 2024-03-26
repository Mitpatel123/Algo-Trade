"use strict"
import { Router } from 'express'
import {  file_upload_response, uploadS3 } from '../helpers'


const router = Router()

//  ------   Authentication ------  
// router.use(uploadJWT)

router.post('/upload/single_file', uploadS3.single('image'), file_upload_response)


export const uploadRouter = router 