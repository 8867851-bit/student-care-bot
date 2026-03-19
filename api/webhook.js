export default async function handler(req, res) {
  try {
    if (req.method === "GET") return res.status(200).send("OK");

    const events = req.body?.events || [];

    for (const event of events) {
      if (event.type === "message") {
        await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + process.env.CHANNEL_ACCESS_TOKEN
          },
          body: JSON.stringify({
            replyToken: event.replyToken,
            messages: [{ type: "text", text: "HELLO TEST" }]
          })
        });
      }
    }

  } catch (err) {
    console.log("ERROR:", err);
  }

  return res.status(200).send("OK");
}
