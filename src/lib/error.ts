export class AnyError extends Error {
  public readonly name: string = "AnyError";
  public readonly cause?: AnyError | Error;

  constructor(
    public readonly code: string,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.cause = isError(cause) ? cause : undefined;
  }
}

export function isError(error: unknown): error is AnyError | Error {
  return error instanceof Error || error instanceof AnyError;
}
