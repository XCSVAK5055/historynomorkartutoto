const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

const PASARAN = {
"m17": "TOTO MACAU 4D",
  "m51": "TOTO MACAU 5D",
  "m83": "KINGKONG 4D",
  "p13863": "TOTO BEIJING",
  "p13852": "CHINA",
  "p13851": "CAMBODIA",
  "p13855": "HONGKONG",
  "p13860": "SINGAPORE",
  "p13862": "TAIWAN",
  "p13861": "SYDNEY",
  "p13859": "ROMA",
  "p13856": "MADRID",
  "p28515": "JEJULOTTO",
  "p28516": "TOTO FUZHOU",
  "p30102": "TAICHUNG",
  "p30100": "KOWLOON",
  "p30097": "CHONGQING",
  "p30095": "CHENGDU",
  "p30093": "FOSHAN",
  "p30092": "ECUADOR",
  "p30091": "CUBA",
  "p30090": "MONACO",
  "p28518": "TORONTO",
  "p28517": "BHUTAN",
  "p28514": "LAOS",
  "p28513": "HUNGARY",
  "p28512": "BULGARIA",
  "p18913": "CALIFORNIA",
  "p18909": "OREGON 12",
  "p18910": "OREGON 09",
  "p18912": "OREGON 06",
  "p18911": "OREGON 03",
  "p18902": "NEWYORK MID",
  "p18901": "NEWYORK EVE",
  "p18903": "FLORIDA MID",
  "p18904": "FLORIDA EVE",
  "p18906": "KENTUCKY MID",
  "p18905": "KENTUCKY EVE",
  "p18908": "CAROLINA DAY",
  "p18907": "CAROLINA EVE",
  "p13857": "MIAMI",
  "p13858": "PHILIPPINES",
  "p13853": "CYPRUS",
  "p13854": "GUANGDONG",
  "p13864": "TURIN",
  "p15472": "JAPAN",
  "p15473": "ICELAND",
  "p30531": "OSLO",
  "p30527": "ITALY",
  "p30528": "FRANCE",
  "p30529": "CHILE",
  "p30530": "MEXICO",
  "p30105": "DENVER",
  "p30104": "HAITI"
};

let cache = {};

// 🔄 SCRAPE + EMIT REALTIME
async function scrape(kode) {
  try {
    const url = `https://mainkartu.com/history/result/${kode}/kosong`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const row = $("table tbody tr").first();

    const tanggalText = row.find("td").eq(2).text().trim();
    const nomor = row.find("td").eq(3).text().trim();

    const waktuStr = tanggalText.replace("|", "").trim();
    const resultTime = new Date(waktuStr);

    const now = new Date(Date.now() + (7 * 60 * 60 * 1000));
    let diffMinutes = (now - resultTime) / 60000;
    if (diffMinutes < 0) diffMinutes = Math.abs(diffMinutes);

    let status = diffMinutes < 60 ? "SUDAH" : "MENUNGGU";

    const old = cache[kode];

    cache[kode] = {
      kode,
      pasaran: PASARAN[kode],
      angka: nomor,
      waktu: resultTime,
      status,
      selisihMenit: Math.floor(diffMinutes)
    };

    // 🔥 KALAU ADA PERUBAHAN → KIRIM KE CLIENT
    if (!old || old.angka !== nomor) {
      io.emit("update", cache[kode]);
    }

  } catch (err) {
    console.log("Error:", kode);
  }
}

// 🔁 LOOP CEPAT (5 detik)
setInterval(() => {
  Object.keys(PASARAN).forEach(scrape);
}, 5000);

// SOCKET CONNECT
io.on("connection", (socket) => {
  console.log("Client connect");

  // kirim semua data awal
  socket.emit("init", cache);
});

// API fallback
app.get("/check/:kode", (req, res) => {
  res.json(cache[req.params.kode] || {});
});

server.listen(PORT, () => {
  console.log("Realtime server jalan 🔥");
});
