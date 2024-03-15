import { adminTrade, userModel, userTrade, tradeQuantity, LastConnectHistory, } from "../../database";
import fund from "../../helpers/funding.json";
import { buy, getOrderTrades, sell, stockQuantity } from "../../helpers/index";
import { getFundsAndMargins } from "../../helpers/kiteConnect/index";
import mongoose from "mongoose";
import { Request, Response } from "express";
import { kitelogin } from "../test2";
import { privateEncrypt } from "crypto";

const funddata = fund;
const ObjectId = mongoose.Types.ObjectId;
let usTime = new Date();
let options = { timeZone: "Asia/kolkata", hour12: false };
let indiaTime = usTime.toLocaleString("en-US", options);
function generateRandomNumber() {
  return Math.floor(10000 + Math.random() * 90000);
}

export const buyTradeFunction = async (req: Request, res: Response, userData: any, body: any, resultAdminTradeEnter: any, quantityObj: any) => {
  try {
    let returnObj;
    const fundObj = await getFundsAndMargins(
      userData.access_key,
      "equity"
    ).catch((error) => {
      console.error("Error in getFundsAndMargins:", error);
      throw error;
    });

    const { _id: id, access_key, isKiteLogin } = userData;
    const lastConnectionDetails = await LastConnectHistory.findOne({ user_id: userData._id });
    if (quantityObj) {
      const quantity = quantityObj.quantity;
      if (access_key && isKiteLogin === true) {
        if (body.order_type === "MARKET") {
          const ex = 1; // Example: change this to retrieve live price function
          const price = (quantity * ex).toFixed(11);
          const fund = Number(fundObj["equity"].net.toFixed(11));
          let buyResponse;

          if (Number(price) <= fund) {
            
            const data: any = {
              access_key: userData.access_key,
              id: id,
              tradingsymbol: body.tradingsymbol,
              quantity: quantity,
              exchange: body.exchange,
              order_type: body.order_type,
              product: body.product,
            };
            buyResponse = await buy(data);
            const alluserdata = await userModel.findOneAndUpdate(
              {
                _id: userData._id,
                isActive: true,
                isDelete: false,
                isVerified: true,
              },
              {
                $inc: {
                  totalUsePlan: +1,
                },
              },
              { new: true }
            );

            const tradeData = await getOrderTrades(
              userData.access_key,
              buyResponse.order_id
            );
            await adminTrade.findByIdAndUpdate(
              { _id: resultAdminTradeEnter._id },
              { price: tradeData[0]["average_price"] }
            );
            returnObj = {
              user_id: new ObjectId(userData._id),
              tradingsymbol: body.tradingsymbol,
              buyOrderId: buyResponse.order_id,
              quantity,
              isSelled: false,
              buyKitePrice: tradeData[0]["average_price"],
              buyAT: indiaTime,
              accessToken: access_key,
              lessQuantity: false,
              buytradeStatus: buyResponse.status,
              lastLoginAt: lastConnectionDetails.loginAt,
              lastLogOutAt: lastConnectionDetails.logoutAt,
            };
          } else {
            const updatedQuantity = stockQuantity(quantity, fund, Number(ex));

            if (updatedQuantity > 0) {
              const data: any = {
                access_key: userData.access_key,
                id: id,
                tradingsymbol: body.tradingsymbol,
                quantity: updatedQuantity,
                exchange: body.exchange,
                order_type: body.order_type,
                product: body.product,
              };

              const buyData = await buy(data);
              const alluserdata = await userModel.findOneAndUpdate(
                {
                  _id: userData._id,
                  isActive: true,
                  isDelete: false,
                  isVerified: true,
                },
                {
                  $inc: {
                    totalUsePlan: +1,
                  },
                },
                { new: true }
              );
              const tradeData = getOrderTrades(
                userData.access_key,
                buyResponse.order_id
              );
              returnObj = {
                user_id: new ObjectId(userData._id),
                tradingsymbol: body.tradingsymbol,
                buyOrderId: buyData.order_id,
                quantity: updatedQuantity,
                isSelled: false,
                buyKitePrice: tradeData[0]['average_price'],
                buyAT: indiaTime,
                accessToken: access_key,
                lessQuantity: true,
                buytradeStatus: buyData.status,
                lastLoginAt: lastConnectionDetails.loginAt,
                lastLogOutAt: lastConnectionDetails.logoutAt,
              };
            } else {
              returnObj = {
                user_id: new ObjectId(id),
                trade_id: new ObjectId(resultAdminTradeEnter._id),
                msg: "Insufficient balance",
                accessToken: access_key,
              };
            }
          }

        } else {
          const price = (quantity * body.price).toFixed(11);
          const fund = Number(fundObj["equity"].net.toFixed(11));
          if (Number(price) <= fund) {
            const data: any = {
              access_key: userData.access_key,
              id: id,
              tradingsymbol: body.tradingsymbol,
              quantity: quantity,
              exchange: body.exchange,
              order_type: body.order_type,
              product: body.product,
              price: body.price,
            };

            const buyData = await buy(data);
            const alluserdata = await userModel.findOneAndUpdate(
              {
                _id: userData._id,
                isActive: true,
                isDelete: false,
                isVerified: true,
              },
              {
                $inc: {
                  totalUsePlan: +1,
                },
              },
              { new: true }
            );
            returnObj = {
              user_id: new ObjectId(userData._id),
              tradingsymbol: body.tradingsymbol,
              buyOrderId: buyData.order_id,
              // buyOrderId: generateRandomNumber(),
              quantity,
              isSelled: false,
              buyKitePrice: body.price,
              buyAT: indiaTime,
              accessToken: access_key,
              lessQuantity: false,
              buytradeStatus: buyData.status,
              lastLoginAt: lastConnectionDetails.loginAt,
              lastLogOutAt: lastConnectionDetails.logoutAt,
            };
          } else {
            const updatedQuantity = stockQuantity(
              quantity,
              fund,
              Number(price)
            );

            if (updatedQuantity > 0) {
              const data: any = {
                access_key: userData.access_key,
                id: id,
                tradingsymbol: body.tradingsymbol,
                quantity: updatedQuantity,
                exchange: body.exchange,
                order_type: body.order_type,
                product: body.product,
              };

              const buyData = await buy(data);
              const alluserdata = await userModel.findOneAndUpdate(
                {
                  _id: userData._id,
                  isActive: true,
                  isDelete: false,
                  isVerified: true,
                },
                {
                  $inc: {
                    totalUsePlan: +1,
                  },
                },
                { new: true }
              );
              returnObj = {
                user_id: new ObjectId(userData._id),
                tradingsymbol: body.tradingsymbol,
                buyOrderId: buyData.order_id,
                quantity: updatedQuantity,
                isSelled: false,
                buyKitePrice: body.price,
                buyAT: indiaTime,
                accessToken: access_key,
                lessQuantity: true,
                buytradeStatus: buyData.status,
                lastLoginAt: lastConnectionDetails.loginAt,
                lastLogOutAt: lastConnectionDetails.logoutAt,
              };
            } else {
              returnObj = {
                user_id: new ObjectId(id),
                trade_id: new ObjectId(resultAdminTradeEnter._id),
                msg: "Insufficient balance",
                accessToken: access_key,
              };
            }
          }
        }

      } else if (access_key === null || isKiteLogin === false) {
        returnObj = {
          user_id: new ObjectId(id),
          trade_id: new ObjectId(resultAdminTradeEnter._id),
          buytradeStatus: "user not login",
          msg: "user not login",
          buyAt: indiaTime,
          lastLoginAt: lastConnectionDetails.loginAt,
          lastLogOutAt: lastConnectionDetails.logoutAt,
        };
      }
    } else {
      returnObj = {
        user_id: new ObjectId(id),
        trade_id: new ObjectId(resultAdminTradeEnter._id),
        msg: "user does not set quantity of trade",
        buytradeStatus: "user does not set quantity of trade",
        accessToken: access_key,
        lastLoginAt: lastConnectionDetails.loginAt,
        lastLogOutAt: lastConnectionDetails.logoutAt,
      };
    }
    return returnObj;
  } catch (error) {
    return error;
  }
}

