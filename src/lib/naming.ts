export function toKebabCase(value: string): string {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized.length > 0 ? normalized : "agent-project";
}

export function kebabToPascal(value: string): string {
  return value
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

export function isValidCommandName(value: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(value);
}
