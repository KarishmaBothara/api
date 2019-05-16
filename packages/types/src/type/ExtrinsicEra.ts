// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import EnumType from '../codec/EnumType';
import { isHex, isU8a, hexToU8a, isObject, assert, u8aToBn } from '@polkadot/util';
import Tuple from '../codec/Tuple';
import U8 from '../primitive/U8';
import { AnyU8a } from '../types';
import U8a from '../codec/U8a';

/**
 * @name ExtrinsicEra
 * @description
 * The era for an extrinsic, indicating either a mortal or immortal extrinsic
 */
export default class ExtrinsicEra extends EnumType<ImmortalEra | MortalEra> {
  constructor (value?: any, index?: number) {
    super({ ImmortalEra, MortalEra }, value, index);
  }

  /**
   * @description Returns the item as a [[ImmortalEra]]
   */
  get asImmortalEra (): ImmortalEra {
    assert(this.isImmortalEra, `Cannot convert '${this.type}' via asImmortalEra`);
    return this.value as ImmortalEra;
  }

  /**
   * @description Returns the item as a [[MortalEra]]
   */
  get asMortalEra (): MortalEra {
    assert(this.isMortalEra, `Cannot convert '${this.type}' via asMortalEra`);
    return this.value as MortalEra;
  }

  /**
   * @description `true` if Immortal
   */
  get isImmortalEra (): boolean {
    return this.index === 0;
  }

  /**
   * @description `true` if Mortal
   */
  get isMortalEra (): boolean {
    return this.index === 1;
  }

  /**
   * @description Encodes the value as a Uint8Array as per the parity-codec specifications
   * @param isBare true when the value has none of the type-specific prefixes (internal)
   */
  toU8a (isBare?: boolean): Uint8Array {
    if (this.index === 0) {
      return super.toU8a();
    } else {
      return this.asMortalEra.toU8a(isBare);
    }
  }
}

const VALID_IMMORTAL = new U8a([]);
/**
 * @name ImmortalEra
 * @description
 * The ImmortalEra for an extrinsic
 */
export class ImmortalEra extends U8a {
  constructor (value?: AnyU8a) {
    super(value);

    assert(this.eq(VALID_IMMORTAL), `IMMORTAL: expected ${VALID_IMMORTAL.toHex()}, found ${this.toHex()}`);
  }
}

export type MortalEraValue = [U8, U8];

interface MortalMethod {
  current: number;
  period: number;
}

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

  private static decodeMortalEra (value: MortalMethod | Uint8Array | string): MortalEraValue {
    if (isHex(value)) {
      return MortalEra.decodeMortalEra(hexToU8a(value.toString()));
    } else if (isU8a(value)) {
      const first = u8aToBn(value.subarray(0, 1)).toNumber();
      let second = u8aToBn(value.subarray(1, 2)).toNumber();
      const encoded: number = first + (second << 8);
      const period = 2 << (encoded % (1 << 4));
      const quantizeFactor = Math.max(period >> 12, 1);
      let phase = (encoded >> 4) * quantizeFactor;
      if (period >= 4 && phase < period) {
        return [new U8(period), new U8(phase)];
      }
      throw new Error('Invalid data passed to Mortal era');
    } else if (isObject(value)) {
      const { current } = value;
      const { period } = value;
      let calPeriod = Math.pow(2, Math.ceil(Math.log2(period)));
      calPeriod = Math.min(Math.max(calPeriod, 4), 1 << 16);
      const phase = current % calPeriod;
      const quantizeFactor = Math.max(calPeriod >> 12, 1);
      const quantizedPhase = phase / quantizeFactor * quantizeFactor;
      return [new U8(calPeriod), new U8(quantizedPhase)];
    }
    throw new Error('Invalid data passed to Mortal era');
  }
  /**
   * @description The period of this Mortal wraps as a [[U8]]
   */
  get period (): U8 {
    return this[0] as U8;
  }

  /**
   * @description The phase of this Mortal wraps as a [[U8]]
   */
  get phase (): U8 {
    return this[1] as U8;
  }

  /**
   * @description Encodes the value as a Uint8Array as per the parity-codec specifications
   * @param isBare true when the value has none of the type-specific prefixes (internal)
   */
  toU8a (isBare?: boolean): Uint8Array {
    const period = this.period.toNumber();
    const phase = this.phase.toNumber();
    const quantizeFactor = Math.max(period >> 12, 1);
    const trailingZeros = this.getTrailingZeros(period);
    const encoded = Math.min(15, Math.max(1, trailingZeros - 1)) + (((phase / quantizeFactor) << 4));
    const first = encoded >> 8;
    const second = encoded & 0xff;
    return new Uint8Array([second, first]);
  }

  /**
   * @description Get the block number of the start of the era whose properties this object describes that `current` belongs to.
   */
  birth (current: number) {
    return Math.floor((Math.max(current,this.phase.toNumber()) - this.phase.toNumber()) / this.period.toNumber()) * this.period.toNumber() + this.phase.toNumber();
  }

  /**
   * @description Get the block number of the first block at which the era has ended.
   */
  death (current: number) {
    return this.birth(current) + this.period.toNumber();
  }

  /**
   * @description convert the number to binary and get the trailing zero's.
   */
  private getTrailingZeros (period: number) {
    const zeros: number[] = [];
    let periodN = period;
    periodN = parseInt(periodN.toString(2), 10);

    while (periodN % 10 === 0) {
      periodN = periodN /= 10;
      zeros.push(0);
    }
    return zeros.length;
  }
}
