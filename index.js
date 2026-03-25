const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// 🔥 PASARAN
const PASARAN = {
  "m17": "TOTO MACAU 4D",
  "m51": "TOTO MACAU 5D",
  "m83": "KINGKONG 4D",
  "p13860": "SINGAPORE",
  "p13855": "HONGKONG",
  "p13851": "CAMBODIA",
  "p15472": "JAPAN"
  // bisa tambah sisanya kalau mau
};

let cache = {};

// 🔄 SCRAPE FINAL
async function scrape(kode) {
  try {
    const url = `https://mainkartu.com/history/result/${kode}/kosong`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const todayStr = new Date().toISOString().split("T")[0];

    let found = null;

    $("table tbody tr").each((i, el) => {

      const cols = $(el).find("td");
      if (cols.length < 4) return;

      let tanggalText = cols.eq(2).text().trim();
      let angka = cols.eq(3).text().trim();

      // 🔥 FIX MACAU / KINGKONG
      if (kode.startsWith("m")) {
        angka = cols.eq(2).text().trim();
        tanggalText = cols.eq(1).text().trim();
      }

      if (!tanggalText) return;

      let [tanggal, jam] = tanggalText.split("|").map(x => x.trim());

      if (!tanggal || !jam) return;
      if (tanggal !== todayStr) return;

      found = { tanggal, jam, angka };
      return false;
    });

    if (!found) return;

    const { tanggal, jam, angka } = found;

    // 🔥 HITUNG MANUAL (ANTI TIMEZONE BUG)
    const now = new Date();
    const nowWIB = new Date(now.getTime() + (7 * 60 * 60 * 1000));

    const [h, m] = jam.split(":").map(Number);

    const resultMinutes = h * 60 + m;
    const nowMinutes = nowWIB.getHours() * 60 + nowWIB.getMinutes();

    let diffMinutes = nowMinutes - resultMinutes;
    if (diffMinutes < 0) diffMinutes += 1440;

    let waktuLalu =
      diffMinutes < 1 ? "baru saja" :
      diffMinutes < 60 ? `${diffMinutes} menit lalu` :
      `${Math.floor(diffMinutes / 60)} jam lalu`;

    const newData = {
      kode,
      pasaran: PASARAN[kode],
      angka,
      tanggal,
      jam,
      status: diffMinutes < 60 ? "SUDAH" : "MENUNGGU",
      selisihMenit: diffMinutes,
      waktuLalu,
      updated: new Date()
    };

    const old = cache[kode];
    cache[kode] = newData;

    // 🔥 REALTIME PUSH
    if (!old || old.angka !== newData.angka) {
      io.emit("update", newData);
      console.log("🔥 UPDATE:", kode, angka);
    }

  } catch (err) {
    console.log("Error:", kode);
  }
}

// 🔁 LOOP CEPAT
setInterval(() => {
  Object.keys(PASARAN).forEach(scrape);
}, 2000);

// API
app.get("/api", (req, res) => {
  res.json(cache[req.query.kode] || {});
});

// socket
io.on("connection", (socket) => {
  console.log("⚡ Client connect");
  socket.emit("init", cache);
});

// start
server.listen(PORT, () => {
  console.log("🚀 Backend realtime aktif di port " + PORT);
});
