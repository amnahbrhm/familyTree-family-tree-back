import { Router } from "express";
// import passport from "passport";
import { getDriver } from "../neo4j.ts";
import UsersService from "../services/users.service.ts";
import { getPagination, getUserId, MOVIE_SORT, PEOPLE_SORT } from "../utils.ts";
import requestIP from 'request-ip'
import axios from "axios";

const app: Router = Router();

const codeLength = 5;
const codeLifetimeInMinutes = 5;

// const filename = "whatsapp-info.json";

const apiVersion = "v16.0";
const phoneNumberID = 148451221695380;
let activeCodes: { [key: string]: any } = {};
const accessToken = ''
function generateCode() {
  // e.g. for code_length = 5, between 0 and 99999 (100000 - 1 = 10^5 - 1)
  const rawCode = Math.floor(Math.random() * 10 ** codeLength);
  // pad with leading zeroes, so e.g. 134 => 00134
  return rawCode.toString().padStart(codeLength, "0");
}

app.get("/:phone_number", async (req, res) => {
  const phone = req.params.phone_number;
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
      res.send();
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

app.post("/:phone_number", (req, res) => {
  const phone = req.params.phone_number;
  console.log(`OTP validation request for phone # ${phone}`);

  const { code: expectedCode, expirationTimestamp } = activeCodes[phone];
  if (expectedCode == null) {
    return res.status(404).send(`No active code for phone # ${phone}`);
  }

  const actualCode = req.body?.code;
  if (actualCode == null) {
    return res.status(400).send("No code provided.");
  } else if (expirationTimestamp < Date.now()) {
    delete activeCodes[phone];
    return res.status(401).send("Code has expired, please request another.");
  } else if (actualCode !== expectedCode) {
    return res.status(401).send("Incorrect code.");
  }

  delete activeCodes[phone];
  res.send({ msg: "log in" });
});

export default app;
