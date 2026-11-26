export default function handler(req, res) {
  res.status(200).json({ authRequired: !!process.env.ACCESS_KEY });
}
