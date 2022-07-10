import { document } from "./dom";

class View {
  public lang(): string {
    return document.documentElement.lang ?? "en";
  }

  public readonly title: string = document.title;

  public plus<T>(obj: T): Readonly<this & T> {
    const copyObj = Object.assign({}, obj);
    const o = Object.assign(copyObj, this);
    Object.freeze(o);
    return o;
  }
}

export const view: Readonly<View> = new View();
