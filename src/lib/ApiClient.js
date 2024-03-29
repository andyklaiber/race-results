import axios from 'axios';

let request;
if (import.meta.env.DEV) {
  request = axios.create({ 
    withCredentials: true,
    baseURL: "http://localhost:3000" 
  });
} else {
  request = axios;
}

export default request;