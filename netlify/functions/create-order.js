import crypto from "crypto";

export async function handler(event, context) {
  const MERCHANT_ACCOUNT = "freelance_user_68acde4a670e7";
  const SECRET_KEY = "4f8e577b3787070fc92079e227d37de997b1dd12"; // секретный ключ
  const MERCHANT_DOMAIN_NAME = "sushi-fox.netlify.app";

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Нет данных в запросе" })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { amount, products } = body;

    if (!products || products.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Нет товаров в заказе" })
      };
    }

    const orderReference = Date.now().toString();
    const orderDate = Math.floor(Date.now() / 1000);

    const productName = products.map(p => p.name);
    const productPrice = products.map(p => p.price);
    const productCount = products.map(p => p.qty);

    // Формируем строку для подписи
    const signatureString = [
      MERCHANT_ACCOUNT,
      MERCHANT_DOMAIN_NAME,
      orderReference,
      orderDate,
      amount,
      "UAH",
      productName.join(";"),
      productCount.join(";"),
      productPrice.join(";")
    ].join(";");

    const merchantSignature = crypto
      .createHmac("sha1", SECRET_KEY)
      .update(signatureString)
      .digest("base64");

    return {
      statusCode: 200,
      body: JSON.stringify({
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
      })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Ошибка при обработке заказа" })
    };
  }
}
