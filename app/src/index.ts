import type { Handler, ScheduledEvent } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import puppeteer, { type Browser } from 'puppeteer';

const isHeadless = process.env.IS_HEADLESS;
const vermittlungscode = process.env.VERMITTLUNGS_CODE;
const plz = process.env.PLZ;
const location = process.env.LOCATION;
const targetEmail = process.env.EMAIL || '';

const client = new SESClient({});

export const handler: Handler<ScheduledEvent> = async (
  event: ScheduledEvent
): Promise<void> => {
  console.log('Starting appointment check');
  let browser: Browser | undefined;
  try {
    browser = await puppeteer.launch({
      headless: !!isHeadless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.goto(
      `https://www.eterminservice.de/terminservice/suche/${vermittlungscode}/${plz}/${location}`
    );

    await page.waitForNavigation({
      waitUntil: 'networkidle0',
    });

    await page.click(
      'a.cookies-info-close.col-12.col-md-4.col-xl-3.me-md-3.btn.kv-btn.btn-magenta'
    );

    const distanceLabels = await page.$$('.ets-search-filter-distance-bubble');

    for (var label of distanceLabels) {
      const is20Label = await label.$eval('label', (element) => {
        return element.textContent === '10';
      });

      if (is20Label) {
        const span = await label.$('span');
        await span?.evaluate((s) => s.click());
      }
    }

    await page.click('.btn.kv-btn.btn-magenta.kv-btn-sm');

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
