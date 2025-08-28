import crypto from "crypto";

const SECRET_KEY = "4f8e577b3787070fc92079e227d37de997b1dd12";

const data = [
  "freelance_user_68acde4a670e7", // merchantAccount
  "TEST123",                       // orderReference
  "100",                            // amount
  "UAH",                            // currency
  "",                               // authCode
  "",                               // cardPan
  "Approved",                       // transactionStatus
  ""                                // reasonCode
].join(";");

const signature = crypto.createHmac("sha1", SECRET_KEY).update(data).digest("base64");
console.log("merchantSignature:", signature);
