import type { Handler, ScheduledEvent } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import puppeteer, { type Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const vermittlungscode = process.env.VERMITTLUNGS_CODE;
const plz = process.env.PLZ;
const location = process.env.LOCATION;
const targetEmail = process.env.EMAIL || '';

const client = new SESClient({});

// Optional: If you'd like to disable webgl, true is the default.
chromium.setGraphicsMode = false;

export const handler: Handler<ScheduledEvent> = async (
  event: ScheduledEvent
): Promise<void> => {
  console.log('Starting appointment check');
  let browser: Browser | undefined;
  try {
    const viewport = {
      deviceScaleFactor: 1,
      hasTouch: false,
      height: 1080,
      isLandscape: true,
      isMobile: false,
      width: 1920,
    };
    const browser = await puppeteer.launch({
      args: puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
      defaultViewport: viewport,
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });

    const page = await browser.newPage();

    console.log('Browser initialized');
    // await new Promise((r) => setTimeout(r, 1000));

    await page.goto(
      `https://www.eterminservice.de/terminservice/suche/${vermittlungscode}/${plz}/${location}`
    );

    console.log(
      'Connected to website ',
      `https://www.eterminservice.de/terminservice/suche/${vermittlungscode}/${plz}/${location}`
    );

    // await page.waitForNavigation({
    //   waitUntil: 'networkidle0',
    // });

    // await page.click(
    //   'a.cookies-info-close.col-12.col-md-4.col-xl-3.me-md-3.btn.kv-btn.btn-magenta'
    // );

    // console.log('Clicked on cookies button');

    await page.waitForSelector('.btn.kv-btn.btn-magenta.kv-btn-sm');

    const distanceLabels = await page.$$('.ets-search-filter-distance-bubble');

    console.log('got labels', distanceLabels);

    for (var label of distanceLabels) {
      const is20Label = await label.$eval('label', (element) => {
        return element.textContent === '10';
      });

      if (is20Label) {
        const span = await label.$('span');
        await span?.evaluate((s) => s.click());

        console.log('Changed area');
      }
    }

    console.log('Finshed changing area');
    await page.click('.btn.kv-btn.btn-magenta.kv-btn-sm');

    console.log('Finshed searching');

    await page.waitForSelector('.ets-search-no-results, .ets-search-results');
    // const results = await page.$('.ets-search-no-results');
    const results = await page.$('.ets-search-results');

    console.log(results);

    if (results) {
      // Send email to targetEmail
      await sendEmail();
    }
  } catch (error: any) {
    console.error('Error finding appointment', error);
  } finally {
    await browser?.close();
    console.log('Fininshed appointment check');
  }
};

async function sendEmail() {
  const subject = 'Termin available';
  const body = `https://www.eterminservice.de/terminservice/suche/${vermittlungscode}/${plz}/${location}`;

  const command = new SendEmailCommand({
    Source: targetEmail,
    Destination: {
      ToAddresses: [targetEmail],
    },
    Message: {
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: body,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
  });

  await client.send(command);
}
