export type Clock = {
  now(): Date;
};

export type IdSource = {
  next(): string;
};

export type Principal = {
  userId: string;
  organizationId: string;
  storePath: string;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  ownerId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};

export type Logger = {
  write(event: Record<string, unknown>): void;
};
