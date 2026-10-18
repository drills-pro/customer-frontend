export type BitPose = 'idle' | 'detect' | 'train' | 'ship' | 'oops';
export interface BitFrameOptions {
  /** 0 = app icon, 1 = mascot. */
  t?: number;
  pose?: BitPose;
  /** Tenant accent (hex). Replaces the orange family; shades are derived. */
  accent?: string | null;
  lookX?: number;
  lookY?: number;
  blink?: number;
  squash?: number;
  bob?: number;
  armL?: number;
  armR?: number;
  pulse?: number;
  mouth?: 'smile' | 'flat' | 'open' | 'wavy';
  /** Opaque full-bleed square for OS masks. */
  mask?: boolean;
  /** 1px paper rim for transparent grounds; pass false to drop it. */
  rim?: string | false;
  flash?: number;
  label?: string;
}
export interface BitTimeline {
  T: number;
  at(seconds: number): BitFrameOptions;
}
declare const Bit: {
  N: number;
  frame(o: BitFrameOptions): string;
  favicon(): string;
  wordmark(ink: string): string;
  TL: { morph: BitTimeline; train: BitTimeline };
  POSES: Record<BitPose, BitFrameOptions>;
};
export default Bit;
