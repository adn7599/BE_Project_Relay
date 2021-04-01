const axios = require("axios").default;

const config = require("../configurations.json");

async function fetchUserCredentials(role, reg_id) {
  const url = `${config.TTP_ADDR}/relay/userCredentials/${role}/${reg_id}`;
  //console.log(url);
  let response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${config.TTP_TOKEN}`,
    },
  });
  if (response.status == 200) {
    return [null, response.data.relay_password];
  } else if (response.status == 213) {
    let errMsg = {
      status: 213,
      data: "User not registered at TTP",
    };
    return [errMsg, null];
  } else {
    throw new Error(
      `Error while communicating with TTP - status: ${response.status}, data: ${response.data}`
    );
  }
}

module.exports = fetchUserCredentials;
