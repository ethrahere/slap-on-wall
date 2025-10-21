declare module "canvas-confetti" {
  type ConfettiOptions = {
    particleCount?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    scalar?: number;
    startVelocity?: number;
    ticks?: number;
  };

  function confetti(options?: ConfettiOptions): void;

  export default confetti;
}
