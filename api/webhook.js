export default async function handler(req, res) {
  try {
    console.log("REQ BODY:", req.body);

    if (req.method === "GET") return res.status(200).send("OK");

    if (!req.body || !req.body.events) {
      return res.status(200).send("NO EVENTS");
    }

    return res.status(200).send("OK");

  } catch (err) {
    console.log("ERROR:", err);
    return res.status(200).send("ERROR BUT OK");
  }
}
