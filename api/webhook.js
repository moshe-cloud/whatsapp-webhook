export default async function handler(req, res) {
  const VERIFY_TOKEN = "moshe123";

  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send("Verification failed");
  }

  if (req.method === "POST") {
    try {
      const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!message) {
        return res.status(200).json({ success: true });
      }

      const from = message.from;
      const text = message.text?.body?.toLowerCase() || "";

      let reply = "";

      if (text.includes("אתר") || text === "1") {
        reply = "מעולה 👨‍💻\nאנחנו בונים אתרי תדמית, אתרי הזמנות, דפי נחיתה ומערכות לעסקים.\n\nכדי שמשה יוכל להבין מה מתאים לך, איזה סוג עסק יש לך?";
      } 
      else if (text.includes("ווצאפ") || text.includes("וואטסאפ") || text === "2") {
        reply = "בוט WhatsApp יכול לענות ללקוחות, לאסוף לידים, לקבל הזמנות ולחבר את העסק למערכות נוספות.\n\nאיזה עסק יש לך ומה היית רוצה שהבוט יעשה?";
      } 
      else if (text.includes("קולי") || text.includes("טלפון") || text === "3") {
        reply = "סוכן קולי AI יכול לענות לשיחות, לקבל הזמנות, לקבוע פגישות ולתת שירות כמו נציג אנושי.\n\nכמה שיחות בערך העסק מקבל ביום?";
      } 
      else if (text.includes("מחיר") || text.includes("כמה עולה")) {
        reply = "המחיר משתנה לפי הצורך של העסק והמורכבות של הפרויקט.\n\nכדי שמשה יוכל לתת הצעת מחיר מדויקת, אשמח שתכתוב:\nשם העסק:\nמה צריך לבנות:\nהאם יש אתר קיים:";
      } 
      else if (text.includes("משה") || text.includes("נציג") || text === "4") {
        reply = "בשמחה 👍\nכדי שמשה יחזור אליך, שלח בבקשה:\n\nשם מלא:\nשם העסק:\nטלפון:\nמה אתה צריך:";
      } 
      else {
        reply = "שלום 👋 הגעתם למשה פתרונות דיגיטל.\n\nאיך אפשר לעזור?\n\n1️⃣ בניית אתר\n2️⃣ בוט WhatsApp\n3️⃣ סוכן קולי AI\n4️⃣ לדבר עם משה\n\nאפשר גם לכתוב חופשי מה אתה צריך.";
      }

      const response = await fetch(
        `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: from,
            text: {
              body: reply
            }
          })
        }
      );

      const result = await response.json();
      console.log("WhatsApp send status:", response.status);
      console.log("WhatsApp send result:", JSON.stringify(result));

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error("Webhook error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
