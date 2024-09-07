type ListenersByType = Map<string, Set<Function>>;

type ListenersByElmt = Map<string, ListenersByType>;

export class ListenersManager {
  private debugging = false;
  private listenersByElmt: ListenersByElmt = new Map();
  private timeout: NodeJS.Timeout | undefined;

  get listenersCount() {
    const count: Record<string, Record<string, number>> = {};

    this.listenersByElmt.forEach((listenersByType, key) => {
      count[key] = {};
      listenersByType.forEach((listeners, type) => (count[key][type] = listeners.size));
    });
    return count;
  }

  private debugLog(message?: any, ...optionalParams: any[]) {
    clearTimeout(this.timeout);

    if (this.debugging) {
      console.log(message, ...optionalParams);

      this.timeout = setTimeout(() => {
        console.log("===============");
      }, 2000);
    }
  }

  add<K extends keyof DocumentEventMap>(
    element: HTMLElement,
    name: string,
    type: K,
    listener: (this: Document, ev: DocumentEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ) {
    let listenersByType = this.listenersByElmt.get(name);
    const listeners = listenersByType?.get(type);
    const isDuplicated = listeners?.has(listener);

    if (listeners) {
      listeners.add(listener);
    } else {
      if (!listenersByType) {
        listenersByType = new Map();
        this.listenersByElmt.set(name, listenersByType);
      }

      listenersByType.set(type, new Set([listener]));
    }

    this.debugLog("ADD", type, isDuplicated ? "--DUPLICATE" : undefined);
    element.addEventListener(type as any, listener as any, options as any);
  }

  remove<K extends keyof DocumentEventMap>(
    element: HTMLElement,
    name: string,
    type: K,
    listener: (this: Document, ev: DocumentEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ) {
    const removeSuccessful = this.listenersByElmt.get(name)?.get(type)?.delete(listener);

    this.debugLog("REMOVE", type, removeSuccessful ? "--SUCCESS" : "--FAIL");
    element.removeEventListener(type as any, listener as any, options as any);
  }
}
