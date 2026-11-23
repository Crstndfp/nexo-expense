import { describe, expect, it } from "vitest";
import {
  convertToGtq,
  formatCentsToAmount,
  parseAmountToCents,
} from "../../domain/money.js";

describe("convertToGtq", () => {
  it("converts 200.00 USD to 1551.25 GTQ using fixed rate 7.756250", () => {
    const result = convertToGtq("200.00", "USD");

    expect(result).toEqual({
      originalAmount: "200.00",
      originalCurrency: "USD",
      exchangeRateApplied: "7.756250",
      amountGtq: "1551.25",
      amountGtqCents: 155125n,
    });
  });

  it("keeps 100.00 GTQ unchanged with exchange rate 1.000000", () => {
    const result = convertToGtq("100.00", "GTQ");

    expect(result).toEqual({
      originalAmount: "100.00",
      originalCurrency: "GTQ",
      exchangeRateApplied: "1.000000",
      amountGtq: "100.00",
      amountGtqCents: 10000n,
    });
  });

  it("normalizes amounts with zero or one decimal digit to two decimals", () => {
    expect(convertToGtq("10", "GTQ").amountGtq).toBe("10.00");
    expect(convertToGtq("10.5", "GTQ").amountGtq).toBe("10.50");
  });

  it("rounds HALF_UP at exact .xx5 boundary regardless of even/odd preceding digit", () => {
    // 4.00 * 7.756250 = 31.025 (preceding digit 2 is even) -> 31.03
    expect(convertToGtq("4.00", "USD").amountGtq).toBe("31.03");
    // 12.00 * 7.756250 = 93.075 (preceding digit 7 is odd) -> 93.08
    expect(convertToGtq("12.00", "USD").amountGtq).toBe("93.08");
  });

  it("rounds down below .xx5 and up above .xx5", () => {
    // 0.08 * 7.756250 = 0.6205 -> 0.62
    expect(convertToGtq("0.08", "USD").amountGtq).toBe("0.62");
    // 0.04 * 7.756250 = 0.31025 -> 0.31
    expect(convertToGtq("0.04", "USD").amountGtq).toBe("0.31");
    // 0.01 * 7.756250 = 0.0775625 -> 0.08
    expect(convertToGtq("0.01", "USD").amountGtq).toBe("0.08");
  });

  it("handles large USD amounts without floating-point precision loss", () => {
    expect(convertToGtq("100000.00", "USD").amountGtq).toBe("775625.00");
  });
});

describe("parseAmountToCents", () => {
  it("rejects zero and negative amounts", () => {
    expect(() => parseAmountToCents("0")).toThrow();
    expect(() => parseAmountToCents("0.00")).toThrow();
    expect(() => parseAmountToCents("-10.00")).toThrow();
  });

  it("rejects malformed strings, extra decimals, whitespace, and scientific notation", () => {
    expect(() => parseAmountToCents("10.001")).toThrow();
    expect(() => parseAmountToCents(" 10.00")).toThrow();
    expect(() => parseAmountToCents("1e2")).toThrow();
    expect(() => parseAmountToCents("")).toThrow();
    expect(() => parseAmountToCents("abc")).toThrow();
  });
});

describe("formatCentsToAmount", () => {
  it("formats zero, single-digit cents, and negative values to two decimals", () => {
    expect(formatCentsToAmount(0n)).toBe("0.00");
    expect(formatCentsToAmount(5n)).toBe("0.05");
    expect(formatCentsToAmount(-1050n)).toBe("-10.50");
  });
});
