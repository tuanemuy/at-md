export type RawSearchParams = { [key: string]: string | string[] | undefined };

export class SearchParams {
  constructor(public readonly params: { [key: string]: string[] }) {}

  static fromRaw(params: RawSearchParams): SearchParams {
    const p: { [key: string]: string[] } = {};

    for (const key in params) {
      if (params[key] !== undefined && params[key] !== "") {
        p[key] = [params[key] as string | string[]].flat();
      }
    }

    return new SearchParams(p);
  }

  get(key: string): string[] {
    return this.params[key];
  }

  getOne(key: string, index = 0): string | undefined {
    return this.params[key]?.at(index);
  }

  toString(): string {
    return new URLSearchParams(
      Object.entries(this.params).map(([key, value]) => {
        return [key, value.join(",")];
      }),
    ).toString();
  }
}
