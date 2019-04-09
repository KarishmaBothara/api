// Copyright 2017-2019 @polkadot/types authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AnyU8a } from '../types';
import EnumType from '../codec/EnumType';
import {u8aToU8a, isHex, isObject, isU8a, hexToU8a} from '@polkadot/util';
import {IMMORTAL_ERA} from "@polkadot/types/type/ExtrinsicSignature";
import U8a from '../codec/U8a';
//import {iExtrinsicEra} from "@polkadot/types/types";
//import isHex from "@polkadot/util/is/hex";


class ExtrinsicEra extends EnumType<IMMORTAL_ERA | MortalEra> {
  constructor(value) {
    super({IMMORTAL_ERA, MortalEra}, value);
  }
}

/**
 * @name ExtrinsicEra
 * @description
 * The era for an extrinsic, indicating either a mortal or immortal extrinsic
 */
export default class MortalEra extends U8a {
  constructor (value?: AnyU8a | string | {enabled: boolean, period: AnyU8a, phase: AnyU8a}) {
    super(
      MortalEra.decodeExtrinsicEra(value)
    );
  }

//{enabled: boolean, period: AnyU8a, phase: AnyU8a}

  static decodeExtrinsicEra (value?: AnyU8a | string | {'enabled': boolean, 'period': U}): Uint8Array {
    if (isHex(value)) {
      value = hexToU8a(value.toString())
    }
    if (isU8a(value)) {
      const u8a = u8aToU8a(value);

      // If we have a zero byte, it is immortal (1 byte in length), otherwise we have
      // the era details following as another byte
      return u8a.subarray(0, (u8a[0] === 0) ? 1 : 2);
    } else if(isObject(value)) {
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
