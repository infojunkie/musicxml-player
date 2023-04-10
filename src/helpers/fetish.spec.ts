import sinon from 'sinon';
import { expect, use as chaiUse } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { fetish } from './fetish';
chaiUse(chaiAsPromised);

function jsonNotOk() {
  const mockResponse = new global.Response('not found', {
    status: 404,
    statusText: 'not found',
  });
  return Promise.resolve(mockResponse);
}

function jsonOk() {
  const mockResponse = new global.Response('found', {
    status: 200,
  });
  return Promise.resolve(mockResponse);
}

describe('fetish', async () => {
  beforeEach(() => {
    const stub = sinon.stub(global, 'fetch');
    stub.onCall(0).returns(jsonNotOk());
    stub.onCall(1).returns(jsonOk());
  });

  afterEach(() => {
    global.fetch.restore();
  });

  it('should throw if not ok', async () => {
    await expect(fetish('call(0)')).to.be.rejectedWith(Error);
    await expect(fetish('call(1)')).to.be.fulfilled;
  });
});
