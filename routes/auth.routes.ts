import { Router } from "express";
// import passport from "passport";
import { getDriver } from "../neo4j.ts";
import UsersService from "../services/users.service.ts";
import { getPagination, getUserId, MOVIE_SORT, PEOPLE_SORT } from "../utils.ts";
import requestIP from "request-ip";
import axios from "axios";
import { JWT_SECRET } from ".././constants.ts";
import jwt from "jsonwebtoken";

const app: Router = Router();

const codeLength = 5;
const codeLifetimeInMinutes = 5;

// const filename = "whatsapp-info.json";

const apiVersion = "v16.0";
const phoneNumberID = 148451221695380;
let activeCodes: { [key: string]: any } = {};
const accessToken = "";
function generateCode() {
  // e.g. for code_length = 5, between 0 and 99999 (100000 - 1 = 10^5 - 1)
  const rawCode = Math.floor(Math.random() * 10 ** codeLength);
  // pad with leading zeroes, so e.g. 134 => 00134
  return rawCode.toString().padStart(codeLength, "0");
}

app.get("/:phone_number", async (req, res) => {
  const phone = req.params.phone_number;
  const driver = getDriver();
  const usersService = new UsersService(driver);

  const user = await usersService.findByPhone(phone);

  // const user = await User.findOne({ user_name }).select("+password")
  if (!user) {
    // return res.status(401).send("الرقم غير مسجل اتصل بالمسؤول");
    return res.send({code: 401, message: "الرقم غير مسجل اتصل بالمسؤول", success: false});
  }

  const ipAddress = requestIP.getClientIp(req);
  console.log("ip adress", ipAddress);

  //   console.log(req.socket);
  console.log(`OTP requested for phone # ${phone}`);

  const code = generateCode();
  const expirationTimestamp = new Date();
  expirationTimestamp.setMinutes(
    expirationTimestamp.getMinutes() + codeLifetimeInMinutes
  );

  const sendMessageURL = `https://graph.facebook.com/${apiVersion}/${phoneNumberID}/messages`;
  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "template",
    template: {
      name: "auth",
      language: {
        code: "ar",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: code,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "text",
              text: code,
            },
          ],
        },
      ],
    },
  };

  await axios
    .post(sendMessageURL, payload, config)
    .then((_res) => {
      activeCodes[phone] = { code, expirationTimestamp };
      res.send({success: true, message: 'تم ارسال الكود', code: 200});
    })
    .catch((error) => {
      const errorCode = error.response?.status;
      const errorText = error.response?.data?.error?.error_data?.details;
      console.log(
        `Error (${errorCode}) from calling send message API: ${errorText}`
      );

      res
        .status(500)
        .send("Error calling send message API. Check server logs.");
    });
});

app.post("/:phone_number", async (req, res) => {
  const phone = req.params.phone_number;
  const driver = getDriver();
  const usersService = new UsersService(driver);

  const user = await usersService.findByPhone(phone);
  console.log(phone, 'heyyy');
  
  if (!user) {
    return res.send({success: false, message: "الرقم غير مسجل اتصل بالمسؤول", code: 401});
  }

  console.log(`OTP validation request for phone # ${phone}`);
  const { code: expectedCode, expirationTimestamp } = activeCodes[phone];
  if (expectedCode == null) {
    return res.send({success: false, message: "لا يوجد رمز تحقق لهذا الرقم", code: 401});
  }

  const actualCode = req.body?.code;
  if (actualCode == null) {
    return res.send({success: false, message: "يرجى ادخال كود التحقق", code: 401});

  } else if (expirationTimestamp < Date.now()) {
    delete activeCodes[phone];
    return res.send({success: false, message: "انتهت مهلة الكود، يرجى طلب كود جديد", code: 401});

  } else if (actualCode !== expectedCode) {
    return res.send({success: false, message: "كود التحقق غير صحيح", code: 401});
  }

  delete activeCodes[phone];
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.status(200).send({success: true, message: "كود التحقق غير صحيح", code: 200, data: { user, token }});
});

export default app;
