import admin from "firebase-admin";
import crypto from "crypto";

// Инициализация Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
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

    // 🔑 Берём секретный ключ из переменной окружения Netlify
    const secretKey = process.env.WAYFORPAY_SECRET;
    if (!secretKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Секретный ключ не задан" }),
      };
    }

    // Генерация подписи SHA1
    const signatureString = [merchantAccount, orderReference, amount, currency, transactionStatus].join(";");
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

    // 🆕 Создаём заказ со статусом "Новый"
    const orderData = {
      orderId: orderReference,
      amount,
      currency,
      date: new Date().toISOString(),
      status: "Новый",
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
}
