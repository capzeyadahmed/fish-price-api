const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());

app.get('/api/fish-prices', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto('http://www.osa.gov.eg/ar-eg/Pages/FishPriceList.aspx', {
      waitUntil: 'domcontentloaded',
    });

    const prices = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map((row) => {
        const cells = row.querySelectorAll('td');
        const name = cells[0]?.textContent.trim();
        const min = cells[1]?.textContent.trim();
        const max = cells[2]?.textContent.trim();
        return name && min && max ? { name, price: `${min} - ${max} جنيه` } : null;
      }).filter(Boolean).filter(item => /بلطي|بوري|جمبري/i.test(item.name));
    });

    await browser.close();

    res.json({
      updatedAt: new Date().toISOString(),
      items: prices,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'فشل في جلب الأسعار باستخدام Puppeteer' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Puppeteer API running on http://localhost:${PORT}`);
});