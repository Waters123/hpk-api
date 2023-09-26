const mongoose = require("mongoose");
const validateMongoDbID = (id) => {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) throw new Error("This MongoDb Id is not valid or not found");
};

module.exports = validateMongoDbID;
