type EffectType = () => void;
type ReactiveType = object;
type TargetMap = WeakMap<ReactiveType, Map<string, Set<EffectType>>>;

const activeEffects: EffectType[] = [];
export const targetMap: TargetMap = new WeakMap<TargetMap>();

interface TrackableCallback {
  onGet: (target: ReactiveType, key: string, receiver: any) => void;
  onSet: (
    target: ReactiveType,
    key: string,
    value: ReactiveType,
    receiver: any
  ) => void;
  onDeleteProperty: (target: ReactiveType, key: string) => void;
}

export const getTrackableObject = (
  obj: ReactiveType,
  callbacks: TrackableCallback
) => {
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      obj[key] = getTrackableObject(obj[key], callbacks);
    }
  }
  const proxy = new Proxy(obj, {
    get(target: ReactiveType, key: string, receiver: any) {
      const result = Reflect.get(target, key, receiver);
      callbacks.onGet(target, key, receiver);
      return result;
    },
    set(target: ReactiveType, key: string, value: object, receiver: any) {
      if (typeof value === "object") {
        value = getTrackableObject(value, callbacks);
      }
      const result = Reflect.set(target, key, value, receiver);
      callbacks.onSet(target, key, value, receiver);
      return result;
    },
    deleteProperty(target: ReactiveType, key: string) {
      const result = Reflect.deleteProperty(target, key);
      callbacks.onDeleteProperty(target, key);
      return result;
    },
  });
  if (Array.isArray(obj)) {
    Object.setPrototypeOf(proxy, Array.prototype);
  }
  return proxy;
};

export const track = (
  targetMap: TargetMap,
  target: object,
  key: string,
  activeEffects: EffectType[]
) => {
  if (!activeEffects.length) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    // using set assures that no duplicate effects will be stored
    dep = new Set();
    depsMap.set(key, dep);
  }
  activeEffects.forEach((effect) => dep.add(effect));
};

export const trigger = (
  targetMap: TargetMap,
  target: ReactiveType,
  key: string
) => {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key);
  if (!deps) return;

  deps.forEach((effect) => {
    effect();
  });
};

export const watchEffect = (effect: EffectType) => {
  activeEffects.push(effect);
  effect();
  activeEffects.pop();
};

export const reactive = (target: ReactiveType) => {
  return getTrackableObject(target, {
    onGet(target, key) {
      track(targetMap, target, key, activeEffects);
    },
    onSet(target, key) {
      trigger(targetMap, target, key);
    },
    onDeleteProperty() {},
  });
};

export const ref = (raw: ReactiveType) => {
  const r = {
    get value() {
      track(targetMap, r, "value", activeEffects);
      return raw;
    },
    set value(newVal) {
      if (newVal === raw) return;
      raw = newVal;
      trigger(targetMap, r, "value");
    },
  };
  return r;
};

export const computed = (getter: () => ReactiveType) => {
  const result = ref(null);
  watchEffect(() => (result.value = getter()));
  return result;
};
