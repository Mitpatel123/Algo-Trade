import express from 'express'
import { userValidation } from '../validation'
import { tradeAction, userController} from '../controller'
import { userJWT } from '../helpers/jwt'
const router = express.Router()

const indiaTimezone = 'Asia/Kolkata';
let buyAT = new Date();
let options = { timeZone: 'Asia/Kolkata', hour12: false };
let indiaTime = buyAT.toLocaleString('en-US', options);

//registration
router.post('/signup', userValidation.signUp, userController.signUp) //complete

//otpverificationn
router.post('/otpverification', userValidation.verificationOtp, userController.OtpVerification) //complete

//update user details
router.patch('/updateuser', userValidation.updateuser, userController.updateUser) //complete
router.post('/buytrade', tradeAction.buystock) //complete
router.post('/selltrade', tradeAction.sellstock) //complete
router.post('/quantity', tradeAction.getQuantity) //complete

router.use(userJWT)

//delete user
router.delete('/delete', userValidation.deletes, userController.deleteuser) //complete

router.post('/getzeroghadata', userController.getUser) //complete
export const userRouter = router