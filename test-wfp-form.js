import crypto from "crypto";

// Данные мерчанта
const MERCHANT_ACCOUNT = "sushi_fox_netlify_app";
const MERCHANT_PASSWORD = "716ef0f96623dca2ab5c175021463a36"; // секретный пароль
const MERCHANT_DOMAIN_NAME = "sushi-fox.netlify.app";

// Пример товаров
const products = [
  { name: "МАКІ З КРАБОМ", price: 99, qty: 1 },
  { name: "МАКІ З КРЕВЕТКОЮ", price: 109, qty: 1 },
  { name: "ЛАВА МАКІ З ОГІРКОМ", price: 109, qty: 1 },
];

function generatePayload() {
  const orderReference = Date.now().toString();
  const orderDate = Math.floor(Date.now() / 1000);

  const productName = products.map(p => String(p.name));
  const productCount = products.map(p => Number(p.qty));
  const productPrice = products.map(p => Number(p.price));

  const amount = productPrice.reduce((sum, price, idx) => sum + price * productCount[idx], 0);

  // Строка для подписи
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
    .update(signatureString, "utf8")
    .digest("base64");

  return {
    merchantAccount: MERCHANT_ACCOUNT,
    merchantDomainName: MERCHANT_DOMAIN_NAME,
    orderReference,
    orderDate,
    amount,
    currency: "UAH",
    productName,
    productCount,
    productPrice,
    merchantSignature
  };
}

function generateHtmlForm(payload) {
  const formInputs = Object.entries(payload)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) return value.map(v => `<input type="hidden" name="${key}[]" value="${v}"/>`);
      return `<input type="hidden" name="${key}" value="${value}"/>`;
    })
    .join("\n");

  return `
    <html>
      <body onload="document.forms[0].submit()">
        <form method="POST" action="https://secure.wayforpay.com/pay">
          ${formInputs}
        </form>
        <p>Перенаправление на оплату (только тест, без реального перевода)...</p>
      </body>
    </html>
  `;
}

// Генерируем payload и HTML
const payload = generatePayload();
console.log("DEBUG payload:", payload);

const html = generateHtmlForm(payload);
console.log("\nHTML форма для проверки WayForPay:\n");
console.log(html);
