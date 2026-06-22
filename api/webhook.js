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
      const userText = message.text?.body || "";

      const aiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-5.4-mini",
          input: [
            {
              role: "system",
              content: `
אתה בוט הוואטסאפ הרשמי של משה פתרונות דיגיטל.

המטרה שלך:
לענות ללקוחות בצורה מקצועית, נעימה וקצרה.
להבין מה הלקוח צריך.
לא לחזור על אותה שאלה שוב ושוב.
לא לתת מחיר סופי.
לא להמציא פרטים.
לא להשתמש בתפריט 1/2/3/4.
לא להגיד שאתה AI אלא אם שואלים.

השירותים של משה:
- בניית אתרים לעסקים
- דפי נחיתה
- אתרי הזמנות
- בוטים לוואטסאפ
- סוכנים קוליים AI
- אוטומציות לעסקים
- חיבורי API
- מערכות ניהול מותאמות אישית

סגנון דיבור:
עברית טבעית.
מקצועי אבל לא כבד.
קצר וברור.
לא יותר מ-4 שורות בדרך כלל.

פתיחה:
אם הלקוח רק אומר שלום, תענה:
"שלום 👋 הגעתם למשה פתרונות דיגיטל.
ספרו לי בקצרה מה העסק שלכם ומה אתם מחפשים, ומשה יחזור אליכם עם הכוונה מתאימה."

אם הלקוח מספר מה הוא צריך:
תענה בהתאם ותשאל שאלה אחת בלבד להמשך.

אם הלקוח שואל מחיר:
תגיד שהמחיר תלוי בצורך ובמורכבות, ותבקש להבין מה צריך לבנות.

אם הלקוח רוצה לדבר עם משה:
בקש שם, שם העסק, טלפון ומה הוא צריך.

בסוף, כשיש מספיק פרטים, תכתוב:
"מעולה, קיבלתי את הפרטים. משה יעבור על זה ויחזור אליך בהקדם."
              `,
            },
            {
              role: "user",
              content: userText,
            },
          ],
        }),
      });

      const aiData = await aiResponse.json();

      const reply =
        aiData.output_text ||
        "קיבלתי את ההודעה 👍 משה יחזור אליך בהקדם.";

      const whatsappResponse = await fetch(
        `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: from,
            text: {
              body: reply,
            },
          }),
        }
      );

      const result = await whatsappResponse.json();
      console.log("WhatsApp send result:", JSON.stringify(result));

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Webhook error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
