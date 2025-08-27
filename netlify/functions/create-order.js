import crypto from "crypto";

export async function handler(event, context) {
  const SECRET_KEY = "4f8e577b3787070fc92079e227d37de997b1dd12"; 
  const MERCHANT_ACCOUNT = "freelance_user_68acde4a670e7";

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON" })
    };
  }

  const { amount, products } = body;

  if (!amount || !products || !Array.isArray(products) || products.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing amount or products" })
    };
  }

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
