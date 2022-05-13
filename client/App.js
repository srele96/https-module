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

function App() {}

// component name must be unique and key must be unique per component
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
