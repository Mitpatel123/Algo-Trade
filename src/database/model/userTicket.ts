import { number } from "joi";
import mongoose from "mongoose";

let buyAT = new Date();
let options = { timeZone: 'Asia/Kolkata', hour12: false };
let indiaTime = buyAT.toLocaleString('en-US', options);

const userTicketSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, default: null , ref : 'user' },
    name: { type: String, default: null },
    email: { type: String, default: null },
    subject: { type: String, default: null },
    message: { type: String, default: null },
    response: { type: String, default: null }, 
    category: { type: String, default: null },
    status: { type: String, default: "in Progress" },
    file: { type: String, default: null },
    created: { type: String, default: indiaTime },
    updatedAt: { type: String, default: indiaTime },
})

export const userTicket = mongoose.model<any>('userTicket', userTicketSchema)