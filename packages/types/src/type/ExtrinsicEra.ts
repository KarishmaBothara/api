// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import EnumType from '../codec/EnumType';
import {isHex, isU8a, hexToU8a, isObject} from '@polkadot/util';
import Tuple from '../codec/Tuple';
import U64 from '../primitive/U64';
import U8 from '../primitive/U8';
import U16 from '../primitive/U16';
import { AnyU8a } from '../types';
import BlockNumber from "@polkadot/types/type/BlockNumber";
import U8a from "@polkadot/types/codec/U8a";

interface EraMethod {
  startBlockNumber: BlockNumber;
  endBlockNumber: BlockNumber;
}

export default class ExtrinsicEra extends EnumType<ImmortalEra | MortalEra> {
  constructor (value?: any, index?: number) {
    super({ ImmortalEra, MortalEra }, value, index);
  }

  /**
   * @description Returns the item as a [[ImmortalEra]]
   */
  get asImmortalEra (): ImmortalEra | undefined{
    if (this.index === 0) {
      return this.value as ImmortalEra;
    }
    return;
  }

  /**
   * @description Returns the item as a [[MortalEra]]
   */
  get asMortalEra (): MortalEra | undefined {
    if (this.index === 1) {
       return this.value as MortalEra;
    }
    return;
  }

  /**
   * @description Encodes the value as a Uint8Array as per the parity-codec specifications
   * @param isBare true when the value has none of the type-specific prefixes (internal)
   */
  toU8a (isBare?: boolean): Uint8Array {
    if (this.index === 0 ) {
      return super.toU8a()
    } else {
      return (this.asMortalEra as MortalEra).toU8a(isBare);
    }
  }
}

export class ImmortalEra extends U8a {
  constructor(value?: AnyU8a) {
    super(value);
  }
}

export type MortalEraValue = [U8, U8];

/**
 * @name MortalEra
 * @description
 * The MortalEra for an extrinsic, indicating period and phase
 */
export class MortalEra extends Tuple {
  constructor (value?: any) {
    super({
      period : U8, phase : U8
    }, MortalEra.decodeMortalEra(value));
  }

  private static decodeMortalEra (value: EraMethod | Uint8Array | string): MortalEraValue {
    if (isHex(value)) {
      return MortalEra.decodeMortalEra(hexToU8a(value.toString()));
    } else if (isU8a(value)) {
      const u8a = value;
      const first = u8a.subarray(0, 1);
      let second = u8a.subarray(1, 2);
      const encoded = new U64(new U64(first).toNumber() + (new U64(second).toNumber() << 8));
      const period = new U64(2 << (encoded.toNumber() % (1 << 4)));
      const factor = 12;
      const quantizeFactor = Math.max(period.toNumber() >> factor, 1);
      let phase = (encoded.toNumber() >> 4) * quantizeFactor;
      if (period.toNumber() >= 4 && phase < period.toNumber()) {
        return [new U8(period), new U8(phase)];
      }
      throw new Error('Invalid data passed to Mortal era');
    } else if (isObject(value)) {
        const current = value.startBlockNumber;
        const period = value.endBlockNumber.toNumber() - value.startBlockNumber.toNumber();
        let calPeriod = Math.pow(2, Math.ceil(Math.log2(period)));
        calPeriod = Math.min( Math.max(calPeriod, 4), 1<< 16);
        const phase = current.toNumber() % calPeriod;
        const factor = 12;
        const quantizeFactor = calPeriod >> factor > 1 ? calPeriod >> factor : 1;
        let quantizedPhase = phase / quantizeFactor * quantizeFactor;
        return [new U8(calPeriod), new U8(quantizedPhase)];
    }
    return [new U8(), new U8()];
  }
  /**
   * @description The justification [[U64]]
   */
  get period (): U8 {
    return this[0] as U8;
  }

  /**
   * @description The round this justification wraps as a [[U64]]
   */
  get phase (): U8 {
    return this[1] as U8;
  }

  /**
   * @description Encodes the value as a Uint8Array as per the parity-codec specifications
   * @param isBare true when the value has none of the type-specific prefixes (internal)
   */
  toU8a (isBare?: boolean): Uint8Array {

    const period = new U64(this.period);
    const phase = new U64(this.phase);
    const quantize_factor = Math.max(period.toNumber() >> 12, 1);
    const trailingZeros = this.getTrailingZeros(period);
    const encoded = Math.min(15, Math.max(1, trailingZeros - 1)) + (((phase.toNumber() / quantize_factor) << 4));
    const encode = new U16(encoded);
    const first = encode.toNumber() >> 8;
    const second = encode.toNumber() & 0xff;
    return new Uint8Array([second, first]);
  }

  getTrailingZeros(period: U64) {
    let zeros = '';
    let periodN = period.toNumber();
    periodN = parseInt(Number(periodN).toString(2));
    //periodN = periodN.toString(2)

    while (periodN % 10 == 0) {
      periodN = periodN /= 10;
      zeros += 0;
    }
    return zeros.length;
  }


  birth(current: U64) {
    const b =  Math.floor((Math.max(current.toNumber(),this.phase.toNumber()) - this.phase.toNumber()) / this.period.toNumber()) * this.period.toNumber() + this.phase.toNumber();
    return new U64(b);
  }

}
