// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AnyU8a } from '../types';
import EnumType from '../codec/EnumType';
import {u8aToU8a, isHex, isObject, isU8a, hexToU8a} from '@polkadot/util';
import U8a from '../codec/U8a';
import U64 from '../primitive/U64';
//import {iExtrinsicEra} from "@polkadot/types/types";
//import isHex from "@polkadot/util/is/hex";


export default class ExtrinsicEra extends EnumType<ImmortalEra | MortalEra> {
  constructor(value?: any) {
    super({ImmortalEra, MortalEra}, value);
  }
  /**
   * @description Returns the item as a [[ImmortalEra]]
   */
  get asImmortalEra (): ImmortalEra {
    return this.value as ImmortalEra;
  }

  /**
   * @description Returns the item as a [[MortalEra]]
   */
  get asMortalEra (): MortalEra {
    return this.value as MortalEra;
  }
}
//const a: ExtrinsicEra;

export class ImmortalEra extends U8a {

}
/**
 * @name ExtrinsicEra
 * @description
 * The era for an extrinsic, indicating either a mortal or immortal extrinsic
 */
export class MortalEra extends U8a {
  constructor (value?: AnyU8a | string | {enabled: boolean, period: AnyU8a, phase: AnyU8a}) {
    super(
      MortalEra.decodeExtrinsicEra(value)
    );
  }

//{enabled: boolean, period: AnyU8a, phase: AnyU8a}

  static decodeExtrinsicEra (value?: AnyU8a | string | {'enabled': boolean, 'period': AnyU8a, phase: AnyU8a}): Uint8Array {
    if (isHex(value)) {
      return MortalEra.decodeExtrinsicEra(hexToU8a(value.toString()));
    }
    else if (isU8a(value)) {
      const u8a = u8aToU8a(value);

      // If we have a zero byte, it is immortal (1 byte in length), otherwise we have
      // the era details following as another byte
      const eraDetails = u8a.subarray(0, (u8a[0] === 0) ? 1 : 2);
      if (u8a[0] === 0) {
        return MortalEra.decodeExtrinsicEra({enabled: false, period: new U8a('0'), phase: new U8a('0')});
      } else {
          let first = u8a.subarray(0, 1);
          let encoded = first as U64 + u8a.subarray(0, 1)

          /*let encoded = first as u64 + ((input.read_byte()? as u64) << 8);
    let period = 2 << (encoded % (1 << 4));
    let quantize_factor = (period >> 12).max(1);
    let phase = (encoded >> 4) * quantize_factor;
    if period >= 4 && phase < period {
      Some(Era::Mortal(period, phase))*/
        return MortalEra.decodeExtrinsicEra(eraDetails);
      }
    } else  {
      const min_period = 4;
      const enabled : boolean = value.enabled;
      const period = value.period;
      const phase = value.phase;
      if (enabled == true && period >= min_period && phase < period) {
        const factor = 12;
        const quantize_factor = period >> factor > 1 ? period >> factor : 1;
        const quantized_phase = phase / quantize_factor * quantize_factor;
        //return quantized_phase;
      }
    }
    return new Uint8Array([0]);
  }
}

impl Era {
  /// Create a new era based on a period (which should be a power of two between 4 and 65536 inclusive)
  /// and a block number on which it should start (or, for long periods, be shortly after the start).
  pub fn mortal(period: u64, current: u64) -> Self {
    let period = period.checked_next_power_of_two()
      .unwrap_or(1 << 16)
      .max(4)
      .min(1 << 16);
    let phase = current % period;
    let quantize_factor = (period >> 12).max(1);
    let quantized_phase = phase / quantize_factor * quantize_factor;

    Era::Mortal(period, quantized_phase)
  }

  /// Create an "immortal" transaction.
  pub fn immortal() -> Self {
    Era::Immortal
  }

  /// `true` if this is an immortal transaction.
  pub fn is_immortal(&self) -> bool {
    match self {
      Era::Immortal => true,
        _ => false,
    }
  }

