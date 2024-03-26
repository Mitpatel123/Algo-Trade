// const {KiteConnect} = require("kiteconnect");

// const apiKey = "c8klttwlwiop0bi5";

// // Create an instance of KiteConnect
// const kite = new KiteConnect({
//   api_key: apiKey,
// });

// // Now you can use the instance to get the login URL
// const loginURL = kite.getLoginURL();

// console.log("Login URL:", loginURL);      

import * as bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';

// ... start your server

import os from 'os';
import * as packageInfo from '../package.json';
import { mongooseConnection } from './database/connection';
import { router } from './router';

const app = express();

app.use(mongooseConnection);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
global.osName = os.platform();

const health = (req, res) => {
  return res.status(200).json({
    message: "Node.js backend server is running",
    app: packageInfo.name,
    version: packageInfo.version,
    author: "MitCodeMode",
    license: packageInfo.license,
    contributors: [
      {
        name: " MitCodeMode",
        email: "mitdobariya69@gmail.com"
      }
    ]
  });
};

const bad_gateway = (req, res) => {
  return res.status(502).json({ status: 502, message: " Algo_Trade Backend API Bad Gateway!" });
};

app.get('/', health);
app.get('/health', health);
app.get('/isServerUp', (req, res) => { res.send('Server is running ') });
app.use(router);
app.use('*', bad_gateway);


let server = new http.Server(app);
export default server;
