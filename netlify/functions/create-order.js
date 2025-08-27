import crypto from "crypto";

export async function handler(event, context) {
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Нет данных в запросе" }) };
    }

    const SECRET_KEY = "4f8e577b3787070fc92079e227d37de997b1dd12"; 
    const MERCHANT_ACCOUNT = "freelance_user_68acde4a670e7";

    const body = JSON.parse(event.body);
    const { amount, products } = body;

    if (!products || !products.length || !amount) {
      return { statusCode: 400, body: JSON.stringify({ error: "Некорректные данные заказа" }) };
    }

    const orderReference = Date.now().toString();
    const orderDate = Math.floor(Date.now() / 1000);

    const productName = products.map(p => p.name);
    const productPrice = products.map(p => p.price);
    const productCount = products.map(p => p.qty);

    const signatureString = [
      MERCHANT_ACCOUNT,
      "https://sushi-fox.netlify.app/", // <-- укажи свой домен, на котором сайт будет работать
      orderReference,
      orderDate,
      amount,
      "UAH",
      productName.join(";"),
      productCount.join(";"),
      productPrice.join(";")
    ].join(";");

    const merchantSignature = crypto.createHmac("sha1", SECRET_KEY)
                                    .update(signatureString)
                                    .digest("base64");

    return {
      statusCode: 200,
      body: JSON.stringify({
        merchantAccount: MERCHANT_ACCOUNT,
        merchantDomainName: "sushi-fox.netlify.app",
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
      body: JSON.stringify({ error: "Ошибка сервера: " + err.message })
    };
  }
}
