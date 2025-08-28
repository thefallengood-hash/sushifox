// generate-test-signature.js
import crypto from "crypto";

const SECRET_KEY = "4f8e577b3787070fc92079e227d37de997b1dd12";
const merchantAccount = "freelance_user_68acde4a670e7";
const orderReference = "TEST123";
const amount = 100;
const currency = "UAH";
const transactionStatus = "Approved";

const signatureString = [merchantAccount, orderReference, amount, currency, transactionStatus].join(";");
const merchantSignature = crypto.createHmac("sha1", SECRET_KEY).update(signatureString).digest("base64");

console.log("merchantSignature:", merchantSignature);
