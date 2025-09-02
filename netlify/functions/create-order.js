import crypto from "crypto";

export async function handler(event, context) {
  const MERCHANT_ACCOUNT = "sushi_fox_netlify_app";
  const MERCHANT_PASSWORD = "f898a66a913cf08ce0e51cc9c14b987b2ddb304b"; 
  const MERCHANT_DOMAIN_NAME = "sushi-fox.netlify.app";

  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: "Нет данных в запросе" }) };
  }

  try {
    const { amount, products } = JSON.parse(event.body);

    if (!products || !products.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "Нет товаров в заказе" }) };
    }

    const orderReference = Date.now().toString();
    const orderDate = Math.floor(Date.now() / 1000);

    // Форматируем товары под WayForPay
    const productName = products.map(p => p.name.replace(/;/g, ",")).join(";");
    const productPrice = products.map(p => Number(p.price).toFixed(2)).join(";");
    const productCount = products.map(p => p.qty.toString()).join(";");
    const amountStr = Number(amount).toFixed(2);

    const signatureString = [
      MERCHANT_ACCOUNT,
      MERCHANT_DOMAIN_NAME,
      orderReference,
      orderDate,
      amountStr,
      "UAH",
      productName,
      productCount,
      productPrice
    ].join(";");

    const merchantSignature = crypto
      .createHmac("md5", MERCHANT_PASSWORD)
      .update(signatureString)
      .digest("hex");

    return {
      statusCode: 200,
      body: JSON.stringify({
        merchantAccount: MERCHANT_ACCOUNT,
        merchantDomainName: MERCHANT_DOMAIN_NAME,
        merchantAuthType: "SimpleSignature",
        orderReference,
        orderDate,
        amount: amountStr,
        currency: "UAH",
        productName,
        productPrice,
        productCount,
        merchantSignature
      })
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Ошибка при обработке заказа" }) };
  }
}
