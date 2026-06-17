export default function handler(req, res) {

  if (req.method === "GET") {

    const VERIFY_TOKEN = "moshe123";

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send("Verification failed");
  }

  if (req.method === "POST") {
    console.log("Received webhook:", req.body);

    return res.status(200).json({
      received: true
    });
  }

  return res.status(405).json({
    error: "Method not allowed"
  });
}
