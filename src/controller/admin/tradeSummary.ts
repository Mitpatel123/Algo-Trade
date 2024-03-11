import { adminTrade, userModel, userTrade, tradeQuantity } from "../../database";
import { userProfitAndLossData } from "../../helpers/kiteConnect/index";
import { apiResponse } from "../../common";
import fund from "../../helpers/funding.json";
import { responseMessage } from "../../helpers/response";
import mongoose from "mongoose";
import { Request, Response } from 'express'
import bcrypt from "bcryptjs";
const ObjectId = mongoose.Types.ObjectId
let usTime = new Date()
let options = { timeZone: 'Asia/kolkata', hour12: false }
let indiaTime = usTime.toLocaleString('en-US', options)

export const get_user_quantity = async (req: Request, res: Response) => {
    const { filter, id } = req.body;
    console.log('👻👻', filter, id);

    try {
        let userData = null;

        if (filter === 0) {
            const data = await tradeQuantity.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_data"
                    }
                }
            ]);
            userData = data;
        } else if (filter === 1) {
            const user = await userModel.findById(id);
            if (!user) {
                return res.status(404).json(new apiResponse(404, "User not found", {}, {}));
            }
            const data = await tradeQuantity.aggregate([
                {
                    $match: { user_id: new ObjectId(id) }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_data"
                    }
                }
            ]);
            userData = data;
        } else {
            return res.status(400).json(new apiResponse(400, "Invalid filter value", {}, {}));
        }

        return res.status(200).json(new apiResponse(200, "User data fetched successfully", { userData }, {}));
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

//get trade data for admin

export const trade_get = async (req: Request, res: Response) => {
    let body = req.body;
    try {
        const alltrade = [];
        if (body.type === 0) { //admin

            const tradedata = await adminTrade.find({
                $or: [
                    { sellPrice: { $eq: null } },
                    { sellPrice: { $eq: false } },
                    { sellPrice: { $eq: 0 } }
                ],
                sellAT: { $eq: null }
            });
            return res.status(200).json(new apiResponse(200, "all trade data", { tradedata }, {}));
        }
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }

}

//get trade data for user

// export const user_trade_get = async (req: Request, res: Response) => {
//     let body = req.body;
//     try {
//         const alltrade = [];
//         if (body.type === 1 && body.id !== null) { //only user data 
//             const tradedata = await userTrade.find();
//             tradedata.forEach(data => {
//                 let e = data.trade
//                 for (data of e) {

//                     if (String(data.user_id) === String(body.id) && data.isSelled === false) {
//                         alltrade.push(e)
//                     }
//                 }

//             });
//         }

//         return res.status(200).json(new apiResponse(200, "all trades data", { alltrade }, {}));

//     } catch (error) {
//         return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
//     }

// }
export const user_trade_get = async (req: Request, res: Response) => {
    let body = req.body;
    try {
        let tradedata;
        if (body.type === 1 && body.id !== null) { //only user data 
            tradedata = await userTrade.aggregate([
                {
                    $unwind: "$trade"
                },
                {
                    $match: {
                        "trade.user_id": new ObjectId(body.id),
                        "trade.isSelled": false,
                    }
                },
            ]);
        }

        return res.status(200).json(new apiResponse(200, "all trades data", { tradedata }, {}));

    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }

}

