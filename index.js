const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🔥 FULL PASARAN
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

// 🔄 SCRAPE FUNCTION
async function scrape(kode) {
  try {
    const url = `https://mainkartu.com/history/result/${kode}/kosong`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const row = $("table tbody tr").first();

    const tanggalText = row.find("td").eq(2).text().trim();
    const nomor = row.find("td").eq(3).text().trim();

    const [tanggal, jam] = tanggalText.split("|").map(x => x.trim());

    const resultTime = new Date(`${tanggal} ${jam}`);

    // 🔥 FIX TIMEZONE WIB
    const now = new Date(Date.now() + (7 * 60 * 60 * 1000));

    let diffMs = now - resultTime;
    if (diffMs < 0) diffMs = Math.abs(diffMs);

    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);

    // 🔥 FORMAT HUMAN TIME
    let waktuLalu = "";
    if (diffMinutes < 1) waktuLalu = "baru saja";
    else if (diffMinutes < 60) waktuLalu = `${diffMinutes} menit lalu`;
    else if (diffHours < 24) waktuLalu = `${diffHours} jam lalu`;
    else waktuLalu = `${Math.floor(diffHours / 24)} hari lalu`;

    // 🔥 STATUS FINAL
    let status = diffMinutes < 60 ? "SUDAH" : "MENUNGGU";

    cache[kode] = {
      kode,
      pasaran: PASARAN[kode],
      angka: nomor,
      tanggal,
      jam,
      waktu: resultTime,
      status,
      selisihMenit: diffMinutes,
      waktuLalu,
      updated: new Date()
    };

  } catch (err) {
    console.log("Error:", kode);
  }
}

// 🔥 FIRST LOAD
Object.keys(PASARAN).forEach(scrape);

// 🔁 AUTO SCRAPE (5 DETIK)
setInterval(() => {
  Object.keys(PASARAN).forEach(scrape);
}, 5000);

// ✅ API FIX (EDGEONE FRIENDLY)
app.get("/api", (req, res) => {
  const kode = req.query.kode;

  if (!kode) {
    return res.json({ error: "kode kosong" });
  }

  res.json(cache[kode] || {});
});

// 📡 OPTIONAL (DEBUG)
app.get("/all", (req, res) => {
  res.json(cache);
});

// ❤️ ROOT
app.get("/", (req, res) => {
  res.send("Server aktif 🚀");
});

// 🚀 START
app.listen(PORT, () => {
  console.log("🔥 Server jalan di port " + PORT);
});
