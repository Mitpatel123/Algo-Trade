import express from 'express';
import { userValidation } from '../validation';
import { tradeAction, userController, tradeSummary } from '../controller';
import { userJWT } from '../helpers/jwt';
import { createSHA } from '../controller/admin/tradeSummary';
import { test3 } from '../helpers/test3';
import multer from 'multer';
import { passwordOrOtp } from '../controller/admin/admin';
import { getBuyPayload } from '../controller/admin/tradeAction';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });


// console.log('"run_adminn_controller"', "run_admin_controller")
//buy trade API
router.post('/buytrade', tradeAction.buystock) //complete

//sell trade API
router.post('/selltrade', tradeAction.sellstock) //complete

//set quantity API
router.post('/quantity', tradeAction.getQuantity) //complete

//request token get API
router.post('/login', tradeAction.login) //complete

//get quantity API
router.get('/user_quantity', tradeSummary.get_user_quantity)

//get all trade which is not sell
router.get('/get_trade', tradeSummary.trade_get)

//get perticular user trade which is not sell
router.get('/user_get_trade', tradeSummary.user_trade_get)

//get profit and loss API
router.get('/profit_loss',tradeSummary.profit_loss)

//get total investment
router.get('/total_investment',tradeSummary.totalInverstment)

//get trade current market value
router.get('/market_value',tradeSummary.marketValue)

router.get('/unlinkUserHistory',tradeSummary.getUnlinkUserHistory)

//get kite login user data
router.get('/getKiteLoginUserData',tradeSummary.getKiteLoginUserDetails)

//get kite unlink user data
router.get('/getKiteNotLoginUserData',tradeSummary.getKiteNotLoginUserDetails)

//update kite link user data
router.post('/updateKiteLoginUserData',tradeSummary.updateUserDetailsByAdmin)

//block kite linked user
router.post('/blockUser',tradeSummary.blockUserByAdmin)

router.post('/tradeHistory',tradeSummary.tradeHistory)

router.get('/generate-sha256',createSHA)

router.post('/subtradeHistory',tradeSummary.subtradeHistory)

router.post('/csv', upload.single('csvFile'), test3);

router.get('/Check_password',passwordOrOtp)

// get trade payload data 
router.post('/getBuyPayload', getBuyPayload)

export const adminRouter = router 