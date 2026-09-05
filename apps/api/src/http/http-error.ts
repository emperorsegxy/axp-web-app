// Thrown by controllers and services to signal a specific HTTP status.
// The error handler translates it into a JSON response.
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}
