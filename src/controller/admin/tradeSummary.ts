import { KiteConnect } from "kiteconnect";
import config from "config";
import { adminTrade, userModel, userTrade, tradeQuantity } from "../../database";
import { apiResponse } from "../../common";
import data from "../../helpers/userdata.json";
import fund from "../../helpers/funding.json";
import { responseMessage } from "../../helpers/response";
import { stockQuantity } from "../../helpers/testing";
import { encryptData } from "../../common/encryptDecrypt";
import mongoose from "mongoose";
import { Request, Response } from 'express'
import jwt from "jsonwebtoken";
import { builtinModules, findSourceMap } from "module";
import { sendEmailHelper } from "../../helpers";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
const jsondata = data;
const funddata = fund;
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
            const tradedata = await adminTrade.find();
            tradedata.forEach(data => {
                if ((data.sellPrice === null || data.sellPrice === 0) && data.sellAT === null) {
                    alltrade.push(data);
                }
            });
        }

        return res.status(200).json(new apiResponse(200, "all trade data", { alltrade }, {}));

    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }

}

//get trade data for user

export const user_trade_get = async (req: Request, res: Response) => {
    let body = req.body;
    try {
        const alltrade = [];
        if (body.type === 1 && body.id !== null) { //user
            const tradedata = await userTrade.find();
            tradedata.forEach(data => {
                let e = data.trade
                for (data of e) {

                    if (String(data.user_id) === String(body.id) && data.isSelled === false) {
                        alltrade.push(e)
                    }
                }

            });
        }

        return res.status(200).json(new apiResponse(200, "all trades data", { alltrade }, {}));

    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }

}

