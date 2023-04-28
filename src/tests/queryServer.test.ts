import queryServer from "..";
import { AggregateError } from "../helpers";

describe("queryServer", () => {
  it("throws an AggregateError on connection failure", async () => {
    await expect(
      queryServer("fake-host.acme.com")
    ).rejects.toThrow(AggregateError);
  });
});
