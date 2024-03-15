import { Request, Response } from "express";
import { adminTrade, userModel, userTrade, tradeQuantity } from "../database";
import { userProfitAndLossData } from "../helpers/kiteConnect/index";
import { apiResponse } from "../common";
import fund from "../helpers/funding.json";
import { responseMessage } from "../helpers/response";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { CronJob } from "cron";
import moment from "moment-timezone";

export function displayIndianTime() {
  const currentTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  console.log("Current Indian Time:", currentTime);
}

// export const task = new CronJob("*/10 * * * * *", () => {
//   console.log("Running task every second");
//   displayIndianTime();
// });

export const nightTask = new CronJob("0 50 23 * * *", async () => {
  try {
    console.log("Running task every day on 11:50 PM");
    const userData = await userModel.updateMany(
      {},
      {
        totalUsePlan: 0,
        access_key: null,
        request_token: null,
        isKiteLogin: false,
      }
    );
    console.log(userData);
  } catch (error) {
    console.error("Error occurred in nightTask:", error);
  }
//   displayIndianTime();
});
