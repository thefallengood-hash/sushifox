// functions/payment-callback.js
import admin from "firebase-admin";
import crypto from "crypto";

// Инициализация Firebase Admin через сервисный аккаунт
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Метод не разрешён" }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const {
      merchantAccount,
      orderReference,
      amount,
      currency,
      transactionStatus,
      merchantSignature,
      products = [],
    } = body;

    if (!merchantAccount || !orderReference || !amount || !currency || !transactionStatus) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Не хватает данных" }),
      };
    }

    // Секретный ключ WayForPay из env
    const secretKey = process.env.WAYFORPAY_SECRET;
    if (!secretKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Секретный ключ не задан" }),
      };
    }

    // Формируем строку для подписи
    const signatureString = [merchantAccount, orderReference, amount, currency, transactionStatus].join(";");

    // Генерация HMAC-SHA1 подписи в base64
    const expectedSignature = crypto
      .createHmac("sha1", secretKey)
      .update(signatureString)
      .digest("base64");

    if (merchantSignature !== expectedSignature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Неверная подпись" }),
      };
    }

    // Создаём заказ в Firestore
    const orderData = {
      orderId: orderReference,
      amount,
      currency,
      status: "Новый",
      date: new Date().toISOString(),
      products,
      paymentMethod: "Карта",
    };

    await db.collection("orders").doc(orderReference).set(orderData);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Ошибка в payment-callback:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Ошибка сервера" }),
    };
  }
};
