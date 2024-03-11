import { KiteConnect } from "kiteconnect";
import config from "config";
import { adminTrade, userModel, userTrade, tradeQuantity } from "../../database";
import { apiResponse } from "../../common";

import fund from "../../helpers/funding.json";
import { responseMessage, stockQuantity } from "../../helpers/index";
import { getFundsAndMargins } from "../../helpers/kiteConnect/index";
import { encryptData } from "../../common/encryptDecrypt";
import mongoose from "mongoose";
import { Request, Response } from 'express'
import jwt from "jsonwebtoken";
import { ObjectId } from 'mongoose';

const funddata = fund;
const ObjectId = mongoose.Types.ObjectId
let usTime = new Date()
let options = { timeZone: 'Asia/kolkata', hour12: false }
let indiaTime = usTime.toLocaleString('en-US', options)


//not required
//this function is call inside the history function of tradesSummary
// export const tradeHistoryFun = async (req: Request, res: Response, e, historyData, alltrade) => {
//     try {
//         for (let j = 0; j < e['trade'].length; j++) {
//             const data = e['trade'][j];
//             if (data.isSelled === false) {
//                 const key = `${e.tradeTime}_${data.user_id}`;
//                 const userData = await userModel.findById(new ObjectId(data.user_id));
//                 if (Object.keys(alltrade).length !== 0 && alltrade[key]) {
//                     alltrade[key] += data.profit;
//                     historyData[data.user_id] = {
//                         fullname: userData.fullname,
//                         email: userData.email,
//                         phoneNumber: userData.phoneNumber,
//                         z_user_id: userData.z_user_id,
//                         date: e.tradeTime,
//                         profit: (historyData[data.user_id]?.profit || 0) + data.profit,
//                     };
//                 } else {
//                     alltrade[key] = data.profit;
//                     historyData[data.user_id] = {
//                         fullname: userData.fullname,
//                         email: userData.email,
//                         phoneNumber: userData.phoneNumber,
//                         z_user_id: userData.z_user_id,
//                         date: e.tradeTime,
//                         profit: data.profit,
//                     };
//                 }
//             }
//         }
//         return historyData;
//     } catch (error) {
//         return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
//     }
// };