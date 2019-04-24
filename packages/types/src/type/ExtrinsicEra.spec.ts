// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import ExtrinsicEra from './ExtrinsicEra';
import U64 from "@polkadot/types/primitive/U64";

describe('ExtrinsicEra', () => {

  it('decodes a Extrinsic Era from hexstring as mortal', () => {
    const mortalIndex = 1;
    const extrinsicEra = new ExtrinsicEra('0x0401000001010b00000000',mortalIndex);
    expect(extrinsicEra.asMortalEra.period.toNumber()).toBeGreaterThan(4);
    expect(extrinsicEra.asMortalEra.phase.toNumber()).toBeLessThan(extrinsicEra.asMortalEra.period.toNumber());
  });

  it('decodes a Extrinsic Era with immortal', () => {
    const immortalIndex = 0;
    const extrinsicEra = new ExtrinsicEra('0x0000000',immortalIndex);
    //expect(extrinsicEra.asImmortalEra).toEqual(null);
    expect(extrinsicEra.asMortalEra.period).toBeUndefined();
    expect(extrinsicEra.asMortalEra.phase).toBeUndefined();
  });

  it('decodes a Extrinsic Era from u8 as mortal', () => {
    const mortalIndex = 1;
    const extrinsicEra = new ExtrinsicEra(new Uint8Array([4,1,0,0,1,1,11,0,0,0,0]),mortalIndex);
    expect(extrinsicEra.asMortalEra.period.toNumber()).toBeGreaterThan(4);
    expect(extrinsicEra.asMortalEra.phase.toNumber()).toBeLessThan(extrinsicEra.asMortalEra.period.toNumber());
  });

  it('decodes a Extrinsic Era from Object with phase & period as mortal instance', () => {
    const mortalIndex = 1;
    const extrinsicEra = new ExtrinsicEra({enabled: true, period: new U64(32), phase: new U64(16)}, mortalIndex);
    expect(extrinsicEra.asMortalEra.period.toNumber()).toBeGreaterThan(4);
    expect(extrinsicEra.asMortalEra.phase.toNumber()).toBeLessThan(extrinsicEra.asMortalEra.period.toNumber());
  });

  it('decodes a Extrinsic Era from Object with blocknumber & period as mortal instance', () => {
    const mortalIndex = 1;
    const extrinsicEra = new ExtrinsicEra({isBlockNumber: true, period: new U64(17), current: new U64(16)}, mortalIndex);
    expect(extrinsicEra.asMortalEra.period.toNumber()).toBeGreaterThan(4);
    expect(extrinsicEra.asMortalEra.phase.toNumber()).toBeLessThan(extrinsicEra.asMortalEra.period.toNumber());
  });
});
