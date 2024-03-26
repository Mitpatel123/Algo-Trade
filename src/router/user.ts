import express from 'express'
import { userValidation } from '../validation'
import { tradeAction, userController, planDetails, tradeSummary, ticketDetails } from '../controller'
import { userJWT } from '../helpers/jwt'
import { test_1 } from '../controller/admin/tradeSummary'
import { testkite } from '../helpers/test2'
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
router.post('/updateuser', userValidation.updateuser, userController.updateUser) //complete

router.post('/kitelogout', userController.kitelogout) //complete
// router.use(userJWT)
router.post('/buyPlan', planDetails.BuyPlan) //complete
router.post('/req', test_1)

//get buy trade
router.post('/userBuyTrade', tradeSummary.getbuyuserdashboard) //complete

//get sell trade
router.post('/userSellTrade', tradeSummary.getselluserdashboard) //complete

//set quantity API
router.post('/quantity', tradeAction.getQuantity) //complete

//get quantity API
router.post('/user_quantity', tradeSummary.get_user_quantity)

//delete user
router.delete('/delete', userValidation.deletes, userController.deleteuser) //complete

//login to the kite
router.post('/getzeroghadata', userController.getUser) //complete

// router.post('/req',test_1)

router.get('/generate-sha256')
router.post('/req', test_1)
router.post('/test1', testkite)

//ticket
router.post('/userTicket',userValidation.addTicket, ticketDetails.addTicket)

router.get('/getUserTicket', userValidation.getTicket, ticketDetails.getTicket)

router.get('/getTicketById/:id', ticketDetails.getTicketById)

// router.use(userJWT)
export const userRouter = router