export default async function handler(req, res) {

  const VERIFY_TOKEN = "moshe123";

  // אימות Meta
  if (req.method === "GET") {

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send("Verification failed");
  }

  // קבלת הודעות ושליחת תשובה
  if (req.method === "POST") {

    console.log("Received webhook:", JSON.stringify(req.body));

    try {

      const entry = req.body.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];

      if (message) {

        const from = message.from;

        await fetch(
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
                body: "שלום משה 👋 ההודעה התקבלה בהצלחה!"
              }
            })
          }
        );
      }

      return res.status(200).json({
        success: true
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        error: error.message
      });
    }
  }

  return res.status(405).json({
    error: "Method not allowed"
  });
}
