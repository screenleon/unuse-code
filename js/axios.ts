import { Worker } from 'worker_threads';
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { IDevice } from "./tester";
const path = require("path");
const qs = require("qs");
const FormData = require("form-data");
import * as fs from "fs";

dotenv.config({ path: __dirname + '/../../.env' });;


/** @ts-ignore */
const userArguments = process.argv.slice(2);
for (let index = 0; index < userArguments.length; index += 2) {
    parseProcessArgument(userArguments[index], index + 1 < userArguments.length ? userArguments[index + 1] : 0);
}

// Save parse cookie
let cookies = "";

const host = process.env['HOST'];

/**
 * Initial axios setting
 */
const api = axios.create({
    baseURL: host,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Cache: "no-cache",
    }
});

api.interceptors.request.use(function (config) {
    config.headers.cookie = cookies;
    return config;
});

api.interceptors.response.use(function (response) {
    if (response.headers['set-cookie'] instanceof Array) {
        cookies = response.headers['set-cookie'].join("; ");
    }

    return response;
});

interface IOauth {
    client_id: string;
    scope: string;
    redirect_uri: string;
    user: string;
    password: string;
}

// 抓取有綁定的裝置 , 測試型號為 KJUMP-TEST-MODEL
(async function () {
    const oauthOptions = {
        "client_id": process.env["BENCH_OAUTH_CLIENT_ID"] as string,
        "scope": process.env["BENCH_OAUTH_SCOPE"] as string,
        "redirect_uri": process.env["BENCH_OAUTH_REDIRECT_URI"] as string,
        "user": process.env["BENCH_HOST_USER"] as string,
        "password": process.env["BENCH_HOST_PASSWORD"] as string,
    };

    try {
        const authCode = await getAuthenticationCode(oauthOptions) as string;
        const accessToken = await getAccessToken(authCode, oauthOptions);
        // Add Authorization to below api
        api.defaults.headers.Authorization = `Bearer ${accessToken}`;
    } catch (e) {
        console.error(e)
        process.exit();
    }
    console.log("Success get the oauth access token!");
})();

/**
 * Get csrf from host
 * @throws {Error}
 * @returns
 */
async function getCSRF(): Promise<string> {
    const response = await api({ url: "/" });
    const fetchString = String(response.data).match(/<meta name\=\"csrf-token\" content=\"[A-Za-z0-9-_=]+\">/);
    if (fetchString == null) {
        throw new Error("Can not get csrf");
    }

    return fetchString[0].substring(33, fetchString[0].length - 2);
}

/**
 * Get auth code
 * @throws {Error}
 * @returns
 */
async function getAuthenticationCode(oauthOptions: IOauth): Promise<string> {
    const apiPath = `APIPATH`;
    const csrf = await getCSRF();
    const loginResponse = await api({
        url: apiPath,
        method: 'post',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        data: qs.stringify({
            "_csrf": csrf,
            "username": oauthOptions["user"],
            "password": oauthOptions["password"],
        }),
    });

    const authCodeResponse = await api.get(loginResponse.data);

    if (authCodeResponse.request.path) {
        const path = String(authCodeResponse.request.path);
        return qs.parse(path.substring(path.indexOf("?") + 1))["code"] as string;
    }

    throw new Error("Can not fetch auth code");
}

/**
 * Get oauth access token
 * @throws {Error}
 * @returns 
 */
async function getAccessToken(authCode: string, oauthOptions: IOauth): Promise<string> {
    const apiPath = "APIPATH";
    const form = new FormData();
    form.append("client_id", oauthOptions["client_id"]);
    form.append("grant_type", "authorization_code");
    form.append("scope", oauthOptions["scope"]);
    form.append("code", authCode);
    form.append("redirect_uri", oauthOptions["redirect_uri"]);

    const response = await api({
        url: apiPath,
        method: 'post',
        headers: form.getHeaders(),
        data: form
    });

    if(!!response.data["access_token"]) {
        return response.data["access_token"];
    }

    throw new Error("Can not get access token");
}
