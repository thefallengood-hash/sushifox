import crypto from "crypto";

export async function handler(event, context) {
  const MERCHANT_ACCOUNT = "sushi_fox_netlify_app";
  const MERCHANT_PASSWORD = "f898a66a913cf08ce0e51cc9c14b987b2ddb304b";
  const MERCHANT_DOMAIN_NAME = "sushi-fox.netlify.app";

  if (!event.body) {
    return {
      statusCode: 400,
      body: "Нет данных в запросе"
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { products } = body;

    if (!products || products.length === 0) {
      return { statusCode: 400, body: "Нет товаров в заказе" };
    }

    // === Уникальный номер заказа ===
    const orderReference = Date.now().toString();

    // === Защита от разницы времени с WayForPay ±5 минут ===
    const now = Math.floor(Date.now() / 1000);
    const maxDelta = 300; // 5 минут в секундах
    const orderDate = now; // всегда текущее время UTC
    console.log("FIXED orderDate:", orderDate, "UTC:", new Date(orderDate * 1000).toISOString());

    // массивы для товаров
    const productName = products.map(p => p.name);
    const productPrice = products.map(p => p.price);
    const productCount = products.map(p => p.qty);

    // общая сумма заказа
    const amount = productPrice.reduce((sum, price, idx) => sum + price * productCount[idx], 0);

    // === Автоматический расчёт merchantSignature ===
    const signatureString = [
      MERCHANT_ACCOUNT,
      MERCHANT_DOMAIN_NAME,
      orderReference,
      orderDate,
      amount,
      "UAH",
      ...productName,
      ...productCount,
      ...productPrice
    ].join(";");

    const merchantSignature = crypto
      .createHmac("sha1", MERCHANT_PASSWORD)
      .update(signatureString)
      .digest("base64");

    console.log("PAYLOAD TO WFP:", {
      merchantAccount: MERCHANT_ACCOUNT,
      merchantDomainName: MERCHANT_DOMAIN_NAME,
      orderReference,
      orderDate,
      amount,
      currency: "UAH",
      productName,
      productPrice,
      productCount,
      merchantSignature
    });

    // формируем HTML форму с автосабмитом
    const formInputs = [
      ["merchantAccount", MERCHANT_ACCOUNT],
      ["merchantDomainName", MERCHANT_DOMAIN_NAME],
      ["orderReference", orderReference],
      ["orderDate", orderDate],
      ["amount", amount],
      ["currency", "UAH"],
      ...productName.map(v => ["productName[]", v]),
      ...productPrice.map(v => ["productPrice[]", v]),
      ...productCount.map(v => ["productCount[]", v]),
      ["merchantSignature", merchantSignature]
    ]
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}"/>`)
      .join("\n");

    const html = `
      <html>
        <body onload="document.forms[0].submit()">
          <form method="POST" action="https://secure.wayforpay.com/pay">
            ${formInputs}
          </form>
          <p>Перенаправление на оплату...</p>
        </body>
      </html>
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: html
    };
  } catch (err) {
    console.error("Ошибка create-order:", err);
    return { statusCode: 500, body: "Ошибка при обработке заказа" };
  }
}
