import { KiteConnect } from "kiteconnect";
import config from "config";
import { userModel, connectHistory, LastConnectHistory } from "../../database";
import { apiResponse } from "../../common";
import { responseMessage } from "../../helpers/response";
import { kitelogin } from "../../helpers/kiteConnect/index";
import { encryptData } from "../../common/encryptDecrypt";
import mongoose, { Collection } from "mongoose";
import { Request, Response } from 'express'
import jwt from "jsonwebtoken";
import { checkPreferences } from "joi";
import bcrypt from "bcryptjs";
import { json } from "body-parser";
// const jsondata = data;
const ObjectId = mongoose.Types.ObjectId
// Create an instance of KiteConnect
const kite = new KiteConnect({
    api_key: config.get('api_key'),
});

export const getUser = async (req: Request, res: Response) => {
    try {
        let buyAT = new Date();
        let options = { timeZone: 'Asia/Kolkata', hour12: false };
        let indiaTime = buyAT.toLocaleString('en-US', options);
        const customizedTime = buyAT.toLocaleDateString('en-US', options);

        const body = req.body;
        const { data, accessToken } = await kitelogin(body.id);
        const userdata = await userModel.findOneAndUpdate({
            _id: body.id,
            isActive: true, isDelete: false, isVerified: true
        }, {
            $set: {
                access_key: accessToken,
                z_user_id: data.user_id,
                z_user_type: data.user_type,
                z_email: data.email,
                z_user_name: data.user_name,
                z_user_shortname: data.user_shortname,
                z_broker: data.broker,
                z_exchanges: data.exchanges,
                z_products: data.products,
                z_order_types: data.order_types,
                z_avatar_url: data.avatar_url,
                z_meta: data.meta,
                isKiteLogin: true
            }
        }, { new: true })


        const connectDetails = await connectHistory.find({ date: customizedTime })
        const lastConnectDetails = await LastConnectHistory.find({ user_id: body.id })
        if (connectDetails.length !== 0) {
            const connectData = await connectHistory.findOneAndUpdate(
                { date: customizedTime },
                {
                    $push: {
                        'details': {
                            user_id: new ObjectId(body.id),
                            loginAt: indiaTime
                        }
                    }
                },
                { new: true }
            );

        } else {
            const connectData = new connectHistory({
                date: customizedTime,
                details: {
                    user_id: new ObjectId(body.id),
                    loginAt: indiaTime
                }
            })
            await connectData.save();
        }
        if (lastConnectDetails.length !== 0) {
            await LastConnectHistory.findOneAndUpdate(
                { user_id: body.id },
                {
                    loginAt: indiaTime
                },
                { new: true }
            );
        } else {
            const lastConnectData = new LastConnectHistory(
                {
                    user_id: new ObjectId(body.id),
                    loginAt: indiaTime
                }
            );
            await lastConnectData.save();
        }
        return res.status(200).json(new apiResponse(200, "kite data added successfully", userdata, {}));

    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}


//logout from the kite connect

export const kitelogout = async (req: Request, res: Response) => {
    try {
        let buyAT = new Date();
        let options = { timeZone: 'Asia/Kolkata', hour12: false };
        let indiaTime = buyAT.toLocaleString('en-US', options);
        const customizedTime = buyAT.toLocaleDateString('en-US', options);
        const body = req.body;

        const userData = await userModel.findById({ _id: body.id });

        if (userData.isKiteLogin === true && userData.isActive === true && userData.isDelete === false && userData.isVerified === true) {
            const userData = await userModel.findByIdAndUpdate({ _id: body.id }, { isKiteLogin: false }, { new: true });

            const lastConnectDetails = await LastConnectHistory.find({ user_id: body.id })
            const connectDetails = await connectHistory.find({ date: customizedTime })
            if (connectDetails.length !== 0) {
                const connectData = await connectHistory.findOneAndUpdate(
                    { date: customizedTime },
                    {
                        $push: {
                            'details': {
                                user_id: new ObjectId(body.id),
                                logoutAt: indiaTime
                            }
                        }
                    },
                    { new: true }
                );
            } else {
                const connectData = new connectHistory({
                    date: customizedTime,
                    details: {
                        user_id: new ObjectId(body.id),
                        logoutAt: indiaTime
                    }
                })
            }

            if (lastConnectDetails.length !== 0) {
                await LastConnectHistory.findOneAndUpdate(
                    { user_id: new ObjectId(body.id) },
                    {
                        logoutAt: indiaTime,
                    },
                    { new: true }
                );
            } else {
                const lastConnectData = new LastConnectHistory(
                    {
                        user_id: new ObjectId(body.id),
                        logoutAt: indiaTime
                    }
                );
                await lastConnectData.save();
            }
            return res.status(200).json(new apiResponse(200, "kite logout is successfully", userData, {}));
        } else if (userData.isKiteLogin === false) {
            return res.status(200).json(new apiResponse(200, "you already logout from the kite", {}, {}));

        } else if (userData.isActive === false) {
            return res.status(200).json(new apiResponse(200, "you account does not active", {}, {}));

        } else if (userData.isDelete === false) {
            return res.status(200).json(new apiResponse(200, "account is deleted", {}, {}));

        } else if (userData.isVerified === false) {
            return res.status(200).json(new apiResponse(200, "user does not verified", {}, {}));
        }
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));

    }
}
// signup API
export const signUp = async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const isAlready: any = await userModel.findOne({
            phoneNumber: body.phoneNumber,
            isActive: true,
            isDelete: false
        });

        //if user already exist or verification process is incomplete
        if (isAlready && isAlready.isVerified === false) {
            let phoneNumber = body.phoneNumber
            let OTPcode: any = Math.floor(100000 + Math.random() * 900000);
            const encryptedCode = await encryptData(OTPcode)
            var OTP = OTPcode
            const bodyData = {
                ...body,
                otp: encryptedCode,
                otpExpire: new Date()
            };



            if (phoneNumber) {
                const updateuser = await userModel.findOneAndUpdate({ phoneNumber: phoneNumber, isVerified: false, isDelete: false, isActive: true }, { $set: bodyData })
                const userData = {

                    _id: updateuser._id,
                    phoneNumber: updateuser.phoneNumber,
                    otp: encryptedCode,
                    otpdcrypt: OTP
                }
                return res.status(200).json(new apiResponse(200, responseMessage.otpSend, userData, {}));
            } else {
                return res.status(400).json(new apiResponse(200, responseMessage.invalidPhone, {}, {}));
            }
        }

        //if user exist and it was verified so login it

        else if (isAlready && isAlready.isVerified === true && isAlready.email !== null && isAlready.fullname !== null) {

            if (isAlready.usingPassword === true && isAlready.role === 0) {
                if (isAlready.password !== null) {

                    if (body.password) {
                        const checkPassword = await bcrypt.compare(body.password, isAlready.password);
                        if (checkPassword === true && isAlready.role === 0)//mean that admin
                        {
                            const payload = {
                                _id: isAlready._id,
                                status: "Login",
                                generatedOn: new Date().getTime()
                            }

                            const token = await jwt.sign(payload, config.get('jwt_token_secret'));
                            const refresh_token = await jwt.sign({
                                _id: isAlready._id,
                                generateOn: new Date().getTime()

                            }, config.get('jwt_token_secret'));

                            let responsedata = await userModel.findOne({ phoneNumber: body.phoneNumber, isActive: true, isDelete: false, isVerified: true }).select("_id phoneNumber isVerified isActive isDelete createdAt updatedAt");

                            let responseresult = { data: responsedata, token, refresh_token }

                            return res.status(200).json(new apiResponse(200, responseMessage.loginSuccess, responseresult, {}));
                        } else if (checkPassword === false) {
                            return res.status(200).json(new apiResponse(401, responseMessage.invalidUserPasswordEmail, {}, {}));
                        }

                    } else {
                        return res.status(401).json(new apiResponse(401, "password required", {}, {}));
                    }
                } else {
                    return res.status(401).json(new apiResponse(401, "you does not set password at the time of profile updation", {}, {}));
                }
            } else if (isAlready.usingPassword === false || isAlready.role === 1 || isAlready.usingPassword === null) {

                let OTPCode: any = Math.floor(100000 + Math.random() * 900000);

                const encryptedCode = await encryptData(OTPCode)
                const bodyData = {
                    ...body,
                    otp: encryptedCode,
                    otpExpire: new Date()
                };
                const updateuser = await userModel.findOneAndUpdate({ phoneNumber: body.phoneNumber, isVerified: true, isDelete: false, isActive: true }, { $set: bodyData })
                const userDetail = {
                    _id: updateuser._id,
                    phoneNumber: updateuser.phoneNumber,
                    otp: encryptedCode,
                    otpdcrypt: OTPCode
                };

                return res.status(200).json(new apiResponse(200, responseMessage.otpSend, userDetail, {}));
            }


        }

        else if (isAlready && isAlready.isVerified === true && isAlready.email === null && isAlready.fullname === null) {
            let OTPCode: any = Math.floor(100000 + Math.random() * 900000);

            const encryptedCode = await encryptData(OTPCode)
            const bodyData = {
                ...body,
                otp: encryptedCode,
                otpExpire: new Date()
            };

            const updateuser = await userModel.findOneAndUpdate({ phoneNumber: body.phoneNumber, isVerified: true, isDelete: false, isActive: true }, { $set: bodyData })
            const userDetail = {
                _id: updateuser._id,
                phoneNumber: updateuser.phoneNumber,
                otp: encryptedCode,
                otpdcrypt: OTPCode
            };
            return res.status(200).json(new apiResponse(200, responseMessage.otpSend, userDetail, {}));
            // return res.status(200).json(new apiResponse(200, "registration is incomplete", ["rendedr to registration page", isAlready._id], {}));
        }
        //if user create account first time
        else if (!isAlready) {
            let phone = body.phoneNumber
            let role = body.role
            // let ownerEmail = body.ownerEmail

            // const newuser = new userModel({
            //     phoneNumber: phone
            // })
            let OTPCode: any = Math.floor(100000 + Math.random() * 900000);

            const encryptedCode = await encryptData(OTPCode)
            const bodyData = {
                phoneNumber: phone,
                role: role,
                otp: encryptedCode,
                otpExpire: new Date()
            };

            await new userModel(bodyData).save().then(async (data) => {
                // Return user data in the response
                const userDetail = {
                    _id: data._id,
                    phoneNumber: data.phoneNumber,
                    otp: encryptedCode,
                    otpdcrypt: OTPCode
                };
                return res.status(200).json(new apiResponse(200, responseMessage.otpSend, userDetail, {}));
            });

        }
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
};

