// Construct a reusable voice only when its score first uses it.
export function lazyVoice(factory) {
  let instance;const destinations=[];
  const warm=()=>{
    if(!instance) {instance=factory();for(const bus of destinations) instance.connect(bus);}
    return instance;
  };
  return {warm,connect(bus){destinations.push(bus);instance?.connect(bus);return this;},
    triggerAttackRelease(...args){return warm().triggerAttackRelease(...args);},
    releaseAll(...args){instance?.releaseAll(...args);},
    get activeVoices(){return instance?.activeVoices??0;},
    get initialized(){return !!instance;},dispose(){instance?.dispose();instance=undefined;}};
}
export function lazySample(factory) {
  let instance,pending;const destinations=[];
  return {warm(){
    if(instance)return Promise.resolve(instance);
    return pending??=(factory().then(voice=>{instance=voice;for(const bus of destinations)voice.connect(bus);return voice;}).catch(error=>{pending=undefined;throw error;}));
  },connect(bus){destinations.push(bus);instance?.connect(bus);return this;},
  triggerAttackRelease(...args){instance?.triggerAttackRelease(...args);},
  releaseAll(...args){instance?.releaseAll(...args);},get loaded(){return !!instance;},get initialized(){return !!instance;}};
}
