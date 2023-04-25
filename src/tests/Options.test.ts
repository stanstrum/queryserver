import { Options } from "../Options";

describe("processTimeout", () => {
  describe("returns", () => {
    test.each([
      0,
      5_000,
      10_000,
      undefined,
    ])("with %p", timeout => {
      expect(Options.processTimeout(timeout)).toBe(timeout ?? Options.DEFAULT_TIMEOUT);
    });
  });

  describe("throws", () => {
    test.each([
      NaN,
      Infinity,
      0.1,
      256.5,
      -50,
    ])("with %p", timeout => {
      expect(() => Options.processTimeout(timeout)).toThrow();
    });
  });
})

describe("processPort", () => {
  describe("returns", () => {
    test.each([
      1,
      19132,
      25565,
      65535,
      null,
      undefined,
    ])("with %p", port => {
      expect(Options.processPort(port)).toBe(port || Options.DEFAULT_PORT);
    });
  });

  describe("throws", () => {
    test.each([
      NaN,
      Infinity,
      0,
      0.1,
      125.4,
      65536,
    ])("with %p", port => {
      expect(() => Options.processPort(port)).toThrow();
    });
  });
});

describe("processHostname", () => {
  describe("returns", () => {
    const { DEFAULT_PORT } = Options;

    test.each([
      ["8.8.8.8"      , ["8.8.8.8"      , DEFAULT_PORT]],
      ["76.167.15.117", ["76.167.15.117", DEFAULT_PORT]],

      ["stanstrum.com"  , ["stanstrum.com"  , DEFAULT_PORT]],
      ["123computer.net", ["123computer.net", DEFAULT_PORT]],

      ["google.com"          , ["google.com"    , DEFAULT_PORT]],
      ["mc.hypixel.net:25565", ["mc.hypixel.net", 25565]],

      ["example.com:19132", ["example.com", 19132]],
      ["x.acme.com:55555" , ["x.acme.com" , 55555]],

      ["this-should.also-work.tld:23", ["this-should.also-work.tld", 23]],
      ["localhost:80"                , ["localhost"                , 80]],
      ["UPPERCASE:8080"              , ["UPPERCASE"                , 8080]],
    ])("with %p", (host, expected) =>
      expect(Options.processHost(host)).toStrictEqual(expected)
    );
  });

  describe("throws", () => {
    test.each([
      "this+is+invalid:643",
      "as~is~this:5506",

      "#prettymuch anything with special characters",
      ".-this-too-.com",
    ])("with %p", example => {
      expect(
        () => Options.processHost(example)
      ).toThrow();
    });
  });
});

describe("processQueryQuery, processQueryBedrock, processQueryJava return", () => {
  test.each([
    ["no", "no"],
    ["infer", "infer"],
    ["yes", "yes"],
    [undefined, "infer"],
  ] as const)("with %p", (query, expected) => {
    expect(Options.processQueryQuery(query)).toBe(expected);
    expect(Options.processQueryBedrock(query)).toBe(expected);
    expect(Options.processQueryJava(query)).toBe(expected);
  });
});

describe("constructor", () => {
  it("fills in omitted options", () => {
    const options = new Options("hostname", {});

    expect(options.timeout).toBe(Options.DEFAULT_TIMEOUT);

    expect(options.port).toBe(Options.DEFAULT_PORT);

    expect(options.queryQuery).toBe(Options.DEFAULT_QUERY_QUERY);
    expect(options.queryBedrock).toBe(Options.DEFAULT_QUERY_BEDROCK);
    expect(options.queryJava).toBe(Options.DEFAULT_QUERY_JAVA);

    expect(options.returnOnFirst).toBe(Options.DEFAULT_RETURN_ON_FIRST);
  });

  it("uses port from host:port format if no port specified", () => {
    const options = new Options("hostname:5600", {});

    expect(options.port).toBe(5600);
  });

  it("overrides port from host:port format with specified port", () => {
    const options = new Options("hostname:5600", {
      port: 25565
    });

    expect(options.port).toBe(25565);
  });
});
