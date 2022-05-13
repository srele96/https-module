const axios = require('axios');
const { createElement: e } = require('react');

const fetchReactPackages = () =>
  new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: 'https://api.npms.io/v2/search?q=react&size=3',
      responseType: 'json',
    })
      .then((response) => resolve(response.data.results))
      .catch((error) => reject(error.message));
  });

function App() {
  return e('h1', null, 'React SSR - Data Fetching');
}

/**
 * Should return an object with the following shape:
 *
 * @example
 * {
 *   [componentName]: {
 *     [key]: Promise { <pending> }
 *   }
 * }
 *
 * A component name must be unique and key must be unique per component.
 * The component App should use the state from App object.
 * The component Test should NOT use the state from App object.
 */
App.getPageState = function getPageState() {
  return {
    App: {
      data: fetchReactPackages(),
    },
    Test: {
      test: new Promise((resolve) => {
        setTimeout(() => resolve('Hello'), 1000);
      }),
    },
    Rejected: {
      rejected: new Promise((resolve, reject) => {
        setTimeout(() => reject('Hello'), 1000);
      }),
    },
  };
};

module.exports = App;
