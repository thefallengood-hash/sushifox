import crypto from "crypto";
import admin from "firebase-admin";

// Инициализация firebase-admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: "sushi-fox-menu",
      private_key_id: "657fce216b1061bff3051d430621193d32542dae",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwNS3ZpBI43V46\naum456YplMtVwWt0DRv0LxAPoI3tfytfMRDHQTN71fsCiRiAm2cNIGcSPsDEFdJ7\nigytnV9YRLu1oqAIHWr4UG/LTrA4nSRS3QqM9L6ACUTrpzTJzxTA6HymP7S9vpne\n2U9DYXTVVsKV4RZUyHk3Ofhl25ueLsr/5v5d3ozVAO74p5xTwRK+H7h+w11Kwt0e\nwLYXH4aGeUfJiW0IUEnwz0HDvCn9Nd4qw7T2QkfvQ2+prkAsdfZJFvSPi528KfiL\nPVgPgz9GWKTD+e+a6Qd7oX/SNzqJkHPyEwIWOThIAC2cu5AcuEImjkQIb/pxSraw\nMVcwQOxLAgMBAAECggEAQw9CD1GzQ6PvwAC/SUkTwkBn8A+H4uc4S8J7dM8QJKIg\nsf4c2hAU1Vy2xhzBz/QUkHjT8SwjtZxueeiscYhyaEfkPjiRefUkKDOIkFG2nB0l\n3UlVQhbExzp/2cVNQD6Ise/ovGaDVTEMIzUFxul4itaVgG/kzUhsZVmxEKa2v0iC\nYpMk7e5DkN4hKV7aH7c1gtRDAS3uJDc5p5D0D0jh7YE1K2jfgwDdjHQb7c+Hjkp3\n7dXuGBA6hOUDJP7GCKbPA6f49Jwai08PYoMaB5CzRsLL6vqfj+8d1/Tq7rbWiTZW\ntU8djT1XxAXI6UGg7xXAgqyCFeMOOGtnnQEOd2oR3QKBgQDnjVG/PvPcKEjHo8fd\nlzRbfXEZfh0kYiOnEN0TNK7adun+6xaEHRuORA1pNb8K2X7ewrfaYW5lZ5z9FoQq\nAVtvGtRAaZT8Yx392gw03mNopaA+Kdxhrjrt97sFQQ7d4c99WbSI0xO7rlGOOnXy\nMOW1uDiKsHcsB4NMeqMeXys5HQKBgQDCz/G3DheQgDJ5ioteqNQ+UlVbTTrU65We\n6eHFpXUBqKF4f3cX3h7hZu9CoQN3Vw4hvdg8n5IfWmqVD9eeu12y/4dT6XoYaU3O\nOPmKv72T0yl+N3kBoVXQ5YTJeGXoVSkWYE8MXNAMigYafsZTYbaKzg6Q54x1Tm8w\nr3mWIJGmhwKBgETeP0YGTzlXse3OxI8ffa8IbC8M11YO6lOyLE6eCLNpUsdC3HuG\nvL9fdi2okp2Derx+ZXhKKi921bZgkAZ+SNeOvzo5LNq0ECOESsUer6pcOIDEqotS\n6qwEVleFtgpAMxoxKATZ4rCbdB49PP8/k9KsbASz33307hQ9FW7fF1fxAoGAEqQR\nLgH0MUiDC+w838bp4DjCoCTorz0HqRgaGW52nr0DDmOsAqWncMwHsulzSnUTDhl7\nWnmuYr+lGTRV3oNxONKIoXfizfktj8EV57fnLQD0pHYsZwKIEqATr6+MmMmlT9XR\nWo56/egrI1fkJFBiRi/nZugxIXxq2U7BJKNjLHsCgYEA5ikSuuvW5VpUA0BJwNie\nHJsM0eMN1q7x/G67r+0n+pxlg3H6LguT08a4fgfGMUSvm1MwNe0ocNxKrFYRM1FP\n3YQZ/t9c/KHC5qrgd9HFsK+3bt1kagypRlz07n7gqa5Tr/LSC455+6yXQY/qVR3m\naBW5ALdjnw4i/8PR/f/zVH8=\n-----END PRIVATE KEY-----\n",
      client_email: "firebase-adminsdk-fbsvc@sushi-fox-menu.iam.gserviceaccount.com",
      client_id: "102766167010118832857",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40sushi-fox-menu.iam.gserviceaccount.com"
    }),
    databaseURL: "https://sushi-fox-menu.firebaseio.com"
  });
}

const db = admin.firestore();

// Данные мерчанта
const MERCHANT_ACCOUNT = "freelance_user_68acde4a670e7";
const SECRET_KEY = "4f8e577b3787070fc92079e227d37de997b1dd12";

export async function handler(event, context) {
  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: "Нет данных в запросе" }) };
  }

  try {
    const data = JSON.parse(event.body);
    console.log("Callback data received:", data);

    // Проверяем подпись
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

    console.log("Signature valid:", validSignature === data.merchantSignature);

    if (validSignature !== data.merchantSignature) {
      console.error("Неверная подпись от WayForPay");
      return { statusCode: 400, body: JSON.stringify({ error: "Неверная подпись" }) };
    }

    // Пишем заказ только если оплата успешна
    if (data.transactionStatus === "Approved") {
      const docRef = await db.collection("orders").add({
        orderReference: data.orderReference,
        amount: data.amount,
        currency: data.currency,
        date: new Date().toISOString(),
        status: "Оплачено",
        products: data.products || []
      });

      console.log("Заказ добавлен в Firebase:", docRef.id);
    } else {
      console.log("Оплата не успешна, заказ не добавлен:", data.transactionStatus);
    }

    return { statusCode: 200, body: JSON.stringify({ result: "OK" }) };
  } catch (err) {
    console.error("Ошибка при обработке callback:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Ошибка при обработке callback" }) };
  }
}
