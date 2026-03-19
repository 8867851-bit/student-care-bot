export default async function handler(req, res) {
  console.log("🔥 HIT WEBHOOK");

  return res.status(200).send("OK");
}
