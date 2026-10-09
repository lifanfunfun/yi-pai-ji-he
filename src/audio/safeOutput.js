import * as Tone from 'tone';
const outputs=new WeakMap();
export function safeOutput() {
  const context=Tone.getContext();
  if(!outputs.has(context)) {
    // Keep the common path transparent and inexpensive. Each instrument engine
    // retains its own limiter and input gain staging; this is output headroom.
    const trim=new Tone.Gain(.6).toDestination();
    outputs.set(context,trim);
  }
  return outputs.get(context);
}
