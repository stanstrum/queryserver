import { Options } from "@/Options";
import { JavaQuerier } from "@/Queriers";

describe("JavaQuerier", () => {
  const options = new Options("cedar", {
    queryJava: "yes"
  });

  const timeout = new Promise<never>((_, reject) => setTimeout(reject, 10_000)).catch();

  it("does stuff", async () => {
    await expect(
      JavaQuerier(timeout, options)
    ).resolves.not.toThrow();

    await timeout;
  });
});
