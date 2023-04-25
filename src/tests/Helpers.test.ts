import {
  AggregateError,
  merge, variadicMerge,
  auto
} from "../helpers"

describe("AggregateError", () => {
  const messages = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
    "sed do eiusmod tempor incididunt ut labore et dolore magna",
    "aliqua. Ut enim ad minim veniam, quis nostrud exercitation",
    "ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit",
    "esse cillum dolore eu fugiat nulla pariatur. Excepteur sint",
    "occaecat cupidatat non proident, sunt in culpa qui officia",
    "deserunt mollit anim id est laborum"
  ];

  const errors = messages.map(message => new Error(message));
  const e = new AggregateError("Testing error", ...errors);

  test("messages agglutinate correctly", () => {
    expect(
      Array.from(
        e.message.matchAll(
          / {4}Error: .+\n( {4}){2}at .+/g
        )
      ).length
    ).toBe(messages.length);
  });

  test("store errors in `.errors` member", () => {
    expect(e.errors).toStrictEqual(errors);
  });
});

describe("merge", () => {
  test.each([
    [
      { foo: 1, bar: undefined, baz: true },
      { foo: undefined, bar: "hello", baz: false },

      { foo: 1, bar: "hello", baz: true },
    ],
    [
      {
        obj: { a: 1, b: true },
        test: undefined,
      },
      {
        obj: { b: false, c: "testing" },
        test: ["mary", "had", "a", "little", "lamb"]
      },

      {
        obj: { a: 1, b: true, c: "testing" },
        test: ["mary", "had", "a", "little", "lamb"]
      }
    ]
  ])("%p, %p", (a, b, expected) => {
    expect(merge(a, b)).toStrictEqual(expected);
  });
});

describe("variadicMerge", () => {
  test("multiple objects", () => {
    expect(
      variadicMerge({
        foo: "foo",
        a: 1,
      }, {
        foo: "other",
        baz: { first: false, second: [] },
        b: 2,
        c: undefined
      }, {
        bar: "???",
        baz: { first: 1, second: ["hey"], third: {} },
        c: true
      })
    ).toStrictEqual({
      foo: "foo",
      bar: "???",
      baz: { first: false, second: [], third: {} },
      a: 1,
      b: 2,
      c: true,
    });
  });
});

describe("auto", () => {
  let ctr = 0;

  test.each([
    1,
    5,
    10
  ])(`+%p`, count => {
    let i = 0;
    for (; i < count; i++) expect(auto()).toBe(ctr + i);

    ctr += i;
  });
});
