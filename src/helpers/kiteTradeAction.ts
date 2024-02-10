import { KiteConnect } from "kiteconnect";
import config from "config";
// import { adminTrade, userModel, userTrade, tradeQuantity } from "../../database";
// import { apiResponse } from "../../common";
// import data from "../../helpers/userdata.json";
// import fund from "../../helpers/funding.json";
// import { responseMessage } from "../../helpers/response";
// import { stockQuantity } from "../../helpers/testing";
// import { encryptData } from "../../common/encryptDecrypt";
import mongoose from "mongoose";
import { Request, Response } from 'express'
import jwt from "jsonwebtoken";
import { ObjectId } from 'mongoose';
// const jsondata = data;
// const funddata = fund;
const { Types } = require('mongoose');
const ObjectId = mongoose.Types.ObjectId
let usTime = new Date()
let options = { timeZone: 'Asia/kolkata', hour12: false }
let indiaTime = usTime.toLocaleString('en-US', options)
const kite = new KiteConnect({
    api_key: config.get('api_key'),
});


//kite login API

export const kitelogin = async () => {
    try {
        const loginURL = kite.getLoginURL();
        console.log("Login URL:", loginURL);

        // In a real application, you need to redirect the user to loginURL and handle the callback to obtain the requestToken.

        const requestToken = '1CblHiAlk7ZZ4MJAsMNIDtNv3fd2M0L5'; // Replace with the actual requestToken obtained from the callback.

        const response = await kite.generateSession(requestToken, config.get('api_secret'));

        const accessToken = response.access_token;
        kite.setAccessToken(accessToken);

        const userProfile = await new Promise((resolve, reject) => {
            kite.getProfile((error, data) => {
                if (error) {
                    console.log("Error getting user profile:", error);
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });

        return userProfile;
    } catch (error) {
        console.log("Error in kitelogin:", error);
        throw error;
    }
};

//incomplete
export const buy = async (accessToken, userId, symbol, quantity, exchange, order_type, product) => {


    kite.setAccessToken(accessToken);

    try {
        const response = await kite.ltp([symbol]);
        const instrumentToken = response[symbol].instrument_token;

        // Place a market order to buy
        const orderResponse = await kite.placeOrder(userId, "regular", {
            tradingsymbol: symbol,
            exchange: exchange,
            transaction_type: "BUY",
            order_type: order_type,
            quantity,
            product: product,
        });
        if (orderResponse) {
            console.log(`Order placed successfully for user ${userId}:`, orderResponse);
        }
    } catch (error) {
        console.error(`Error placing order for user ${userId}:`, error);
    }

}