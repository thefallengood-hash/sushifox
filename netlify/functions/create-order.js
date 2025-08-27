// functions/confirm-order.js
import { json } from "@netlify/functions";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";

// Конфиг Firebase (тот же, что в index.html)
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

// Параметры WayForPay
const MERCHANT_ACCOUNT = "freelance_user_68acde4a670e7";
const MERCHANT_SECRET = "4f8e577b3787070fc92079e227d37de997b1dd12";

function createSignature(fields) {
  // Формируем подпись как WayForPay требует
  const crypto = require("crypto");
  const data = [
    fields.merchantAccount,
    fields.orderReference,
    fields.amount,
    fields.currency,
    fields.authCode || "",
    fields.cardPan || "",
    fields.transactionStatus || "",
  ];
  return crypto.createHash("sha1").update(data.join(";") + ";" + MERCHANT_SECRET).digest("hex");
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const body = JSON.parse(event.body);

    // Проверяем подпись
    const signature = createSignature(body);
    if (signature !== body.merchantSignature) {
      return { statusCode: 400, body: JSON.stringify({ reason: "Invalid signature" }) };
    }

    // Получаем заказ в Firebase по orderReference
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("orderNumber", "==", Number(body.orderReference)));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { statusCode: 404, body: JSON.stringify({ reason: "Order not found" }) };
    }

    const orderDoc = snapshot.docs[0];
    let status = "new";
    if (body.transactionStatus === "Approved") status = "paid";
    else if (body.transactionStatus === "Declined") status = "declined";

    await updateDoc(doc(db, "orders", orderDoc.id), { status });

    return { statusCode: 200, body: JSON.stringify({ orderReference: body.orderReference, status }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
