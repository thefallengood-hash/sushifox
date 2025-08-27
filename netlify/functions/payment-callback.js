import crypto from "crypto";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Firebase настройки
const firebaseConfig = {
  apiKey: "AIzaSyAYXF7iVTnHIB67DAcoxA5dbhNSEcKrNkA",
  authDomain: "sushi-fox-menu.firebaseapp.com",
  projectId: "sushi-fox-menu",
  storageBucket: "sushi-fox-menu.appspot.com",
  messagingSenderId: "520117298113",
  appId: "1:520117298113:web:608a831f6bbe1e914e0540"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Данные мерчанта
const MERCHANT_ACCOUNT = "freelance_user_68acde4a670e7";
const SECRET_KEY = "4f8e577b3787070fc92079e227d37de997b1dd12";

export async function handler(event, context) {
  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: "Нет данных в запросе" }) };
  }

  try {
    const data = JSON.parse(event.body);

    // Проверяем подпись от WayForPay
    const signatureString = [
      data.merchantAccount,
      data.orderReference,
      data.amount,
      data.currency,
      data.authCode || "",
      data.cardPan || "",
      data.transactionStatus,
      data.reasonCode || ""
    ].join(";");

    const validSignature = crypto
      .createHmac("sha1", SECRET_KEY)
      .update(signatureString)
      .digest("base64");

    if (validSignature !== data.merchantSignature) {
      return { statusCode: 400, body: JSON.stringify({ error: "Неверная подпись" }) };
    }

    // Сохраняем заказ только если оплата прошла
    if (data.transactionStatus === "Approved") {
      await addDoc(collection(db, "orders"), {
        orderReference: data.orderReference,
        amount: data.amount,
        currency: data.currency,
        date: new Date().toISOString(),
        status: "Оплачено",
        products: data.products || []
      });
    }

    // WayForPay требует вернуть OK
    return { statusCode: 200, body: JSON.stringify({ result: "OK" }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Ошибка при обработке callback" }) };
  }
}
