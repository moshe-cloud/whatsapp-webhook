export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      status: "Webhook is working",
      success: true
    });
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
