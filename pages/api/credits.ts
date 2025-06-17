import { getAuth } from "@clerk/nextjs/server";
import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const FILE = path.resolve("./data/credits.json");
type Row = {
  userId: string;
  images: number;
  seconds: number;
  balanceUsd: number;
};

const read = (): Row[] =>
  fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : [];
const write = (rows: Row[]) =>
  fs.writeFileSync(FILE, JSON.stringify(rows, null, 2));

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const db = read();
  let row = db.find((r) => r.userId === userId);

  // init row if first-time sign-in
  if (!row) {
    row = { userId, images: 0, seconds: 0, balanceUsd: 3 }; // $3 promo
    db.push(row);
    write(db);
  }

  if (req.method === "POST") {
    const { deltaImages = 0, deltaSeconds = 0, deltaUsd = 0 } = req.body;
    row.images += deltaImages;
    row.seconds += deltaSeconds;
    row.balanceUsd += deltaUsd;
    write(db);
    return res.status(200).json(row);
  }

  // GET
  res.json({
    imagesUsed: row.images,
    imageCap: Math.floor(row.balanceUsd / 0.1) * 1, // 0.10/img
    secondsUsed: row.seconds,
    secondCap: Math.floor(row.balanceUsd / 0.1) * 10, // $0.10 buys 10 s (fast)
    balanceUsd: row.balanceUsd.toFixed(2),
  });
}
