// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import ExtrinsicEra, { MortalEra } from './ExtrinsicEra';
import U64 from '../primitive/U64';

describe('ExtrinsicEra', () => {

  it('decodes an Extrinsic Era with immortal', () => {
    const extrinsicEra = new ExtrinsicEra(new Uint8Array([0,0,0]));
    expect(extrinsicEra.mortalEra.period).toBeUndefined();
    expect(extrinsicEra.mortalEra.phase).toBeUndefined();
  });

  it('decodes an Extrinsic Era from u8 as mortal', () => {
    const extrinsicEra = new ExtrinsicEra(new Uint8Array([1,4,1,0,0,1,1,11,0,0,0,0]));
    expect(extrinsicEra.mortalEra.period.toNumber()).toBeGreaterThan(4);
    expect(extrinsicEra.mortalEra.phase.toNumber()).toBeLessThan(extrinsicEra.mortalEra.period.toNumber());
  });

  it('encode an Extrinsic Era from Object with phase & period as mortal instance', () => {
    const mortalIndex = 1;
    const extrinsicEra = new ExtrinsicEra(new MortalEra({ period: new U64(32), phase: new U64(16) }), mortalIndex);
    expect(extrinsicEra.mortalEra.period.toNumber()).toBeGreaterThan(4);
    expect(extrinsicEra.mortalEra.phase.toNumber()).toBeLessThan(extrinsicEra.mortalEra.period.toNumber());
  });

  it('encode an Extrinsic Era from Object with blocknumber & period as mortal instance', () => {
    const mortalIndex = 1;
    const extrinsicEra = new ExtrinsicEra(new MortalEra({ isBlockNumber: true, period: new U64(17), current: new U64(16) }), mortalIndex);
    expect(extrinsicEra.mortalEra.period.toNumber()).toBeGreaterThan(4);
    expect(extrinsicEra.mortalEra.phase.toNumber()).toBeLessThan(extrinsicEra.mortalEra.period.toNumber());
  });
});
