import { PREFIX } from "./configs";

export default class ClassName {
  readonly entity: string;
  readonly identity: string;

  constructor(entityName: string, identifier?: string) {
    this.entity = `${PREFIX}-${entityName}`;
    this.identity = identifier ? ` ${identifier}-${entityName}` : "";
  }

  withModifier(modifier: string) {
    return `${this.entity}--${modifier}`;
  }

  toString(modifier?: string) {
    const clsx = [this.entity];
    if (this.identity) clsx.push(this.identity);
    if (modifier) clsx.push(this.withModifier(modifier));
    return clsx.join(" ");
  }
}
