export type Problem = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  errors?: { path: string; message: string }[];
};

export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    status: number,
    code: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.status = status;
    this.code = code;
  }
}

export class ValidationError extends AppError {
  readonly issues: { path: string; message: string }[];

  constructor(issues: { path: string; message: string }[]) {
    super(400, "VALIDATION_FAILED", "The request did not match the API contract.");
    this.issues = issues;
  }
}

export function toProblem(error: unknown, instance: string): Problem {
  if (error instanceof ValidationError) {
    return createProblem(error, instance, "Request validation failed", error.issues);
  }
  if (error instanceof AppError) {
    return createProblem(error, instance, titleFor(error.status));
  }
  return {
    type: "about:blank",
    title: "Internal Server Error",
    status: 500,
    detail: "The request could not be completed.",
    instance,
    code: "INTERNAL_ERROR",
  };
}

function createProblem(
  error: AppError,
  instance: string,
  title: string,
  errors?: { path: string; message: string }[],
): Problem {
  const problem: Problem = {
    type: `https://tenant-notes.local/problems/${error.code.toLowerCase()}`,
    title,
    status: error.status,
    detail: error.message,
    instance,
    code: error.code,
  };
  if (errors) problem.errors = errors;
  return problem;
}

function titleFor(status: number): string {
  const titles: Record<number, string> = {
    401: "Authentication required",
    404: "Note not found",
    429: "Too many requests",
    503: "Service unavailable",
  };
  return titles[status] ?? "Request failed";
}