  /// Get the block number of the start of the era whose properties this object
  /// describes that `current` belongs to.
  pub fn birth(self, current: u64) -> u64 {
    match self {
      Era::Immortal => 0,
        Era::Mortal(period, phase) => (current.max(phase) - phase) / period * period + phase,
    }
  }

  /// Get the block number of the first block at which the era has ended.
  pub fn death(self, current: u64) -> u64 {
    match self {
      Era::Immortal => u64::max_value(),
        Era::Mortal(period, _) => self.birth(current) + period,
    }
  }
}

impl Encode for Era {
  fn encode_to<T: Output>(&self, output: &mut T) {
    match self {
      Era::Immortal => output.push_byte(0),
        Era::Mortal(period, phase) => {
        let quantize_factor = (*period as u64 >> 12).max(1);
        let encoded = (period.trailing_zeros() - 1).max(1).min(15) as u16 | ((phase / quantize_factor) << 4) as u16;
        output.push(&encoded);
      }
    }
  }
}

impl Decode for Era {
  fn decode<I: Input>(input: &mut I) -> Option<Self> {
    let first = input.read_byte()?;
  if first == 0 {
    Some(Era::Immortal)
  } else {
    let encoded = first as u64 + ((input.read_byte()? as u64) << 8);
    let period = 2 << (encoded % (1 << 4));
    let quantize_factor = (period >> 12).max(1);
    let phase = (encoded >> 4) * quantize_factor;
    if period >= 4 && phase < period {
      Some(Era::Mortal(period, phase))
    } else {
      None
    }
  }
}
}

#[cfg(test)]
mod tests {
  use super::*;

#[test]
  fn immortal_works() {
    let e = Era::immortal();
    assert_eq!(e.birth(0), 0);
    assert_eq!(e.death(0), u64::max_value());
    assert_eq!(e.birth(1), 0);
    assert_eq!(e.death(1), u64::max_value());
    assert_eq!(e.birth(u64::max_value()), 0);
    assert_eq!(e.death(u64::max_value()), u64::max_value());
    assert!(e.is_immortal());

    assert_eq!(e.encode(), vec![0u8]);
    assert_eq!(e, Era::decode(&mut&[0u8][..]).unwrap());
  }

#[test]
  fn mortal_codec_works() {
    let e = Era::mortal(64, 42);
    assert!(!e.is_immortal());

    let expected = vec![5 + 42 % 16 * 16, 42 / 16];
    assert_eq!(e.encode(), expected);
    assert_eq!(e, Era::decode(&mut&expected[..]).unwrap());
  }

#[test]
  fn long_period_mortal_codec_works() {
    let e = Era::mortal(32768, 20000);

    let expected = vec![(14 + 2500 % 16 * 16) as u8, (2500 / 16) as u8];
    assert_eq!(e.encode(), expected);
    assert_eq!(e, Era::decode(&mut&expected[..]).unwrap());
  }

#[test]
  fn era_initialisation_works() {
    assert_eq!(Era::mortal(64, 42), Era::Mortal(64, 42));
    assert_eq!(Era::mortal(32768, 20000), Era::Mortal(32768, 20000));
    assert_eq!(Era::mortal(200, 513), Era::Mortal(256, 1));
    assert_eq!(Era::mortal(2, 1), Era::Mortal(4, 1));
    assert_eq!(Era::mortal(4, 5), Era::Mortal(4, 1));
  }

#[test]
  fn quantised_clamped_era_initialisation_works() {
    // clamp 1000000 to 65536, quantise 1000001 % 65536 to the nearest 4
    assert_eq!(Era::mortal(1000000, 1000001), Era::Mortal(65536, 1000001 % 65536 / 4 * 4));
  }

#[test]
  fn mortal_birth_death_works() {
    let e = Era::mortal(4, 6);
    for i in 6..10 {
      assert_eq!(e.birth(i), 6);
      assert_eq!(e.death(i), 10);
    }

    // wrong because it's outside of the (current...current + period) range
    assert_ne!(e.birth(10), 6);
    assert_ne!(e.birth(5), 6);
  }

#[test]
  fn current_less_than_phase() {
    // should not panic
    Era::mortal(4, 3).birth(1);
  }
}

*
* */
