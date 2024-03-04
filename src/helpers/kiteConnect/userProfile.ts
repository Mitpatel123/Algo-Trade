import { KiteConnect } from "kiteconnect";
import config from "config";
import mongoose from "mongoose";
import { Request, Response } from 'express'
import { ObjectId } from 'mongoose';
import util from 'util';

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
        // const loginURL = kite.getLoginURL();
        // console.log("Login URL:", loginURL);

        // In a real application, you need to redirect the user to loginURL and handle the callback to obtain the requestToken.

        const requestToken = '8Q4laM4L0BLJ2qpdM92LWZ91f6kVLunr';

        // Generate session using requestToken
        const response = await kite.generateSession(requestToken, '66izcfeq5uqpm4n9gd9bumdgkqs0sxnq');

        console.log('response :>> ', response);
        // Check if session generation was successful

        const accessToken = response.access_token;
        kite.setAccessToken(accessToken);

        // Fetch user profile using the generated session

        const data = await kite.getProfile();


        console.log('user data ', data);

        return {data,accessToken};

    } catch (error) {
        console.log("Error in kitelogin:", error);
        throw error;
    }
};