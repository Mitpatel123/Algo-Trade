import mongoose from "mongoose";
import { Request, Response } from 'express'
import { apiResponse } from "../../common";
import { responseMessage } from "../response";
const ObjectId = mongoose.Types.ObjectId
let usTime = new Date()
let options = { timeZone: 'Asia/kolkata', hour12: false }
let indiaTime = usTime.toLocaleString('en-US', options)


//not required
export const userProfitAndLossData = (req: Request, res: Response, userData, buyTradeData) => {
//     try {
//         let invested = 0;
//         let totalinvested = 0;
//         let money = 0;

//         console.log('userData :>> ', userData);
//         if (buyTradeData) {
//             buyTradeData.forEach((e) => {
//                 e['trade'].forEach((data) => {
//                     console.log(data.isSelled === true);
//                     console.log(data.user_id === userData._id);
//                     if (data.isSelled === true && String(data.user_id) === String(userData._id)) {
//                         money = money + data.profit;
//                     }
//                 });
//             });

//             userData["profit"] = money;
//             console.log(" ===================================", userData);
//             // console.log("🤐🤐🤐🤐🤐🤐🤐userData", userData);
//             return userData;
//         }
//     } catch (error) {
//         return error;
//     }
};