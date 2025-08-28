import admin from "firebase-admin";
import crypto from "crypto";

// Инициализация Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// 🔑 Секретный ключ WayForPay
const SECRET_KEY = "4f8e577b3787070fc92079e227d37de997b1dd12";

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
      products
    } = body;

    if (!merchantAccount || !orderReference || !amount || !currency || !transactionStatus) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Не хватает данных" }),
      };
    }

    // 🔑 Генерация подписи
    const signatureString = [
      merchantAccount,
      orderReference,
      amount,
      currency,
      transactionStatus
    ].join(";");

    const expectedSignature = crypto
      .createHmac("sha1", SECRET_KEY)
      .update(signatureString)
      .digest("base64");

    if (merchantSignature !== expectedSignature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Неверная подпись" }),
      };
    }

    // 🆕 Создаём заказ со статусом "Новый"
    const orderData = {
      orderId: orderReference,
      amount,
      currency,
      date: new Date().toISOString(),
      status: "Новый",
      paymentMethod: "Карта",
      products: products || []
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
}
