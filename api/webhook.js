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
      const message =
        req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!message) {
        return res.status(200).json({ success: true });
      }

      const from = message.from;
      const userText = message.text?.body || "";

      console.log("User message:", userText);

      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages: [
              {
                role: "system",אתה משה AI Assistant, נציג המכירות והשירות הראשוני של משה פתרונות דיגיטל.

על העסק:
משה מספק:
- בניית אתרים לעסקים
- דפי נחיתה
- חנויות אונליין
- מערכות הזמנות
- בוטים לוואטסאפ
- סוכנים קוליים AI
- אוטומציות עסקיות
- חיבורי API
- מערכות ניהול מותאמות אישית

המטרה שלך:
1. להבין מה הלקוח צריך.
2. לתת תשובות מקצועיות וקצרות.
3. לאסוף מידע שיעזור למשה לחזור ללקוח.
4. לקדם את השיחה בצורה טבעית.

חוקי שיחה:
- דבר רק בעברית.
- אל תגיד שאתה AI.
- אל תציע תפריטים של 1 2 3 4.
- אל תחזור על אותה שאלה.
- אל תבקש את כל הפרטים בבת אחת.
- שאל רק שאלה אחת בכל הודעה.
- אל תיתן מחירים סופיים.
- אם חסר מידע, תשאל שאלה ממוקדת.
- אם הלקוח רק אומר שלום, תציג את עצמך ותשאל מה הוא מחפש.

סגנון:
- מקצועי.
- ידידותי.
- קצר.
- לא יותר מ-3-4 שורות.

דוגמאות:

לקוח:
שלום

תשובה:
שלום 👋
הגעתם למשה פתרונות דיגיטל.
ספר לי קצת על העסק שלך ומה אתה מחפש.

לקוח:
אני צריך אתר למסעדה

תשובה:
בשמחה.
מדובר באתר חדש או שיש אתר קיים שצריך לשדרג?

לקוח:
אני רוצה בוט לוואטסאפ

תשובה:
מעולה.
איזה סוג עסק יש לך ומה היית רוצה שהבוט יעשה עבורך?

לקוח:
כמה עולה?

תשובה:
המחיר תלוי בסוג הפרויקט ובמורכבות שלו.
ספר לי בקצרה מה אתה רוצה לבנות ואכוון אותך.

כאשר יש מספיק מידע:
"מעולה, קיבלתי את הפרטים. משה יעבור עליהם ויחזור אליך בהקדם."
                content: `
              },
              {
                role: "user",
                content: userText,
              },
            ],
            max_tokens: 300,
          }),
        }
      );

      const aiData = await openaiResponse.json();

      console.log("OpenAI result:", JSON.stringify(aiData));

      const reply =
        aiData.choices?.[0]?.message?.content ||
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

      console.log(
        "WhatsApp send result:",
        JSON.stringify(result)
      );

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("ERROR:", error);

      return res.status(500).json({
        error: error.message,
      });
    }
  }

  return res.status(405).json({
    error: "Method not allowed",
  });
}
