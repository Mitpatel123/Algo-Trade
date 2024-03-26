import { KiteConnect } from "kiteconnect";
import config from "config";
import { userModel, userTicket } from "../../database";
import { apiResponse } from "../../common";
import { responseMessage } from "../../helpers/response";
import { kitelogin } from "../../helpers/kiteConnect/index";
import mongoose, { Collection } from "mongoose";
import { Request, Response } from 'express'
// import trade from "../../helpers/kiteConnect/websocketyashbank";

const ObjectId = mongoose.Types.ObjectId
let buyAT = new Date();
let options = { timeZone: 'Asia/Kolkata', hour12: false };
let indiaTime = buyAT.toLocaleString('en-US', options);


export const addTicket = async (req: Request, res: Response) => {
    try {
        const body = req.body
        const user_id = body.user_id

        let user_details = await userModel.findById({ _id: user_id })

        if (!user_details) {
            return res.status(200).json(new apiResponse(400, responseMessage.invalidId('user'), {}, {}));
        }

        body.name = user_details.fullname
        body.email = user_details.email

        let response = await new userTicket(body).save()

        return res.status(200).json(new apiResponse(200, responseMessage.success, response, {}));

    } catch (error) {
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));
    }
}


export const getTicket = async (req: Request, res: Response) => {
    try {

        const body = req.body
        const category = req.body.category
        const start_date = body.start_date
        const end_date = body.end_date

        let user_details = await userModel.findById({ _id: new ObjectId(body.user_id) })

        if (!user_details) {
            return res.status(400).json(new apiResponse(400, responseMessage.invalidId('user'), {}, {}));
        }

        if (body.ticket_id) {
            let response: any = await userTicket.aggregate([
                { $match: { _id: new ObjectId(body.ticket_id) } },
            ])

            return res.status(200).json(new apiResponse(200, responseMessage.success, response, {}));
        }


        let response: any = await userTicket.aggregate([
            { $match: { user_id: new ObjectId(body.user_id) } },
        ])

        if (category) {
            response = response.filter((e) => {
                return e.category == category
            });
        }

        if (start_date || end_date) {
            response = response.filter((item, index) => item.created >= start_date && item.created <= end_date);
        }


        return res.status(200).json(new apiResponse(200, responseMessage.success, response, {}));

    } catch (error) {
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));
    }
}


export const getTicketById = async (req: Request, res: Response) => {
    try {

        const { id } = req.params

        let response: any = await userTicket.aggregate([
            { $match: { _id: new ObjectId(id) } },
        ])

        return res.status(200).json(new apiResponse(200, responseMessage.success, response, {}));

    } catch (error) {
        return res.status(500).json(new apiResponse(500, "Internal Server Error", {}, error));
    }
}

