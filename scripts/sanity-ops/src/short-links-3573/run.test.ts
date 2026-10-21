import { describe, expect, it, vi } from "vitest";
import { runSeed, type SeedClient } from "./run";
import { SHORT_LINK_SEED, shortLinkId, type ExistingDoc } from "./plan";

/** A client that records writes and never touches the network. */
function fakeClient(dataset: string, existing: ExistingDoc[] = []) {
  const createOrReplace = vi.fn();
  const commit = vi.fn().mockResolvedValue({ transactionId: "tx1" });
  const tx = { createOrReplace, commit };
  createOrReplace.mockReturnValue(tx);
  const transaction = vi.fn(() => tx);
  const fetch = vi.fn().mockResolvedValue(existing);
  const client = {
    config: () => ({ dataset }),
    fetch,
    transaction,
  } as unknown as SeedClient;
  return { client, fetch, transaction, createOrReplace, commit };
}

function run(
  fake: ReturnType<typeof fakeClient>,
  options: {
    execute?: boolean;
    requestedDataset?: string;
    confirmed?: boolean;
  } = {},
) {
  const lines: string[] = [];
  const errors: string[] = [];
  return runSeed({
    client: fake.client,
    execute: options.execute ?? false,
    requestedDataset: options.requestedDataset ?? "staging",
    productionConfirmed: options.confirmed ?? false,
    log: (line) => lines.push(line),
    error: (line) => errors.push(line),
  }).then((code) => ({ code, lines, errors }));
}

describe("runSeed", () => {
  it("is a dry run by default: prints the dataset and the plan, writes nothing", async () => {
    const fake = fakeClient("production");
    const { code, lines } = await run(fake, { requestedDataset: "production" });

    expect(code).toBe(0);
    expect(lines.join("\n")).toContain("Dataset production");
    expect(lines.join("\n")).toContain("shortLink-tornooi");
    expect(lines.join("\n")).toContain("shortLink-stage");
    expect(lines.join("\n")).toMatch(/Dry run — nothing written/);
    expect(fake.transaction).not.toHaveBeenCalled();
  });

  it("looks for the seed names and ids in a single read", async () => {
    const fake = fakeClient("staging");
    await run(fake);
    expect(fake.fetch).toHaveBeenCalledTimes(1);
    expect(fake.fetch.mock.calls[0][1]).toEqual({
      names: ["tornooi", "stage"],
      ids: ["shortLink-tornooi", "shortLink-stage"],
    });
  });

  it("writes both documents in one transaction with --execute", async () => {
    const fake = fakeClient("staging");
    const { code, lines } = await run(fake, { execute: true });

    expect(code).toBe(0);
    expect(fake.createOrReplace.mock.calls.map(([doc]) => doc._id)).toEqual(
      SHORT_LINK_SEED.map((s) => shortLinkId(s.name)),
    );
    expect(fake.commit).toHaveBeenCalledTimes(1);
    expect(lines.join("\n")).toContain("Done");
  });

  it("writes nothing when every document already matches", async () => {
    const fake = fakeClient(
      "staging",
      SHORT_LINK_SEED.map((s) => ({ _id: shortLinkId(s.name), ...s })),
    );
    const { code, lines } = await run(fake, { execute: true });

    expect(code).toBe(0);
    expect(lines.join("\n")).toMatch(/nothing to do/i);
    expect(fake.transaction).not.toHaveBeenCalled();
  });

  it("refuses to write production without the confirmation", async () => {
    const fake = fakeClient("production");
    const { code, errors } = await run(fake, {
      execute: true,
      requestedDataset: "production",
    });

    expect(code).toBe(1);
    expect(errors.join("\n")).toContain("CONFIRM_PRODUCTION_SHORT_LINKS=yes");
    expect(fake.transaction).not.toHaveBeenCalled();
  });

  it("writes production once confirmed", async () => {
    const fake = fakeClient("production");
    const { code } = await run(fake, {
      execute: true,
      requestedDataset: "production",
      confirmed: true,
    });
    expect(code).toBe(0);
    expect(fake.commit).toHaveBeenCalledTimes(1);
  });

  it("refuses when the client talks to another dataset than the one asked for", async () => {
    // `getCliClient({ dataset })` silently ignores the option and hits
    // production: the guard reads the dataset the client really uses.
    const fake = fakeClient("production");
    const { code, errors } = await run(fake, {
      execute: true,
      requestedDataset: "staging",
      confirmed: true,
    });

    expect(code).toBe(1);
    expect(errors.join("\n")).toMatch(
      /staging.*production|production.*staging/,
    );
    expect(fake.fetch).not.toHaveBeenCalled();
    expect(fake.transaction).not.toHaveBeenCalled();
  });

  it("refuses a dataset that is neither staging nor production", async () => {
    const fake = fakeClient("scratch");
    const { code } = await run(fake, { requestedDataset: "scratch" });
    expect(code).toBe(1);
    expect(fake.fetch).not.toHaveBeenCalled();
  });

  it("refuses, even in a dry run, when preflight finds a clash", async () => {
    const fake = fakeClient("staging", [
      { _id: "abc123", name: "stage", target: "/elders" },
    ]);
    const { code, errors } = await run(fake);
    expect(code).toBe(1);
    expect(errors.join("\n")).toContain("abc123");
    expect(fake.transaction).not.toHaveBeenCalled();
  });
});
