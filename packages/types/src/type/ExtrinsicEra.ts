// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import EnumType from '../codec/EnumType';
import { isHex, isU8a, hexToU8a, isObject } from '@polkadot/util';
import Null from '../primitive/Null';
import Tuple from '../codec/Tuple';
import U64 from '../primitive/U64';
import { IExtrinsicEra } from '../types';

interface EraMethod {
  period: U64;
  phase?: U64;
  current: U64; // current blocknumber
  isBlockNumber: boolean;
}

export default class ExtrinsicEra extends EnumType<ImmortalEra | MortalEra> implements IExtrinsicEra {
  constructor (value?: any, index?: number) {
    super({ ImmortalEra, MortalEra }, value, index);
  }

  /**
   * @description Returns the item as a [[ImmortalEra]]
   */
  get immortalEra (): ImmortalEra {
    return this.value as ImmortalEra;
  }

  /**
   * @description Returns the item as a [[MortalEra]]
   */
  get mortalEra (): MortalEra {
    return this.value as MortalEra;
  }
}

export class ImmortalEra extends Null {
}

export type MortalEraValue = [U64, U64];

/**
 * @name MortalEra
 * @description
 * The MortalEra for an extrinsic, indicating period and phase
 */
export class MortalEra extends Tuple {
  constructor (value?: any) {
    super({
      period : U64, phase : U64
    }, MortalEra.decodeMortalEra(value));
  }

  private static decodeMortalEra (value: EraMethod | Uint8Array | string): MortalEraValue {
    if (isHex(value)) {
      return MortalEra.decodeMortalEra(hexToU8a(value.toString()));
    } else if (isU8a(value)) {
      const u8a = value;
      const first = u8a.subarray(0, 1);
      const second = u8a.subarray(1, 2);
      const encoded = new U64(first).toNumber() + (new U64(second).toNumber() << 8);
      const period = 2 << (encoded % (1 << 4));
      const factor = 12;
      const quantizeFactor = period >> factor > 1 ? period >> factor : 1;
      let phase = (encoded >> 4) * quantizeFactor;
      if (period >= 4 && phase < period) {
        return [new U64(period), new U64(phase)];
      }
      return [new U64(), new U64()];
    } else if (isObject(value) && value.period) {
      if (value.phase) {
        return [value.period, value.phase];
      } else if (value.isBlockNumber) {
        const period = Math.pow(2, Math.ceil(Math.log2(value.period.toNumber())));
        const phase = value.current.toNumber() % period;
        const factor = 12;
        const quantizeFactor = period >> factor > 1 ? period >> factor : 1;
        let quantizedPhase = phase / quantizeFactor * quantizeFactor;
        return [new U64(period), new U64(quantizedPhase)];
      }
    }
    return [new U64(), new U64()];
  }
  /**
   * @description The justification [[U64]]
   */
  get period (): U64 {
    return this[0] as U64;
  }

  /**
   * @description The round this justification wraps as a [[U64]]
   */
  get phase (): U64 {
    return this[1] as U64;
  }

}
