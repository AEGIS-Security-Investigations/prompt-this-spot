/** npm 10/11 emit an array; npm 12 keys the packed entries by package name. */
export const parseSinglePackagePackResult = (
  output: string,
  packageName: string
) => {
  const result: unknown = JSON.parse(output);
  const entries = Array.isArray(result)
    ? result
    : result &&
        typeof result === "object" &&
        Object.keys(result).length === 1 &&
        Object.hasOwn(result, packageName)
      ? [Reflect.get(result, packageName)]
      : [];
  const [entry]: unknown[] = entries;
  if (
    entries.length !== 1 ||
    !entry ||
    typeof entry !== "object" ||
    !("name" in entry) ||
    entry.name !== packageName ||
    !("filename" in entry) ||
    typeof entry.filename !== "string" ||
    !/^[a-zA-Z0-9_-][a-zA-Z0-9_.+-]*\.tgz$/.test(entry.filename) ||
    !("entryCount" in entry) ||
    typeof entry.entryCount !== "number" ||
    !Number.isSafeInteger(entry.entryCount) ||
    entry.entryCount <= 0 ||
    !("size" in entry) ||
    typeof entry.size !== "number" ||
    !Number.isSafeInteger(entry.size) ||
    entry.size <= 0
  ) {
    throw new Error(
      "npm pack did not report exactly one valid tarball for this package"
    );
  }
  return {
    filename: entry.filename,
    entryCount: entry.entryCount,
    size: entry.size,
  };
};
