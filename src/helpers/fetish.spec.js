import sinon from 'sinon';
import chai, { expect } from '@esm-bundle/chai';
import chaiAsPromised from '@esm-bundle/chai-as-promised';
import { fetish } from '../../dist/musicxml-player.esm';

chai.use(chaiAsPromised);

function jsonNotOk() {
  const mockResponse = new window.Response('not found', {
    status: 404,
    statusText: 'not found',
  });
  return Promise.resolve(mockResponse);
}

function jsonOk() {
  const mockResponse = new window.Response('found', {
    status: 200,
  });
  return Promise.resolve(mockResponse);
}

describe('fetish', async () => {
  beforeEach(() => {
    const stub = sinon.stub(window, 'fetch');
    stub.onCall(0).returns(jsonNotOk());
    stub.onCall(1).returns(jsonOk());
  });

  afterEach(() => {
    window.fetch.restore();
  });

  it('should throw if not ok', async () => {
    await expect(fetish('call(0)')).to.be.rejectedWith(Error);
    await expect(fetish('call(1)')).to.be.fulfilled;
  });
});