export const sellTradeFunction = async (req: Request, res: Response, userdata, body) => {
  try {
    let obj;
    const buyTradeData = await userTrade.findOne({ trade_id: body.id });
    if (buyTradeData && String(buyTradeData.trade_id) === String(body.id)) {
      const id = userdata._id;
      const lastConnectionDetails = await LastConnectHistory.findOne({ user_id: id });
      if (body.order_type === "MARKET") {

        for (const sellData of buyTradeData.trade) {
          if (userdata.isKiteLogin === true) {
            if (String(sellData.user_id) === String(id) && !sellData.isSelled && sellData.quantity > 0 && sellData.quantity !== 0 && sellData.tradingsymbol === body.tradingsymbol) {
              const sellrequireddata: any = {
                access_key: sellData.accessToken,
                tradingsymbol: body.tradingsymbol,
                quantity: sellData.quantity,
                exchange: body.exchange,
                order_type: body.order_type,
                product: body.product,
              };

              const returnSellData = await sell(sellrequireddata);
              const tradeData = await getOrderTrades(
                userdata.access_key,
                returnSellData.order_id
              );

              const order_id = sellData.buyOrderId;

              // const profit = Number(sellData.quantity) * Number(tradeData[0]["average_price"]) * Number(buyTradeData.loatSize) - Number(sellData.quantity) * Number(sellData.buyKitePrice) * Number(buyTradeData.loatSize);
              const profit = Number(sellData.quantity) * Number(tradeData[0]["average_price"]) * 1 - Number(sellData.quantity) * Number(sellData.buyKitePrice) * 1;

              await userTrade.updateOne(
                { "trade.user_id": new ObjectId(id), "trade.buyOrderId": order_id },
                {
                  $set: {
                    "trade.$.isSelled": true,
                    "trade.$.sellAt": indiaTime,
                    "trade.$.sellOrderId": returnSellData.order_id,
                    "trade.$.sellKitePrice": tradeData[0]["average_price"],
                    "trade.$.profit": profit,
                    "trade.$.selltradeStatus": returnSellData.status,
                    "trade.$.lastLoginAt": lastConnectionDetails.loginAt,
                    "trade.$.lastLogOutAt": lastConnectionDetails.logoutAt,
                  },
                }
              );
              await adminTrade.findOneAndUpdate({ _id: id }, { $set: { sellPrice: tradeData[0]["average_price"], sellAT: indiaTime, sellOrderId: returnSellData.order_id } });
              const data = await userTrade.findOne({
                "trade.user_id": id,
                "trade.buyOrderId": order_id,
              });
              for (const tradeData of data.trade) {
                if (String(tradeData.user_id) === String(id)) {
                  return (obj = tradeData);
                }
              }
            }
          } else {
            await userTrade.updateOne(
              { "trade.user_id": id, "trade.buyOrderId": sellData.buyOrderId },
              {
                $set: {
                  "trade.$.selltradeStatus": "user not login",
                  "trade.$.sellAt": indiaTime,
                  "trade.$.lastLoginAt": lastConnectionDetails.loginAt,
                  "trade.$.lastLogOutAt": lastConnectionDetails.logoutAt,
                },
              }
            );
          }
        }
      }
      else {
        for (const sellData of buyTradeData.trade) {
          if (userdata.isKiteLogin === true) {
            if (String(sellData.user_id) === String(id) && !sellData.isSelled && sellData.quantity > 0 && sellData.quantity !== 0 && sellData.tradingsymbol === body.tradingsymbol) {
              const sellrequireddata: any = {
                access_key: sellData.accessToken,
                tradingsymbol: body.tradingsymbol,
                quantity: sellData.quantity,
                exchange: body.exchange,
                order_type: body.order_type,
                product: body.product,
                price: body.sellPrice
              };
              const returnSellData = await sell(sellrequireddata);
              const order_id = sellData.buyOrderId;
              const profit =
                Number(sellData.quantity) *
                Number(body.sellPrice) *
                Number(buyTradeData.loatSize) -
                Number(sellData.quantity) *
                Number(sellData.buyKitePrice) *
                Number(buyTradeData.loatSize);
              await userTrade.updateOne(
                { "trade.user_id": id, "trade.buyOrderId": order_id },
                {
                  $set: {
                    "trade.$.isSelled": true,
                    "trade.$.sellAt": indiaTime,
                    "trade.$.sellKitePrice": body.sellPrice,
                    "trade.$.sellOrderId": returnSellData.order_id,
                    // "trade.$.sellOrderId": generateRandomNumber(),
                    "trade.$.profit": profit,
                    "trade.$.selltradeStatus": returnSellData.status,
                    // "trade.$.selltradeStatus": "success",
                    "trade.$.lastLoginAt": lastConnectionDetails.loginAt,
                    "trade.$.lastLogOutAt": lastConnectionDetails.logoutAt,
                  },
                }
              );

              // await adminTrade.findOneAndUpdate({ _id: id }, { $set: { sellPrice: body.sellPrice, sellAT: indiaTime, sellOrderId: "123" } });
              await adminTrade.findOneAndUpdate({ _id: id }, { $set: { sellPrice: body.sellPrice, sellAT: indiaTime, sellOrderId: returnSellData.order_id } });
              const data = await userTrade.findOne({
                "trade.user_id": id,
                "trade.buyOrderId": order_id,
              });
              for (const tradeData of data.trade) {
                if (String(tradeData.user_id) === String(id)) {
                  return (obj = tradeData);
                }
              }
            }
          } else {
            await userTrade.updateOne(
              { "trade.user_id": id, "trade.buyOrderId": sellData.buyOrderId },
              {
                $set: {
                  "trade.$.selltradeStatus": "user not login",
                  "trade.$.sellAt": indiaTime,
                  "trade.$.lastLoginAt": lastConnectionDetails.loginAt,
                  "trade.$.lastLogOutAt": lastConnectionDetails.logoutAt,
                },
              }
            );
          }
        }
      }
    }
  } catch (error) {
    return error;
  }
};
