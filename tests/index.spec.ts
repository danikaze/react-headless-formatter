import { describe, it } from 'mocha';
import { assert } from 'chai';
import { foobar } from '@src';

describe('#foobar test', () => {
  it('should not fail ^^', () => {
    assert.exists(foobar);
    assert.doesNotThrow(foobar);
  });
});
