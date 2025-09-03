import crypto from "crypto";

export async function handler(event, context) {
  // Данные мерчанта (секрет — именно SecretKey, НЕ "secret password")
  const MERCHANT_ACCOUNT = "sushi_fox_netlify_app";
  const MERCHANT_SECRET_KEY = "f898a66a913cf08ce0e51cc9c14b987b2ddb304b"; // SecretKey
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

    // Уникальный номер заказа + текущее время (UTC, секунды)
    const orderReference = Date.now().toString();
    const orderDate = Math.floor(Date.now() / 1000);
    console.log("FIXED orderDate:", orderDate, "UTC:", new Date(orderDate * 1000).toISOString());

    // Массивы позиций (строго числа для цены и количества)
    const productName  = products.map(p => String(p.name));
    const productCount = products.map(p => Number(p.qty));
    const productPrice = products.map(p => Number(p.price));

    // Сумма заказа должна совпадать с суммой позиций
    const amount = productPrice.reduce((sum, price, i) => sum + price * productCount[i], 0);

    // Строка для подписи: HMAC_MD5 по SecretKey
    const sigParts = [
      MERCHANT_ACCOUNT,
      MERCHANT_DOMAIN_NAME,
      orderReference,
      orderDate,
      amount,
      "UAH",
      ...productName,
      ...productCount,
      ...productPrice
    ];
    const signatureString = sigParts.join(";");

    const merchantSignature = crypto
      .createHmac("md5", MERCHANT_SECRET_KEY)
      .update(signatureString, "utf8")
      .digest("hex"); // у WayForPay — именно MD5 hex

    // Логируем для отладки (без ключей, естественно)
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
    // console.log("signatureString:", signatureString); // если нужно дебажить

    // HTML-форма с повторяющимися полями [] для массивов
    const formInputs = [
      ["merchantAccount", MERCHANT_ACCOUNT],
      ["merchantDomainName", MERCHANT_DOMAIN_NAME],
      ["orderReference", orderReference],
      ["orderDate", String(orderDate)],
      ["amount", String(amount)],
      ["currency", "UAH"],
      ...productName.map(v  => ["productName[]", v]),
      ...productCount.map(v => ["productCount[]", String(v)]),
      ...productPrice.map(v => ["productPrice[]", String(v)]),
      ["merchantSignature", merchantSignature]
    ]
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}"/>`)
      .join("\n");

    const html = `
      <html><body onload="document.forms[0].submit()">
        <form method="POST" action="https://secure.wayforpay.com/pay">
          ${formInputs}
        </form>
        <p>Перенаправление на оплату…</p>
      </body></html>
    `;

    return { statusCode: 200, headers: { "Content-Type": "text/html; charset=utf-8" }, body: html };
  } catch (err) {
    console.error("Ошибка create-order:", err);
    return { statusCode: 500, body: "Ошибка при обработке заказа" };
  }
}
