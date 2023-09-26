const mongoose = require("mongoose");
const dbConnect = () => {
  try {
    const conn = mongoose.connect(
      "mongodb+srv://gugabukhrashvili1:Mu9iawka1122!@hpk-api.w7yzj6m.mongodb.net/?retryWrites=true&w=majority"
    );
    console.log("database connected");
  } catch (error) {
    console.log(error);
  }
};

module.exports = dbConnect;
