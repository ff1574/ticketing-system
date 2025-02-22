import axios from "axios";

const BASE_URL = "http://localhost:5000/";

/*
  Example usage:
  // To fetch data for a user with id 123, you could call:
  // fetchData('users', 123);
*/
export const fetchData = async (endpoint, param = null, params = {}) => {
  // If a parameter is provided, append it to the endpoint path.
  const url = param
    ? `${BASE_URL}${endpoint}/${param}`
    : `${BASE_URL}${endpoint}`;

  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching data: ", error);
    return null;
  }
};
