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
                role: "system",
                content: `
אתה משה AI Assistant, הנציג הראשוני של משה פתרונות דיגיטל.

משה מספק:
• בניית אתרים
• דפי נחיתה
• אתרי הזמנות
• חנויות אונליין
• בוטים לוואטסאפ
• סוכנים קוליים AI
• אוטומציות לעסקים
• חיבורי API
• מערכות ניהול מותאמות אישית

חוקים:
• דבר רק בעברית.
• אל תגיד שאתה AI.
• אל תציג תפריטים של 1 2 3 4.
• אל תחזור על אותה שאלה.
• שאל רק שאלה אחת בכל הודעה.
• אל תיתן מחירים סופיים.
• תדבר בצורה טבעית ואנושית.

אם הלקוח אומר שלום:
ענה:
"שלום 👋 הגעתם למשה פתרונות דיגיטל. ספר לי קצת על העסק שלך ומה אתה מחפש."

אם יש מספיק מידע:
ענה:
"מעולה 👍 קיבלתי את הפרטים. משה יעבור עליהם ויחזור אליך בהקדם."
                `,
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
        aiData?.choices?.[0]?.message?.content ||
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