export const profit_loss = async (req: Request, res: Response) => {
    let body = req.body;
    const customizedTime = usTime.toLocaleDateString('en-US', options);
    console.log(customizedTime);
    // try {
    //     //for single day
    //     if (body.type === 0) { // admin
    //         let money = 0;
    //         const buyTradeData = await userTrade.find({ tradeTime: customizedTime });

    //         if (buyTradeData) {
    //             buyTradeData.forEach((e) => {
    //                 e['trade'].forEach((data) => {
    //                     if (data.isSelled === true) {
    //                         money = money + data.profit;
    //                     }
    //                 })
    //             })
    //         }
    //         return res.status(200).json(new apiResponse(200, "data of profit and loss is", money, {}));
    //     }
    // } catch (error) {
    //     return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    // }
    try {
        //for single day
        if (body.type === 0) { // admin
            let money = 0;
            const buyTradeData = await userTrade.aggregate([
                {
                    $unwind: '$trade'
                },
                {
                    $match: {
                        "tradeTime": customizedTime,
                        "trade.isSelled": true
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalProfit: { $sum: '$trade.profit' },
                    }
                }
            ]);

            return res.status(200).json(new apiResponse(200, "data of profit and loss is", buyTradeData, {}));
        }
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

// API for calculate investment money

export const totalInverstment = async (req: Request, res: Response) => {
    // try {
    //     const tradedata = await userTrade.find();
    //     let invested = 0;
    //     let totalinvested = 0;

    //     if (tradedata) {
    //         tradedata.forEach((e) => {
    //             e['trade'].forEach((data) => {
    //                 if (data.isSelled === false) {
    //                     invested = invested + (data.buyKitePrice * data.quantity);
    //                 }
    //             })
    //             totalinvested = invested * (e.loatSize || 1)
    //             console.log(totalinvested)
    //         })
    //     }
    //     return res.status(200).json(new apiResponse(200, "data of total investment", { totalinvested }, {}));
    // } catch (error) {
    //     return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    // }
    try {
        const tradedata = await userTrade.aggregate([
            {
                $unwind: "$trade"
            },
            {
                $match: {
                    "trade.isSelled": false,
                }
            },
            {
                $group: {
                    _id: null,
                    totalInvested: {
                        $sum: {
                            $multiply: ["$trade.buyKitePrice", "$trade.quantity"]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalInvested: 1
                }
            }
        ]);

        return res.status(200).json(new apiResponse(200, "data of total investment", { tradedata }, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}
// API market value

export const marketValue = async (req: Request, res: Response) => {
    // try {
    //     const tradedata = await userTrade.find();
    //     const priceArray = tradedata.map((e) => {
    //         const filteredTrades = e['trade'].filter((data) => !data.isSelled);
    //         const totalQty = filteredTrades.reduce((sum, trade) => sum + trade.quantity, 0);
    //         return totalQty !== 0 ? { table: { tradeSymbol: filteredTrades[0].tradingsymbol, totalQty } } : null;
    //     }).filter(Boolean);

    //     return res.status(200).json(new apiResponse(200, "data of total investment", { priceArray }, {}));
    // } catch (error) {
    //     return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    // }
    try {
        const tradedata = await userTrade.aggregate([
            {
                $unwind: "$trade"
            },
            {
                $match: {
                    $or: [
                        { "trade.isSelled": null },
                        { "trade.isSelled": false },
                        { "trade.isSelled": undefined },
                        { "trade.isBuy": true },
                    ]
                }
            },
            {
                $group: {
                    _id: "$tradingsymbol",
                    totalQty: { $sum: "$trade.quantity" }
                }
            },
            {
                $match: {
                    totalQty: { $ne: 0 }
                }
            },
            {
                $project: {
                    _id: 0,
                    tradeSymbol: "$_id",
                    totalQty: "$totalQty"

                }
            }
        ]);

        return res.status(200).json(new apiResponse(200, "data of total investment", { tradedata }, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

//API of get kite login user details

// export const getKiteLoginUserDetails = async (req: Request, res: Response) => {
//     try {
//         let userdata:any = await userModel.find({ isDelete: false, isActive: true, isVerified: true, isKiteLogin: true });

//         if (userdata && userdata.length > 0) {
//             userdata.testing = "1"
//             const buyTradeData = await userTrade.find();
//             let promises = userdata.map(async e => {
//                 const profit = await userProfitAndLossData(req, res, e, buyTradeData);

//                 return profit
//             });

//             // Wait for all promises to be resolved
//             const updatedUserData = await Promise.all(promises);
//             console.log("😃😃😃😃😃😃😃😃",updatedUserData);

//             // Now updatedUserData contains the updated userData with the "profit" key
//             return res.status(200).json(new apiResponse(200, "login user data", updatedUserData, {}));
//         } else {
//             return res.status(200).json(new apiResponse(200, "Any user does not login", {}, {}));
//         }
//     } catch (error) {
//         return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
//     }

// }


export const getKiteLoginUserDetails = async (req: Request, res: Response) => {
    try {

        let returnData;
        let data;

        let userData = await userModel.find({}, { fullname: 1, email: 1, z_user_id: 1, plan: 1, phoneNumber: 1, isActive: 1 });
        console.log(userData);

        if (userData) {

            data = await userTrade.aggregate([
                {
                    $unwind: '$trade'
                },
                {
                    $group: {
                        _id: '$trade.user_id',
                        totalProfit: { $sum: '$trade.profit' },
                    }
                }
            ])
            returnData = data.map(data => {
                let user = userData.find(user => String(user._id) == data._id);


                return { user, data }
            });

            return res.status(200).json(new apiResponse(200, "login user data", returnData, {}));
        }

        return res.status(404).json(new apiResponse(402, "no any user login", {}, {}));

    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }

}

//API of unlinked user history details

export const getUnlinkUserHistory = async (req: Request, res: Response) => {
    try {
        // const body = req.body;
        // const userdata = await userModel.findById({ _id: body.id });
        // let responseData = [];

        // if (userdata) {
        //     const userTradeData = await userTrade.find();
        //     if (userTradeData) {
        //         userTradeData.forEach((e) => {
        //             e['trade'].forEach((data) => {

        //                 if (data.msg == "user not login" && String(data.user_id) === String(body.id) && !data.buyOrderId) {
        //                     if (data.buytradeStatus == "user not login") {
        //                         responseData.push({
        //                             date: e.tradeTime,
        //                             index: e.tradingsymbol,
        //                             transaction_type: "BUY",
        //                             reason: data.msg,
        //                             linkTime: data.lastLoginAt,
        //                             unlinkTime: data.lastLogOutAt,
        //                         })
        //                     } else {
        //                         responseData.push({
        //                             date: e.tradeTime,
        //                             index: e.tradingsymbol,
        //                             transaction_type: "SELL",
        //                             reason: data.msg
        //                         })
        //                     }
        //                 }
        //             })
        //         })
        //     }
        //     return res.status(200).json(new apiResponse(200, "unliked user data", responseData, {}))
        // } else {
        //     return res.status(402).json(new apiResponse(402, "User Not found", {}, {}));
        // }
        const body = req.body;
        const userdata = await userModel.findById({ _id: body.id });

        if (userdata) {
            const userTradeData = await userTrade.aggregate([
                {
                    $unwind: "$trade"
                },
                {
                    $match: {
                        "trade.msg": "user not login",
                        "trade.user_id": new ObjectId(body.id),
                        $or: [{
                            "trade.buyOrderId": undefined
                        }, {
                            "trade.buyOrderId": false
                        },
                        {
                            "trade.buyOrderId": null,
                        }]
                    }
                }, {
                    $project: {
                        _id: 0,
                        tradeTime: 1,
                        tradingsymbol: 1,
                        "trade.msg": 1,
                        "trade.lastLoginAt": 1,
                        "trade.lastLogOutAt": 1,
                        "trade.buytradeStatus": 1
                    }
                },
                {
                    $group: {
                        _id: null,
                        data: {
                            $push: {
                                date: "$tradeTime",
                                index: "$tradingsymbol",
                                transaction_type: {
                                    $cond: {
                                        if: { $eq: ["$trade.buytradeStatus", "user not login"] },
                                        then: "BUY",
                                        else: "SELL"
                                    }
                                },
                                reason: "$trade.msg",
                                linkTime: "$trade.lastLoginAt",
                                unlinkTime: "$trade.lastLogOutAt"
                            }
                        }
                    }
                }, {
                    $project: {
                        _id: 0,
                    }
                }
            ])
            return res.status(200).json(new apiResponse(200, "unliked user data", userTradeData, {}))
        } else {
            return res.status(402).json(new apiResponse(402, "User Not found", {}, {}));
        }
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

//API of get kite not login user details

export const getKiteNotLoginUserDetails = async (req: Request, res: Response) => {
    try {
        const userdata = await userModel.find({ isDelete: false, isActive: true, isVerified: true, isKiteLogin: false });

        if (userdata && userdata.length !== 0) {
            return res.status(200).json(new apiResponse(200, "unlinked user data", userdata, {}));
        } else if (userdata.length === 0) {
            return res.status(200).json(new apiResponse(200, "Any user Does not exist whose kite is unlinked", {}, {}));
        }
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

//API of update kite login user details and also include admin profile update

export const updateUserDetailsByAdmin = async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const userData = await userModel.findById({ _id: body.id });
        console.log(userData);
        let updateUserData;
        if (userData !== null) {

            if (userData.role === 0) { //admin

                if (body.usingPassword === false) {
                    updateUserData = await userModel.findOneAndUpdate({ _id: body.id }, { fullname: body.fullname, email: body.email, z_user_id: body.kiteid, usingPassword: false }, { new: true });
                } else if (body.usingPassword === true) {

                    if (body.password) {

                        const bcryptdPassword = await bcrypt.hash(body.password, 10);
                        if (body.kiteid) {

                            updateUserData = await userModel.findOneAndUpdate({ _id: body.id }, { fullname: body.fullname, email: body.email, z_user_id: body.kiteid, password: bcryptdPassword, usingPassword: true }, { new: true });
                        } else {
                            updateUserData = await userModel.findOneAndUpdate({ _id: body.id }, { fullname: body.fullname, email: body.email, password: bcryptdPassword, usingPassword: true }, { new: true });

                        }
                    } else {
                        return res.status(401).json(new apiResponse(401, "please set the password", updateUserData, {}));
                    }
                }
                if (updateUserData !== null && updateUserData.length !== 0) {
                    return res.status(200).json(new apiResponse(200, "user data update successful", updateUserData, {}));
                } else if (updateUserData === null) {
                    return res.status(404).json(new apiResponse(404, "user not found", {}, {}));
                }

            } else if (userData.role === 1) {

                if (body.block === "block" || body.block === "unblock") {
                    const userData = await userModel.find({ _id: body.id, isDelete: false, isActive: true, isVerified: true, isKiteLogin: true });

                    if (body.block === "block") {//means block user
                        if (userData) {
                            const updateUserData = await userModel.findOneAndUpdate({ _id: body.id, isDelete: false, isActive: true, isVerified: true, isKiteLogin: true }, { isActive: false }, { new: true });
                            return res.status(200).json(new apiResponse(200, "user block successful", updateUserData, {}));
                        }
                    } else if (body.block === "unblock") {
                        if (userData) {//means unblock user
                            const updateUserData = await userModel.findOneAndUpdate({ _id: body.id, isDelete: false, isActive: false, isVerified: true, isKiteLogin: true }, { isActive: true }, { new: true });
                            return res.status(200).json(new apiResponse(200, "user unblock successful", updateUserData, {}));
                        }
                    }
                }
                else {

                    updateUserData = await userModel.findOneAndUpdate({ _id: body.id, isKiteLogin: true }, { fullname: body.fullname, email: body.email, phoneNumber: body.phoneNumber, location: body.location }, { new: true });

                    if (updateUserData !== null) {
                        return res.status(200).json(new apiResponse(200, "user data update successful", updateUserData, {}));
                    } else if (updateUserData === null) {
                        return res.status(404).json(new apiResponse(404, "user not found", {}, {}));
                    }
                }
            }
        } else {
            return res.status(200).json(new apiResponse(200, "user not found", {}, {}));
        }
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

//API of block the user by the admin

export const blockUserByAdmin = async (req: Request, res: Response) => {
    try {
        const body = req.body;





    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

//API of trade history

// export const tradeHistory = async (req: Request, res: Response) => {
//     const body = req.body;
//     console.log('body :>> ', body, body.tradeTime === "", body.tradeTime !== "");
//     try {
//         const page = body.page || 1;
//         const pageSize = 3;
//         let tradeData;
//         let historyData = {};
//         let alltrade = {};
//         let getdata = {};
//         const skip = (page - 1) * pageSize;
//         if (body.tradeTime === null) {
//             tradeData = await userTrade.find().skip(skip).limit(pageSize);
//         } else if (body.tradeTime !== null) {
//             tradeData = await userTrade.find({ tradeTime: body.tradeTime }).skip(skip).limit(pageSize);
//         }
//         if (tradeData) {
//             for (const userData of tradeData) {
//                 historyData = await tradeHistoryFun(req, res, userData, historyData, alltrade);
//             }

//             console.log(tradeData);
//             const userTradeResults = Object.values(historyData);
//             getdata = userTradeResults.filter(result => result !== undefined);
//         }
//         return res.status(200).json(new apiResponse(200, "trade history", { getdata }, {}));
//     } catch (error) {
//         return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
//     }
// };


export const tradeHistory = async (req: Request, res: Response) => {
    const body = req.body;
    console.log('body :>> ', body, body.tradeTime === "", body.tradeTime !== "");
    try {
        const page = body.page || 1;
        const pageSize = 10;
        let returnData;
        let data;
        const skip = (page - 1) * pageSize;
        let userData = await userModel.find({}, { fullname: 1, email: 1, z_user_id: 1 });
        console.log(userData);
        if (body.tradeTime === null) {

            data = await userTrade.aggregate([
                {
                    $unwind: '$trade'
                },
                {
                    $group: {
                        _id: '$trade.user_id',
                        totalProfit: { $sum: '$trade.profit' },
                    }
                }, {
                    $skip: skip
                },
                {
                    $limit: pageSize
                }

            ])
            returnData = data.map(data => {
                let user = userData.find(user => String(user._id) == data._id);


                return { user, data }
            });

        } else if (body.tradeTime !== null) {
            data = await userTrade.aggregate([
                {
                    $unwind: '$trade'
                },
                {
                    $match: {
                        'tradeTime': body.tradeTime
                    }
                },
                {
                    $group: {
                        _id: '$trade.user_id',
                        totalProfit: { $sum: '$trade.profit' },
                    }
                }, {
                    $skip: skip
                },
                {
                    $limit: pageSize
                }
            ])
            returnData = data.map(data => {
                let user = userData.find(user => String(user._id) == data._id);
                return { user, data }
            });
        }
        return res.status(200).json(new apiResponse(200, "trade history", { returnData }, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};


//sub category history API

export const subtradeHistory = async (req: Request, res: Response) => {
    const body = req.body;
    // try {
    //     const alltrade = [];
    //     let tradeData;

    //     if (body.tradeTime === null) {
    //         tradeData = await userTrade.find();
    //     } else if (body.tradeTime !== null) {
    //         tradeData = await userTrade.find({ tradeTime: body.tradeTime });
    //         console.log('tradeData :>> ', tradeData);
    //     }

    //     for (const e of tradeData) {
    //         const userdata = e['trade'];
    //         console.log('userdata :>> ', userdata);

    //         for (const data of userdata) {
    //             console.log(data);
    //             if (data.user_id == body.id) {
    //                 console.log("data", data)
    //                 const id = data.user_id;
    //                 if (data.buyKitePrice !== 0 && data.isSelled === false) {
    //                     const findUserData: any = await userModel.findById({ _id: id });
    //                     if (findUserData) {
    //                         alltrade.push({
    //                             date: e.tradeTime,
    //                             StockName: data.tradingsymbol,
    //                             BuyPrice: data.buyKitePrice,
    //                             SellPrice: "-",
    //                             BuyStatus: data.buytradeStatus,
    //                             SellStatus: "-",
    //                             profit: "-"

    //                         });
    //                     }
    //                 }
    //                 else if (data.isSelled === true) {
    //                     const findUserData = await userModel.findById({ _id: id });
    //                     if (findUserData) {
    //                         alltrade.push({
    //                             date: e.tradeTime,
    //                             StockName: data.tradingsymbol,
    //                             BuyPrice: data.buyKitePrice,
    //                             SellPrice: data.sellKitePrice,
    //                             BuyStatus: data.buytradeStatus,
    //                             SellStatus: data.selltradeStatus,
    //                             profit: data.profit
    //                         });
    //                     }
    //                 }
    //             } []


    //         }
    //     }
    //     return res.status(200).json(new apiResponse(200, "trade history", { alltrade }, {}));
    // } catch (error) {
    //     return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    // }
    try {
        const alltrade = [];
        let tradeData;

        if (body.tradeTime === null) {
            tradeData = await userTrade.find();
        } else if (body.tradeTime !== null) {
            tradeData = await userTrade.find({ tradeTime: body.tradeTime });
            console.log('tradeData :>> ', tradeData);
        }


        const data = await userTrade.aggregate([
            { $unwind: "$trade" },
            {
                $match: {
                    $or: [
                        { "trade.tradeTime": body.tradeTime },
                        { "trade.tradeTime": { $exists: false } }
                    ],
                    "trade.user_id": new ObjectId(body.id)
                }
            },
            {
                $project: {
                    _id: 0,
                    tradeTime: 1,
                    tradingsymbol: 1,
                    "trade.buyKitePrice": 1,
                    "trade.sellKitePrice": 1,
                    "trade.selltradeStatus": 1,
                    "trade.buytradeStatus": 1,
                    "trade.profit": 1
                }
            },
            {
                $group: {
                    _id: null,
                    data: {
                        $push: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $ne: ["$trade.buyKitePrice", 0] },
                                        { $eq: ["$trade.isSelled", false] }
                                    ]
                                },
                                then: {
                                    date: "$tradeTime",
                                    StockName: "$tradingsymbol",
                                    BuyPrice: "$trade.buyKitePrice",
                                    SellPrice: "-",
                                    BuyStatus: "$trade.buytradeStatus",
                                    SellStatus: "-",
                                    profit: "-"
                                },
                                else: {
                                    date: "$tradeTime",
                                    StockName: "$tradingsymbol",
                                    BuyPrice: "$trade.buyKitePrice",
                                    SellPrice: "$trade.sellKitePrice",
                                    BuyStatus: "$trade.buytradeStatus",
                                    SellStatus: "$trade.selltradeStatus",
                                    profit: "$trade.profit"
                                }
                            }
                        }
                    }
                }
            }
        ]);

        //                 if (data.buyKitePrice !== 0 && data.isSelled === false) {
        //                     const findUserData: any = await userModel.findById({ _id: id });
        //                     if (findUserData) {
        //                         alltrade.push({
        //                             date: e.tradeTime,
        //                             StockName: data.tradingsymbol,
        //                             BuyPrice: data.buyKitePrice,
        //                             SellPrice: "-",
        //                             BuyStatus: data.buytradeStatus,
        //                             SellStatus: "-",
        //                             profit: "-"

        //                         });
        //                     }
        //                 }
        //                 else if (data.isSelled === true) {
        //                     const findUserData = await userModel.findById({ _id: id });
        //                     if (findUserData) {
        //                         alltrade.push({
        //                             date: e.tradeTime,
        //                             StockName: data.tradingsymbol,
        //                             BuyPrice: data.buyKitePrice,
        //                             SellPrice: data.sellKitePrice,
        //                             BuyStatus: data.buytradeStatus,
        //                             SellStatus: data.selltradeStatus,
        //                             profit: data.profit
        //                         });
        //                     }
        //                 }

        for (const e of tradeData) {
            const userdata = e['trade'];
            console.log('userdata :>> ', userdata);

            for (const data of userdata) {
                console.log(data);
                if (data.user_id == body.id) {
                    console.log("data", data)
                    const id = data.user_id;
                    if (data.buyKitePrice !== 0 && data.isSelled === false) {
                        const findUserData: any = await userModel.findById({ _id: id });
                        if (findUserData) {
                            alltrade.push({
                                date: e.tradeTime,
                                StockName: data.tradingsymbol,
                                BuyPrice: data.buyKitePrice,
                                SellPrice: "-",
                                BuyStatus: data.buytradeStatus,
                                SellStatus: "-",
                                profit: "-"

                            });
                        }
                    }
                    else if (data.isSelled === true) {
                        const findUserData = await userModel.findById({ _id: id });
                        if (findUserData) {
                            alltrade.push({
                                date: e.tradeTime,
                                StockName: data.tradingsymbol,
                                BuyPrice: data.buyKitePrice,
                                SellPrice: data.sellKitePrice,
                                BuyStatus: data.buytradeStatus,
                                SellStatus: data.selltradeStatus,
                                profit: data.profit
                            });
                        }
                    }
                } []


            }
        }
        return res.status(200).json(new apiResponse(200, "trade history", { alltrade }, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

export const test_1 = async (req: Request, res: Response) => {
    console.log('object :>>');
    try {
        const body = req.body;
        const userupdate = await userModel.findById(body.id);
        if (!userupdate) {
            return res.status(400).json(new apiResponse(400, "User not found", {}, {}));
        } else {
            const updatetoken = await userModel.findByIdAndUpdate(body.id, { request_token: body.requestToken, isKiteLogin: true, req_tok_time: indiaTime });
            console.log('indiaTime :>> ', indiaTime, updatetoken);
            return res.status(200).json(new apiResponse(200, "Token updated successfully", {}, {}));
        }
    } catch (error) {
        console.error("Error in test_1:", error);
        return res.status(500).json(new apiResponse(500, "Internal server error", {}, error));
    }
};

import crypto from 'crypto'
import bodyParser from "body-parser";


export const createSHA = async (req: Request, res: Response) => {
    const { apiKey, apiSecret, requestToken } = req.body;
    // kitelogin();

    if (!apiKey || !apiSecret || !requestToken) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Concatenate API key, request token, and API secret
    const data = apiKey + requestToken + apiSecret;

    // Create SHA-256 hash
    const checksum = crypto.createHash('sha256').update(data).digest('hex');

    return res.json({ checksum });
};




