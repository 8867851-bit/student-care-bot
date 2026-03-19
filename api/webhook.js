export default async function handler(req, res) {
  try {

    const body = req.body;

    if (!body.events) {
      return res.status(200).send("OK");
    }

    for (const event of body.events) {

      if (event.type === "message") {

        const userText = event.message.text;

        const payload = {
          caseId: Date.now(),
          userId: event.source.userId,
          q1: userText,
          q2: "-",
          q3: "-",
          q4: "-",
          q5: "-",
          level: "yellow"
        };

        await fetch("https://script.google.com/macros/s/AKfycbz5Kxx0piGkUdofEno-fwVUe3d71dxrwKUkpDp8GF6nKKiKqTaQZmskflcdV8-gptg7GQ/exec", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

      }
    }

    res.status(200).send("OK");

  } catch (err) {
    res.status(200).send("OK");
  }
}
