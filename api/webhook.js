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
            "Authorization": "Bearer " + process.env.Twl8isjL5FrRh1GMuI7eNURUzeRGykim+Pm6KwgcTt13QEkEe+wCk5k3MVL01MuQbKHhaxMC/GOTnHAJsMuT0s6M28wzzSyaziQG5cPinEs204WutcFmbYIv2ZxiCVwLUrWI53TA5LtG4AEWxUt05wdB04t89/1O/w1cDnyilFU=
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
