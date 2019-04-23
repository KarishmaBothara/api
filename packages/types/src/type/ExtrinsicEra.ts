// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import EnumType from '../codec/EnumType';
import {isHex, isU8a, hexToU8a, isObject} from '@polkadot/util';
//import U8a from '../codec/U8a';
import Null from '../primitive/Null';
import Tuple from "@polkadot/types/codec/Tuple";
import U64 from '../primitive/U64';
//import {iExtrinsicEra} from "@polkadot/types/types";
//import isHex from "@polkadot/util/is/hex";

interface EraMethod {
  enabled: boolean;
  period: U64;
  phase: U64;
  current: U64; // current blocknumber
  fromBlockNumber: boolean
}

export default class ExtrinsicEra extends EnumType<ImmortalEra | MortalEra> {
  //constructor(value?: any) {
  constructor (value: any) {
    super({ImmortalEra, MortalEra}, ExtrinsicEra.decodeExtrinsicEra(value));
  }

  private static decodeExtrinsicEra (value: EraMethod | Uint8Array | string ): ImmortalEra | MortalEra {
    if (isHex(value)) {
      return ExtrinsicEra.decodeExtrinsicEra(hexToU8a(value.toString()));
    }
    else if (isU8a(value)) {
      //const u8a = u8aToU8a(value);
      const u8a = value;
      // If we have a zero byte, it is immortal (1 byte in length), otherwise we have
      // the era details following as another byte
      //const eraDetails = u8a.subarray(0, (u8a[0] === 0) ? 1 : 2);
      if (u8a[0] === 0) {
           return new ImmortalEra();
      } else {
        const first = u8a.subarray(0, 1);
        const second = u8a.subarray(1, 2);
        const encoded = new U64(first).toNumber() + (new U64(second).toNumber() << 8);
        const period = 2 << (encoded % (1 << 4));
        const factor = 12;
        const quantize_factor = period >> factor > 1 ? period >> factor : 1;
        let phase = (encoded >> 4) * quantize_factor;
        if (period >= 4 && phase < period) {
          return new MortalEra([new U64(period), new U64(phase)]);
        }
        return new ImmortalEra();
      }
     }
     else if (isObject(value) && value.period) {
        if (!value.enabled) {
          return new ImmortalEra();
        }
        if (value.phase) {
          return new MortalEra([value.period, value.phase]);
        }
        if (value.fromBlockNumber) {
          //let period = value.period.checked_next_power_of_two()
          let period = Math.pow(2,Math.ceil(Math.log2(value.period.toNumber())));
          let phase = value.current.toNumber() % period;
          const factor = 12;
          const quantize_factor = period >> factor > 1 ? period >> factor : 1;
          let quantized_phase = phase / quantize_factor * quantize_factor;
          return new MortalEra([new U64(period), new U64(quantized_phase)]);
        }
    }
    return new ImmortalEra();
    //return new Uint8Array([0]);
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

export class ImmortalEra extends Null {
}

export type MortalEraValue = [U64, U64];

/**
 * @name ExtrinsicEra
 * @description
 * The era for an extrinsic, indicating either a mortal or immortal extrinsic
 */
export class MortalEra extends Tuple {
  //private period: AnyU8a;

  //constructor (value?: AnyU8a | string | {enabled: boolean, period: AnyU8a, phase: AnyU8a}) {
  constructor(value?: MortalEraValue) {
    super({
      period : U64, phase : U64
    }, value);
  }

  /**
   * @description The justification [[period]]
   */
  get period() : U64 {
    return this[0] as U64;
    //return this.get('period');
  }

  /**
   * @description The round this justification wraps as a [[U32]]
   */
  get phase() : U64{
    return this[1] as U64;
    //return this.get('phase');
  }

}
