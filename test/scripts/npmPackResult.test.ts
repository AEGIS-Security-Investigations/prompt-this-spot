import { expect, test } from "bun:test";
import { parseSinglePackagePackResult } from "../../scripts/lib/npmPackResult";

const NAME = "@brotskyllc/prompt-this-spot";
const pack = {
  name: NAME,
  filename: "brotskyllc-prompt-this-spot-0.2.0.tgz",
  entryCount: 10,
  size: 100,
};

test("accepts both npm pack JSON formats for the expected package", () => {
  for (const result of [[pack], { [NAME]: pack }]) {
    expect(parseSinglePackagePackResult(JSON.stringify(result), NAME)).toEqual({
      filename: pack.filename,
      entryCount: pack.entryCount,
      size: pack.size,
    });
  }
});

test("rejects empty, mismatched, ambiguous, or unsafe pack metadata", () => {
  for (const result of [
    [],
    {},
    [pack, pack],
    { other: pack },
    { [NAME]: pack, other: pack },
    { [NAME]: { ...pack, name: "other" } },
    [{ ...pack, filename: "../not-a-package.tgz" }],
    [{ ...pack, entryCount: 0 }],
    [{ ...pack, size: null }],
  ]) {
    expect(() =>
      parseSinglePackagePackResult(JSON.stringify(result), NAME)
    ).toThrow("npm pack did not report exactly one valid tarball");
  }
});
