import { describe, expect, it } from "vitest"
import { isNetworkInstanceId } from "./networkInstance"
describe("tab instance identity", () => {
  it("accepts UUIDs and rejects separators, empty and oversized identities", () => {
    expect(isNetworkInstanceId("7e204f36-e283-4473-a57a-dc4dff727ce3")).toBe(
      true,
    )
    for (const value of [
      null,
      42,
      "",
      "../x",
      "a:b",
      "copy name",
      "a".repeat(65),
    ]) {
      expect(isNetworkInstanceId(value)).toBe(false)
    }
  })
})
