const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
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

// 🔄 SCRAPE FUNCTION (FIX LOGIKA)
async function scrape(kode) {
  try {
    const url = `https://mainkartu.com/history/result/${kode}/kosong`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const row = $("table tbody tr").first();

    const tanggalText = row.find("td").eq(2).text().trim();
    const nomor = row.find("td").eq(3).text().trim();

    const waktu = tanggalText.replace("|", "").trim();
    const resultTime = new Date(waktu);

    const now = new Date();
    const diffMinutes = (now - resultTime) / 60000;

    const old = cache[kode]; // 🔥 ambil data lama

    let status = "BELUM";

    // ❌ kalau data lama → tunggu
    if (diffMinutes >= 60) {
      status = "MENUNGGU";
    } else {
      // 🔥 compare angka lama vs baru
      if (old && old.angka !== nomor) {
        status = "NAIK";
      } else {
        status = "BELUM";
      }
    }

    // ✅ update cache setelah compare
    cache[kode] = {
      kode,
      pasaran: PASARAN[kode],
      angka: nomor,
      waktu: resultTime,
      status,
      selisihMenit: Math.floor(diffMinutes),
      updated: new Date()
    };

  } catch (err) {
    console.log("Error:", kode);
  }
}

// 🚀 FIRST LOAD (BIAR LANGSUNG ADA DATA)
Object.keys(PASARAN).forEach(kode => scrape(kode));

// 🔁 AUTO SCRAPE
setInterval(() => {
  Object.keys(PASARAN).forEach(kode => scrape(kode));
}, 10000);

// 📡 API SINGLE
app.get("/check/:kode", (req, res) => {
  const kode = req.params.kode;
  res.json(cache[kode] || { status: "LOADING..." });
});

// 📡 API ALL
app.get("/all", (req, res) => {
  res.json(cache);
});

// ❤️ ROOT
app.get("/", (req, res) => {
  res.send("Server aktif 🚀");
});

// 🔥 AUTO PING (ANTI SLEEP)
setInterval(() => {
  const url = process.env.RAILWAY_STATIC_URL || "http://localhost:" + PORT;
  axios.get(url).catch(() => {});
}, 300000);

app.listen(PORT, () => {
  console.log("Server jalan di port " + PORT);
});
