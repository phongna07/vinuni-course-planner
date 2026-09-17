import assert from "node:assert/strict";
import test from "node:test";

import english from "@/messages/en.json";
import vietnamese from "@/messages/vi.json";

interface MessageTree {
  [key: string]: string | MessageTree;
}

function flattenMessages(
  messages: MessageTree,
  prefix = "",
): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      flattened[path] = value;
    } else {
      Object.assign(flattened, flattenMessages(value, path));
    }
  }

  return flattened;
}

function getArguments(message: string): string[] {
  return [
    ...new Set(
      [...message.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)(?:,|\})/g)].map(
        (match) => match[1],
      ),
    ),
  ].sort();
}

test("English and Vietnamese messages have matching keys and arguments", () => {
  const en = flattenMessages(english);
  const vi = flattenMessages(vietnamese);

  assert.deepEqual(Object.keys(vi).sort(), Object.keys(en).sort());

  for (const key of Object.keys(en)) {
    assert.deepEqual(
      getArguments(vi[key]),
      getArguments(en[key]),
      `Message arguments differ for ${key}`,
    );
  }
});
