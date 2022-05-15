const { createElement: e } = require('react');
const { readFileSync } = require('fs');
const getPage = require('./getPage');

jest.mock('fs');

readFileSync.mockReturnValue(
  '<div id="root"></div><script id="__INITIAL_STATE__"></script>'
);

function getPageWithState(state) {
  return (
    '<div id="root"><h1>The component</h1></div>' +
    `<script>globalThis['__INITIAL_STATE__']=${JSON.stringify(state)}</script>`
  );
}

let Component;

beforeEach(() => {
  Component = function Component() {
    return e('h1', {}, 'The component');
  };
});

it("doesn't throw on empty state object", async () => {
  await expect(async () => await getPage(Component)).not.toThrow();
});

it('returns the correct html', () => {
  return getPage(Component).then((html) => {
    expect(html).toBe(getPageWithState({}));
  });
});

it(
  'sets the correct initial state for ssr ' +
    'and csr when the state is empty object',
  () => {
    return getPage(Component).then((html) => {
      expect(globalThis['__INITIAL_STATE__']).toEqual({});
      expect(html).toEqual(getPageWithState({}));
    });
  }
);

it('sets the correct initial state for ssr and csr', () => {
  Component.getPageState = function getPageState() {
    return {
      Component: {
        user: Promise.resolve({ name: 'John Doe' }),
      },
    };
  };

  const state = {
    Component: {
      user: {
        loading: false,
        data: { name: 'John Doe' },
        error: null,
      },
    },
  };

  return getPage(Component).then((html) => {
    // ssr state should be set on the global object
    expect(globalThis['__INITIAL_STATE__']).toEqual(state);
    expect(html).toEqual(getPageWithState(state));
  });
});