export const profit_loss = async (req: Request, res: Response) => {
    let body = req.body;
    const customizedTime = usTime.toLocaleDateString('en-US', options);

    try {
        //for single day
        if (body.type === 0) { // admin
            let money = 0;
            const buyTradeData = await userTrade.find({ tradeTime: customizedTime });

            if (buyTradeData) {
                buyTradeData.forEach((e) => {
                    e['trade'].forEach((data) => {
                        if (data.isSelled === true) {
                            money = money + data.profit;
                        }
                    })
                })
            }
            return res.status(200).json(new apiResponse(200, "data of profit and loss is", money, {}));
        }
        // else if (body.type === 1) {
        //     let invested = 0;
        //     let totalinvested = 0;
        //     let money = 0;
        //     const buyTradeData = await userTrade.find();

        //     if (buyTradeData) {
        //         buyTradeData.forEach((e) => {
        //             e['trade'].forEach((data) => {
        //                 if (data.isSelled === true) {
        //                     money = money + data.profit;
        //                     invested = invested + (data.buyKitePrice * data.quantity);
        //                 }
        //             })
        //             console.log(invested)
        //             totalinvested = invested * e.loatSize
        //         })
        //     }

        //     console.log(totalinvested);
        //     const calculation = (money / totalinvested) * 100;
        //     return res.status(200).json(new apiResponse(200, "data of profit and loss is", { money, calculation }, {}));
        // }
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

// API for calculate investment money

export const totalInverstment = async (req: Request, res: Response) => {
    try {
        const tradedata = await userTrade.find();
        let invested = 0;
        let totalinvested = 0;

        if (tradedata) {
            tradedata.forEach((e) => {
                e['trade'].forEach((data) => {
                    if (data.isSelled === false) {
                        invested = invested + (data.buyKitePrice * data.quantity);
                    }
                })
                console.log(invested)
                totalinvested = invested * e.loatSize
            })
        }
        return res.status(200).json(new apiResponse(200, "data of total investment", { totalinvested }, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}
// API market value

export const marketValue = async (req: Request, res: Response) => {
    try {
        const tradedata = await userTrade.find();
        const priceArray = tradedata.map((e) => {
            const filteredTrades = e['trade'].filter((data) => !data.isSelled);
            const totalQty = filteredTrades.reduce((sum, trade) => sum + trade.quantity, 0);
            return totalQty !== 0 ? { table: { tradeSymbol: filteredTrades[0].tradingsymbol, totalQty } } : null;
        }).filter(Boolean);

        return res.status(200).json(new apiResponse(200, "data of total investment", { priceArray }, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

//API of get kite login user details

export const getKiteLoginUserDetails = async (req: Request, res: Response) => {
    try {
        const userdata = await userModel.find({ isDelete: false, isActive: true, isVerified: true, isKiteLogin: true });

        if (userdata) {
            return res.status(200).json(new apiResponse(200, "login user data", userdata, {}));
        } else {
            return res.status(200).json(new apiResponse(200, "Any user does not login", {}, {}));
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
        var updateUserData;
        if (userData.role === 0) { //admin

            if (body.usingPassword === false) {

                updateUserData = await userModel.findOneAndUpdate({ _id: body.id }, { fullname: body.fullname, email: body.email, z_user_id: body.kiteid, usingPassword: false }, { new: true });
            } else if (body.usingPassword === true) {
                if (body.password) {

                    const bcryptdPassword = await bcrypt.hash(body.password, 10);

                    updateUserData = await userModel.findOneAndUpdate({ _id: body.id }, { fullname: body.fullname, email: body.email, z_user_id: body.kiteid, password: bcryptdPassword, usingPassword: true }, { new: true });
                } else {
                    return res.status(401).json(new apiResponse(401, "please set the password", updateUserData, {}));
                }
            }
            if (updateUserData !== null) {
                return res.status(200).json(new apiResponse(200, "user data update successful", updateUserData, {}));
            } else if (updateUserData === null) {
                return res.status(404).json(new apiResponse(404, "user not found", updateUserData, {}));
            }

        } else if (userData.role === 1) {

            updateUserData = await userModel.findOneAndUpdate({ _id: body.id, isKiteLogin: true }, { fullname: body.fullname, email: body.email, phoneNumber: body.phoneNumber, location: body.location }, { new: true });

            if (updateUserData !== null) {
                return res.status(200).json(new apiResponse(200, "user data update successful", updateUserData, {}));
            } else if (updateUserData === null) {
                return res.status(404).json(new apiResponse(404, "user not found", updateUserData, {}));
            }
        }
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

//API of block the user by the admin

export const blockUserByAdmin = async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const userData = await userModel.find({ _id: body.id, isDelete: false, isActive: true, isVerified: true, isKiteLogin: true });

        if (body.key === 0) {//means block user
            if (userData) {
                const updateUserData = await userModel.findOneAndUpdate({ _id: body.id, isDelete: false, isActive: true, isVerified: true, isKiteLogin: true }, { isActive: false }, { new: true });
                return res.status(200).json(new apiResponse(200, "user block successful", userData, {}));
            }
        } else if (body.key === 1) {
            if (userData) {//means unblock user
                const updateUserData = await userModel.findOneAndUpdate({ _id: body.id, isDelete: false, isActive: false, isVerified: true, isKiteLogin: true }, { isActive: true }, { new: true });
                return res.status(200).json(new apiResponse(200, "user unblock successful", userData, {}));
            }
        }


    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}

//API of trade history

// Import mongoose for ObjectId type

export const tradeHistory = async (req: Request, res: Response) => {
    const body = req.body;
    try {
        var alltrade = {};
        var tradeData;
        if (body.tradeTime === null) {
            tradeData = await userTrade.find();
        } else if (body.tradeTime !== null) {
            tradeData = await userTrade.find({ tradeTime: body.tradeTime });
        }
        const historyData = {};
        if (tradeData) {
            for (let i = 0; i < tradeData.length; i++) {
                const e = tradeData[i];
                for (let j = 0; j < e['trade'].length; j++) {
                    const data = e['trade'][j];
                    console.log(i, ":", data);
                    if (data.isSelled === true) {
                        const key = `${e.tradeTime}_${data.user_id}`;
                        const userData = await userModel.findById(data.user_id);
                        if (Object.keys(alltrade).length !== 0 && alltrade[key]) {
                            alltrade[key] += data.profit;
                            historyData[data.user_id] = {
                                fullname: userData.fullname,
                                email: userData.email,
                                phoneNumber: userData.phoneNumber,
                                z_user_id: userData.z_user_id,
                                date: e.tradeTime,
                                profit: (historyData[data.user_id]?.profit || 0) + data.profit,
                            };
                        } else {
                            alltrade[key] = data.profit;
                            historyData[data.user_id] = {
                                fullname: userData.fullname,
                                email: userData.email,
                                phoneNumber: userData.phoneNumber,
                                z_user_id: userData.z_user_id,
                                date: e.tradeTime,
                                profit: data.profit,
                            };
                        }
                    }
                }
            }
        }

        return res.status(200).json(new apiResponse(200, "trade history", { historyData }, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};



// Helper function to calculate profit for a given trade entry









// export const tradeHistory = async (req: Request, res: Response) => {
//     const body = req.body;
//     try {
//         const alltrade = [];
//         var tradeData;

//         if (body.tradeTime === null) {
//             tradeData = await userTrade.find();
//         } else if (body.tradeTime !== null) {
//             tradeData = await userTrade.find({ tradeTime: body.tradeTime });
//         }

//         let invested = 0;
//         let totalinvested = 0;
//         let money = 0;


//         tradeData.forEach((e) => {
//             e['trade'].forEach((data) => {
//                 if (data.isSelled === true) {
//                     money = money + data.profit;
//                     invested = invested + (data.buyKitePrice * data.quantity);
//                 }
//             })
//             console.log(invested)
//             totalinvested = invested * e.loatSize
//         })

//         console.log(totalinvested);
//         var calculation = (money / totalinvested) * 100;


//         for (const e of tradeData) {
//             const userdata = e['trade'];

//             for (const data of userdata) {

//                 const id = data.user_id;
//                 if (data.buyKitePrice !== 0) {
//                     const findUserData: any = await userModel.findById({ _id: id });
//                     if (findUserData) {
//                         alltrade.push({
//                             fullname: findUserData.fullname,
//                             email: findUserData.email,
//                             phoneNumber: findUserData.phoneNumber,
//                             z_user_id: findUserData.z_user_id,
//                             date: e.tradeTime,
//                             profit: "-"
//                         });
//                     }
//                 }
//                 if (data.sellKitePrice !== null && data.sellKitePrice !== 0) {
//                     const findUserData = await userModel.findById({ _id: id });
//                     if (findUserData) {
//                         alltrade.push({
//                             fullname: findUserData.fullname,
//                             email: findUserData.email,
//                             phoneNumber: findUserData.phoneNumber,
//                             z_user_id: findUserData.z_user_id,
//                             date: e.tradeTime,
//                             profit: calculation
//                         });
//                     }
//                 }
//             }
//         }
//         return res.status(200).json(new apiResponse(200, "trade history", { alltrade }, {}));
//     } catch (error) {
//         return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
//     }
// }

