import crypto from "crypto";

const merchantAccount = "freelance_user_68acde4a670e7";
const orderReference = "TEST1234";
const amount = "100.00";
const currency = "UAH";
const transactionStatus = "Approved";
const secretKey = "4f8e577b3787070fc92079e227d37de997b1dd12"; // вставь сюда ключ

const signatureString = [merchantAccount, orderReference, amount, currency, transactionStatus].join(";");
const merchantSignature = crypto.createHmac("sha1", secretKey).update(signatureString).digest("base64");

console.log("merchantSignature:", merchantSignature);


