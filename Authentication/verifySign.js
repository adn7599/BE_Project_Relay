const axios = require("axios").default;

const config = require("../configurations.json");

async function verifyUserSign(role, reg_id, hash, sign) {
  const url = `${config.TTP_ADDR}/relay/verifySign/`;

  //setting up data to be sent
  const data = {
    role,
    reg_id,
    hash,
    sign,
  };

  //setting the header
  const options = {
    headers: {
      Authorization: `Bearer ${config.TTP_TOKEN}`,
    },
  };

  //sending the request
  let response = await axios.post(url, data, options);

  //Checking the response
  if (response.status == 200) {
    //No error
    return [null, response.data.isVerified];
  } else if (response.status == 213) {
    //error 213 custom error. Invalid Signature format or User Not Found
    let errMsg = {
      status: 213,
      data: response.data.error,
    };
    return [errMsg, null];
  } else {
    //Unknown error
    throw new Error(
      `Error while communicating with TTP - status: ${response.status}, data: ${response.data}`
    );
  }
}

module.exports = verifyUserSign;