//OTP verification

export const OtpVerification = async (req: Request, res: Response) => {
    var body = req.body
    let buyAT = new Date();
    let options = { timeZone: 'Asia/Kolkata', hour12: false };
    let indiaTime = buyAT.toLocaleString('en-US', options);
    try {
        let otp = body.otp
        let encodeotp = encryptData(otp)

        let response: any = await userModel.findOne({ phoneNumber: body.phoneNumber, isActive: true, isDelete: false })
        if (!response || response === null) {
            return res.status(200).json(new apiResponse(200, responseMessage.invalidCraditional, { code: -1 }, {}));
        }

        //register otp verification
        if (response.isVerified === false) {
            let data: any = await userModel.findOne({ phoneNumber: body.phoneNumber, otp: encodeotp, isActive: true, isDelete: false })
            if (data) {
                let difference = new Date(indiaTime).getTime() - new Date(data.otpExpire).getTime();
                if (difference <= 60000) {
                    if (data.otp === encodeotp) {
                        let updatedata = {
                            isVerified: true, otp: null
                        }
                        let response = await userModel.findOneAndUpdate({ phoneNumber: body.phoneNumber, isActive: true, isDelete: false }, updatedata);
                        let responsedata = await userModel.findOne({ phoneNumber: body.phoneNumber, isActive: true, isDelete: false }).select("_id phoneNumber isVerified isActive isDelete createdAt updatedAt");
                        return res.status(200).json(new apiResponse(200, "render to registration form", { user_id: response._id, code: 1 }, {}));

                    } else {
                        return res.status(200).json(new apiResponse(200, responseMessage.invalidOTP, { code: -1 }, {}))
                    }
                } else {
                    return res.status(200).json(new apiResponse(200, responseMessage.expireOTP, { code: -1 }, {}))
                }

            } else {
                return res.status(200).json(new apiResponse(200, responseMessage.invalidOTP, { code: -1 }, {}))
            }

        } else if (response.isVerified === true && response.fullname === null && response.email === null) {
            //render to registration form
            let data: any = await userModel.findOne({ phoneNumber: body.phoneNumber, otp: encodeotp, isActive: true, isDelete: false, isVerified: true })
            if (data === null) {
                return res.status(200).json(new apiResponse(200, responseMessage.invalidOTP, { code: -1 }, {}))
            }
            else if (data.otp !== null) {
                let difference = new Date(indiaTime).getTime() - new Date(data.otpExpire).getTime();
                if (difference <= 60000) {
                    if (data.otp === encodeotp) {

                        let updatedata = {
                            otp: null
                        }
                        let response = await userModel.findOneAndUpdate({ phoneNumber: body.phoneNumber, isActive: true, isDelete: false, isVerified: true }, updatedata);

                        return res.status(200).json(new apiResponse(200, "registration is incomplete", ["rendedr to registration page", response._id], { code: 1 }));

                    } else {
                        return res.status(200).json(new apiResponse(200, responseMessage.invalidOTP, { code: -1 }, {}))
                    }
                } else {
                    return res.status(200).json(new apiResponse(200, responseMessage.expireOTP, { code: -1 }, {}))
                }
            }
        }

        else if (response.isVerified === true) {//login otp verification
            let data: any = await userModel.findOne({ phoneNumber: body.phoneNumber, otp: encodeotp, isActive: true, isDelete: false, isVerified: true })
            if (data) {

                let difference = new Date(indiaTime).getTime() - new Date(data.otpExpire).getTime();

                if (difference <= 60000) {
                    if (data.otp === encodeotp) {

                        const payload = {
                            _id: data._id,
                            status: "Login",
                            generatedOn: new Date().getTime()
                        }

                        const token = await jwt.sign(payload, config.get('jwt_token_secret'));
                        const refresh_token = await jwt.sign({
                            _id: data._id,
                            generateOn: new Date().getTime()

                        }, config.get('jwt_token_secret'));


                        let updatedata = {
                            otp: null
                        }
                        let response = await userModel.findOneAndUpdate({ phoneNumber: body.phoneNumber, isActive: true, isDelete: false, isVerified: true }, updatedata);
                        let responsedata = await userModel.findOne({ phoneNumber: body.phoneNumber, isActive: true, isDelete: false, isVerified: true }).select("_id phoneNumber isVerified isActive isDelete createdAt updatedAt");

                        
                        let responseresult = {  responsedata, token, refresh_token,  }

                        return res.status(200).json(new apiResponse(200, responseMessage.loginSuccess , { responsedata, token, refresh_token}, {}));

                    } else {
                        return res.status(200).json(new apiResponse(200, responseMessage.invalidOTP, {code: -1 }, {}))
                    }
                } else {
                    return res.status(200).json(new apiResponse(200, responseMessage.expireOTP, {code: -1 }, {}))
                }

            } else {
                return res.status(200).json(new apiResponse(200, responseMessage.invalidOTP, {code: -1 }, {}))
            }
        }
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error))
    }
}


