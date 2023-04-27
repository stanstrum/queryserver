import queryServer from "..";
import { AggregateError } from "../helpers";

describe("queryServer", () => {
  it("throws an AggregateError on connection failure", () => {
    expect(async () => {
      await queryServer("fake-host.acme.com");
    }).toThrow(AggregateError);
  });
});
