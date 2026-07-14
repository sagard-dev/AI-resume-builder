import axios from "axios";

export async function register({ username, email, password }) {
  axios.post("http://localhost:3000/api/auth/register", {
    username,
    email,
    password,
  });
}
