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
    console.log("Received webhook:", JSON.stringify(req.body));

    try {
      const message =
        req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!message) {
        console.log("No message found in webhook");
        return res.status(200).json({ success: true });
      }

      const from = message.from;
      console.log("Replying to:", from);

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
              body: "שלום 👋 זה הבוט של משה. ההודעה התקבלה בהצלחה!"
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
