/**
 * Registre central des gammes de peinture.
 */

import { CITADEL_RANGE } from "./citadel-paints";
import { MONUMENT_HOBBIES_RANGE } from "./monument-hobbies-paints";
import type { PaintRange } from "./paint-types";

export const PAINT_RANGES: PaintRange[] = [CITADEL_RANGE, MONUMENT_HOBBIES_RANGE];
export const RANGE_MAP = new Map(PAINT_RANGES.map((r) => [r.slug, r]));
