function resolveState(pageState) {
  let resolvedState = {};
  let stateResolvers = [];
  // get components names and their state
  Object.entries(pageState).forEach(([component, state]) => {
    // initialize the state for the component
    resolvedState[component] = {};
    // get state thenables
    Object.entries(state).forEach(([key, thenable]) => {
      stateResolvers.push(
        // wrap the thenable in a state resolver
        new Promise((resolve) => {
          // here we resolve the value for the state key and map it to
          // the resolved state
          // this is the only place that knows where the resolved value
          // should be in the resolved state
          thenable
            .then((data) => {
              resolvedState[component][key] = {
                loading: false,
                data,
                error: null,
              };
            })
            .catch((err) => {
              resolvedState[component][key] = {
                loading: false,
                data: null,
                error: err,
              };
            })
            .finally(() => {
              resolve(resolvedState);
            });
        })
      );
    });
  });

  // state resolvers allow us to wait for every
  // state thenable to resolve its value
  return Promise.allSettled(stateResolvers);
}

module.exports = resolveState;
