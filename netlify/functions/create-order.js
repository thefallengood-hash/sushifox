import crypto from "crypto";

export async function handler(event, context) {
  const MERCHANT_ACCOUNT = "sushi_fox_netlify_app";
  const MERCHANT_PASSWORD = "f898a66a913cf08ce0e51cc9c14b987b2ddb304b"; // твой секрет
  const MERCHANT_DOMAIN_NAME = "sushi-fox.netlify.app";

  if (!event.body) {
    return { statusCode: 400, body: "Нет данных в запросе" };
  }

  try {
    const body = JSON.parse(event.body);
    const { products } = body;

    if (!products || products.length === 0) {
      return { statusCode: 400, body: "Нет товаров в заказе" };
    }

    const orderReference = Date.now().toString();
    const orderDate = Math.floor(Date.now() / 1000);

    const productName = products.map(p => String(p.name));
    const productCount = products.map(p => Math.round(Number(p.qty)));
    const productPrice = products.map(p => Math.round(Number(p.price)));

    const amount = productPrice.reduce((sum, price, idx) => sum + price * productCount[idx], 0);

    // Формируем строку для подписи
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

    // Важно: HMAC-MD5 + base64
    const merchantSignature = crypto
      .createHmac("md5", MERCHANT_PASSWORD)
      .update(signatureString, "utf8")
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

    const formInputs = [
      ["merchantAccount", MERCHANT_ACCOUNT],
      ["merchantDomainName", MERCHANT_DOMAIN_NAME],
      ["orderReference", orderReference],
      ["orderDate", orderDate],
      ["amount", amount],
      ["currency", "UAH"],
      ...productName.map(v => ["productName[]", v]),
      ...productPrice.map(v => ["productPrice[]", v.toString()]),
      ...productCount.map(v => ["productCount[]", v.toString()]),
      ["merchantSignature", merchantSignature]
    ].map(([k, v]) => `<input type="hidden" name="${k}" value="${v}"/>`).join("\n");

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
