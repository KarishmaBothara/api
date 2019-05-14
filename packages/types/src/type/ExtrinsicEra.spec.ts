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
    const extrinsicEra = new ExtrinsicEra(new Uint8Array([11, 125]));
    expect(extrinsicEra.mortalEra.period.toNumber()).toEqual(4068);
    expect(extrinsicEra.mortalEra.phase.toNumber()).toEqual(2000);
  });


  it.only('encode an Extrinsic Era from Object with blocknumber & period as mortal instance', () => {
    const mortalIndex = 1;
    const extrinsicEra = new ExtrinsicEra({ startBlockNumber: new U64(1400), endBlockNumber: new U64(1600) }, mortalIndex);
    console.log('era', extrinsicEra.toU8a().join(','))
    expect(extrinsicEra.mortalEra.period.toNumber()).toBeGreaterThan(4);
    expect(extrinsicEra.mortalEra.period.toNumber()).toEqual(256);
    expect(extrinsicEra.mortalEra.phase.toNumber()).toEqual(120);
  });
});