//update user

export const updateUser = async (req: Request, res: Response) => {
    try {
        const body = req.body;

        const data = await userModel.findOne({ _id: body.id, isActive: true, isVerified: true, isDelete: false });
        if (data) {
            const updateuser = await userModel.findByIdAndUpdate({ _id: body.id, isActive: true, isVerified: true, isDeleted: false }, { $set: body }, { new: true });
            return res.status(200).json(new apiResponse(200, responseMessage.signupSuccess, updateuser, {}))
        } else {
            return res.status(401).json(new apiResponse(401, responseMessage.invalidCraditional, {}, {}))
        }

    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error))
    }
}

//delete user

export const deleteuser = async (req: Request, res: Response) => {
    try {
        let id: any = req.query.id;
        const response = await userModel.findOne({ _id: new ObjectId(id), isActive: true, isDelete: false });

        if (response) {
            const deleteUser = await userModel.findByIdAndUpdate({ _id: new ObjectId(id), isActive: true, isDelete: false }, { $set: { isDelete: true } })

            return res.status(200).json(new apiResponse(200, responseMessage.deleteDataSuccess("user"), {}, {}))
        } else {
            return res.status(400).json(new apiResponse(400, responseMessage.invalidId('user'), {}, {}))
        }
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, error));
    }
}


