import { handler } from '../src';

// Code for running locally
async function main() {
  await handler(
    {
      id: '1223',
      version: '1123',
      account: '123',
      time: '123',
      region: '123',
      resources: ['123'],
      source: '123',
      'detail-type': 'Scheduled Event',
      detail: {},
    },
    {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'testFunction',
      functionVersion: '1',
      invokedFunctionArn:
        'arn:aws:lambda:region:account-id:function:testFunction',
      memoryLimitInMB: '128',
      awsRequestId: 'testRequestId',
      logGroupName: '/aws/lambda/testFunction',
      logStreamName: '2024/06/01/[$LATEST]abcdef1234567890',
      identity: undefined,
      clientContext: undefined,
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
    },
    (error?: string | Error | null | undefined, result?: void | undefined) => {}
  );
}

main();
