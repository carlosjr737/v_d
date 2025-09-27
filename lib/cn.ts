export type ClassValue =
  | string
  | number
  | null
  | undefined
  | boolean
  | ClassValue[]
  | { [key: string]: boolean | string | number | null | undefined };

const appendClassNames = (classes: string[], value: ClassValue): void => {
  if (!value) {
    return;
  }

  if (typeof value === "string" || typeof value === "number") {
    classes.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => appendClassNames(classes, item));
    return;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([key, condition]) => {
      if (condition) {
        classes.push(key);
      }
    });
  }
};

export const cn = (...values: ClassValue[]): string => {
  const classes: string[] = [];
  values.forEach((value) => appendClassNames(classes, value));
  return classes.join(" ").trim();
};
