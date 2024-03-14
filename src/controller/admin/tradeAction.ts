import { KiteConnect } from "kiteconnect";
import config from "config";
import { adminTrade, userModel, userTrade, tradeQuantity } from "../../database";
import { apiResponse } from "../../common";

import fund from "../../helpers/funding.json";
import { responseMessage, stockQuantity } from "../../helpers/index";
import { getFundsAndMargins, buyTradeFunction, sellTradeFunction, getOrderTrades } from "../../helpers/kiteConnect/index";
import { encryptData } from "../../common/encryptDecrypt";
import mongoose from "mongoose";
import { Request, Response } from 'express'
import jwt from "jsonwebtoken";
import { ObjectId } from 'mongoose';
import { csvTojson } from "../../database/model/csvTojson";

const funddata = fund;
const ObjectId = mongoose.Types.ObjectId
let usTime = new Date()
let options = { timeZone: 'Asia/kolkata', hour12: false }
let indiaTime = usTime.toLocaleString('en-US', options)

// random number generator for order_id in sell trade and buy trade

// Function to generate a random 5-digit number
function generateRandomNumber() {
    return Math.floor(10000 + Math.random() * 90000);
}

// Generate and print a random 5-digit number

export const buystock = async (req: Request, res: Response) => {
    try {
        const random5DigitNumber = generateRandomNumber();
        let userTradeEnter: any = [];
        const body = req.body
        let index = body.index
        let adminTradeEnter;
        if (body.order_type === "MARKET") {

            adminTradeEnter = new adminTrade({
                tradingsymbol: body.tradingsymbol,
                exchange: body.exchange,
                transaction_type: body.transaction_type,
                order_type: body.order_type,
                product: body.product,
                buyAT: indiaTime
            })
        } else {
            adminTradeEnter = new adminTrade({
                tradingsymbol: body.tradingsymbol,
                exchange: body.exchange,
                transaction_type: body.transaction_type,
                order_type: body.order_type,
                product: body.product,
                buyPrice: body.price,
                buyAT: indiaTime
            })
        }

        const resultAdminTradeEnter = await adminTradeEnter.save();
        console.log(resultAdminTradeEnter);
        const alluserdata = await userModel.find({
            isActive: true,
            isDelete: false,
            isVerified: true,
            role: 1,
            $expr: { $lt: ['$totalUsePlan', '$plan'] }
        });
        console.log(alluserdata);
        const promises = alluserdata.map(async userData => {
            const quantityObj = await tradeQuantity.findOne({ user_id: userData.id, [`${index}.symbol`]: index }, { [`${index}`]: 1, _id: 0 });
            return buyTradeFunction(req, res, userData, body, resultAdminTradeEnter, quantityObj[index]);
        });

        const userTradeResults = await Promise.all(promises);
        userTradeEnter = userTradeResults.filter(result => result !== undefined);

        const customizedTime = usTime.toLocaleDateString('en-US', options);
        const insertdata = new userTrade(
            {
                trade_id: new ObjectId(resultAdminTradeEnter._id),
                tradingsymbol: body.tradingsymbol,
                loatSize: body.LoatSize,
                tradeTime: customizedTime,
                trade: userTradeEnter,
            });

        const resultUserTradeEnter = await insertdata.save();

        return res.status(200).json(new apiResponse(200, "buy stock details", { resultAdminTradeEnter, resultUserTradeEnter }, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error.message));
    }
}



export const sellstock = async (req: Request, res: Response) => {
    try {
        const { id, sellPrice, tradingsymbol } = req.body;
        const body = req.body;
        const buyTradeData = await userTrade.findOne({ trade_id: id });

        await adminTrade.findOneAndUpdate({ _id: id }, { $set: { sellPrice, sellAT: indiaTime } });
        let sellUserData = [];
        const alluserdata = await userModel.find({ isActive: true, isDelete: false, isVerified: true });


        const promises = alluserdata.map(async userData => {
            return sellTradeFunction(req, res, userData, body);
        })
        const userTradeResults = await Promise.all(promises);
        sellUserData = userTradeResults.filter(result => result !== undefined);


        return res.status(200).json(new apiResponse(200, "sell stock details", sellUserData, {}));
    } catch (error) {
        return res
            .status(500)
            .json(new apiResponse(500, responseMessage.internalServerError, {}, error.message));
    }
};


export const getQuantity = async (req: Request, res: Response) => {
    try {
        const { id, index, quantity } = req.body;

        const userData = await userModel.findById(id);

        if (!userData) {
            return res.status(400).json(new apiResponse(400, "User not found", {}, {}));
        }

        if (!userData.isKiteLogin) {
            return res.status(400).json(new apiResponse(400, "Kite login is required", {}, {}));
        }

        if (!userData.isActive) {
            return res.status(400).json(new apiResponse(400, "User is not active", {}, {}));
        }

        if (!userData.isVerified) {
            return res.status(400).json(new apiResponse(400, "User verification is required", {}, {}));
        }

        const updateData = {
            [`${index}.quantity`]: quantity,
            [`${index}.setAt`]: indiaTime,
            [`${index}.symbol`]: index,
        };

        const result = await tradeQuantity.findOneAndUpdate(
            { user_id: id },
            { $set: updateData },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const message = quantity.length === 0 ? "Quantity added successfully" : "Quantity updated successfully";

        return res.status(200).json(new apiResponse(200, message, { data: result }, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));
    }
};


//set the request token in the data base

export const login = async (req: Request, res: Response) => {
    try {
        const request_token = req.query.request_token;
        const body = req.body;
        if (request_token) {
            const data = await userModel.findOne({ _id: body.id });
            if (data) {
                const updatedata = await userModel.findOneAndUpdate({ _id: body.id }, { $set: { request_token } })
                return res.status(200).json(new apiResponse(200, "access token", { request_token }, {}));
            } else {
                return res.status(402).json(new apiResponse(402, "in valid user id", {}, {}));
            }
        } else {
            return res.status(402).json(new apiResponse(402, "request token is required", {}, {}));
        }
    } catch (error) {
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));
    }
}

export const getBuyPayload = async (req: Request, res: Response) => {
    try {

        const body = req.body;
        console.log(body.expiry);
        if (body === null || body === undefined || Object.keys(body).length === 0) {
            return res.status(200).json(new apiResponse(200, "index", ["sensex", "finNifty", "midcpNifty", "nifty", "bankNifty"], {}));
        } else if (body.index !== null && body.expiry === undefined) {
            console.log("🙂🙂🙂🙂🙂🙂🙂🙂🙂");
            const index_obj = await csvTojson.find();
            // const data = index_obj[0][body.index]
            console.log('index_obj :>> ', index_obj);
            const data = index_obj[0]
            console.log('data :>> ', data);
            const unique_date = [...new Set(data.map(item => item.expiry))]
            console.log('unique_date :>> ', unique_date);
            let filtered = data.filter((e) => {
                return e.expiry == expiry
            });
            return res.status(200).json(new apiResponse(200, "index", filtered, {}));

        }
        const { index, expiry, tradingsymbol } = req.body





        // const symbol = [...new Set(filtered.map(item => item.tradingsymbol))]


        // let tradingsymbolfiltered = data.filter((e) => {
        //     return e.tradingsymbol == tradingsymbol
        // });

        // const exchange_value = [...new Set(tradingsymbolfiltered.map(item => item.exchange))]


        // return res.status(200).json(new apiResponse(200, "index", exchange_value, { unique_date, symbol }));

    } catch (error) {
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));
    }
}