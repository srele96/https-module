const resolveState = require('./resolveState');

it('resolves empty page state to an empty array', () => {
  return resolveState({}).then((state) => {
    expect(state).toEqual([]);
  });
});

it('resolves the state value correctly', () => {
  const pageState = {
    App: {
      user: Promise.resolve({ displayName: 'John Doe' }),
    },
    Counter: {
      count: new Promise((resolve) => {
        setTimeout(() => {
          resolve(10);
        }, 100);
      }),
    },
    Rejected: {
      value: Promise.reject('error'),
    },
  };

  const resolvedState = {
    status: 'fulfilled',
    value: {
      App: {
        user: {
          data: { displayName: 'John Doe' },
          loading: false,
          error: null,
        },
      },
      Counter: { count: { data: 10, loading: false, error: null } },
      Rejected: { value: { data: null, loading: false, error: 'error' } },
    },
  };

  return resolveState(pageState).then((states) => {
    expect(states).toEqual([resolvedState, resolvedState, resolvedState]);
  });
});
