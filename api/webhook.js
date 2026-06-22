export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const VERIFY_TOKEN = "moshe_verify_token";

      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
      }

      return res.status(403).send("Forbidden");
    }

    if (req.method !== "POST") {
      return res.status(405).send("Method not allowed");
    }

    console.log("FULL BODY:", JSON.stringify(req.body));

    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    console.log("MESSAGE:", JSON.stringify(message));

    if (!message) {
      console.log("NO MESSAGE FOUND");
      return res.status(200).send("No message");
    }

    const from = message.from;
    const userText = message.text?.body;

    console.log("FROM:", from);
    console.log("USER TEXT:", userText);

    if (!userText) {
      await sendWhatsAppMessage(from, "כרגע אני יודע לענות רק להודעות טקסט 🙂");
      return res.status(200).send("Non text message");
    }

    console.log("BEFORE OPENAI");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
אתה בוט WhatsApp AI של העסק "משה פתרונות דיגיטל".

אתה מדבר בעברית בלבד.
אתה לא מציג תפריט מספרים.
אתה מנהל שיחה טבעית, קצרה וברורה.
המטרה שלך היא להבין מה הלקוח צריך, לשאול שאלות המשך, ולהוביל אותו להשארת פרטים למשה.

העסק מציע:
- בניית אתרים
- דפי נחיתה
- חנויות אונליין
- בוטים לוואטסאפ
- סוכנים קוליים AI
- אוטומציות לעסקים
- חיבורי API
- מערכות ניהול ודשבורדים

אסור לתת מחיר סופי.
אם שואלים מחיר, תענה שזה תלוי בגודל הפרויקט, במערכות שצריך לחבר ובמורכבות, ומשה יוכל לתת הצעה מדויקת אחרי הבנה קצרה.

בסוף שיחה, כשיש עניין מצד הלקוח, בקש:
שם מלא
סוג העסק
מה הוא רוצה לבנות
טלפון לחזרה אם צריך

אל תגיד "משה יחזור אליך" מיד בכל הודעה.
תענה קודם בצורה חכמה לפי מה שהלקוח כתב.
            `,
          },
          {
            role: "user",
            content: userText,
          },
        ],
        temperature: 0.7,
      }),
    });

    console.log("AFTER OPENAI");

    const aiData = await openaiResponse.json();

    console.log("OPENAI:", JSON.stringify(aiData));

    let aiReply;

    if (aiData.choices?.[0]?.message?.content) {
      aiReply = aiData.choices[0].message.content;
    } else {
      console.log("OPENAI ERROR FULL:", JSON.stringify(aiData));
      aiReply = "יש לי כרגע תקלה בחיבור ל־AI. משה יחזור אליך בהקדם.";
    }

    await sendWhatsAppMessage(from, aiReply);

    return res.status(200).send("OK");
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return res.status(200).send("Error handled");
  }
}

async function sendWhatsAppMessage(to, text) {
  const url = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: text,
      },
    }),
  });

  const result = await response.json();
  console.log("WhatsApp send result:", JSON.stringify(result));
}
