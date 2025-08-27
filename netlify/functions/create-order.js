import crypto from "crypto";

export async function handler(event, context) {
  const SECRET_KEY = "4f8e577b3787070fc92079e227d37de997b1dd12"; 
  const MERCHANT_ACCOUNT = "freelance_user_68acde4a670e7";

  const body = JSON.parse(event.body);
  const { amount, products } = body;

  const orderReference = Date.now().toString();
  const orderDate = Math.floor(Date.now() / 1000);

  const productName = products.map(p => p.name);
  const productPrice = products.map(p => p.price);
  const productCount = products.map(p => p.qty);

  const signatureString = [
    MERCHANT_ACCOUNT,
    "sushi-fox.com", 
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
      merchantDomainName: "sushi-fox.com",
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
}
