import mongoose from "mongoose";

let buyAT = new Date();
let options = { timeZone: 'Asia/Kolkata', hour12: false };
let indiaTime = buyAT.toLocaleString('en-US', options);
const arrayItemSchema = new mongoose.Schema({
    quantity: { type: Number, default: null },
    setAt: { type: Date, default: null },
    symbol: { type: String, default: null }
});

const tradeQuantitySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    sensex: { type: arrayItemSchema },
    finNifty: { type: arrayItemSchema },
    midcpNifty: { type: arrayItemSchema },
    nifty: { type: arrayItemSchema },
    banknifty: { type: arrayItemSchema }
});

export const tradeQuantity = mongoose.model<any>('TradeQuantity', tradeQuantitySchema);
