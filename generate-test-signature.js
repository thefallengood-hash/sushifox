// generate-test-signature.js
import crypto from "crypto";

// ⚠️ Вставь свой secretKey из WayForPay
const secretKey = "4f8e577b3787070fc92079e227d37de997b1dd12";

// Данные тестового платежа
const merchantAccount = "freelance_user_68acde4a670e7";
const orderReference = "TEST123";
const amount = 100;
const currency = "UAH";
const transactionStatus = "Approved";

// Собираем строку для подписи
const signatureString = `${merchantAccount};${orderReference};${amount};${currency};${transactionStatus}`;

// Генерация подписи
const signature = crypto
  .createHmac("md5", secretKey)
  .update(signatureString)
  .digest("base64");

console.log("Строка для подписи:", signatureString);
console.log("Подпись:", signature);
