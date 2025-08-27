import crypto from "crypto";

export async function handler(event, context) {
  try {
    const SECRET_KEY = "4f8e577b3787070fc92079e227d37de997b1dd12"; 
    const MERCHANT_ACCOUNT = "freelance_user_68acde4a670e7";

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Нет данных в запросе" }) };
    }

    const body = JSON.parse(event.body);
    const { amount, products } = body;

    if (!amount || !products || !products.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "Некорректные данные заказа" }) };
    }

    const orderReference = Date.now().toString();
    const orderDate = Math.floor(Date.now() / 1000);

    // Убедимся, что все числа
    const productName = products.map(p => p.name);
    const productPrice = products.map(p => Number(p.price));
    const productCount = products.map(p => Number(p.qty));
    const totalAmount = Number(amount);

    // Формируем строку подписи
    const signatureString = [
      MERCHANT_ACCOUNT,
      "sushi-fox.com", // должен совпадать с вашим доменом в WayForPay
      orderReference,
      orderDate,
      totalAmount,
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
        merchantDomainName: "sushi-fox.com",
        orderReference,
        orderDate,
        amount: totalAmount,
        currency: "UAH",
        productName,
        productPrice,
        productCount,
        merchantSignature
      })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Ошибка сервера" }) };
  }
}
