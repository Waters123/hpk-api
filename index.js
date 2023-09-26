const express = require("express");
const dbConnect = require("./config/dbConnect");
const app = express();
const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 4000;
const authRouter = require("./routes/authRoute");
const productRouter = require("./routes/productRoute");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const { notFound, errorHandler } = require("./middlewares/erroHandles");
const coockieParser = require("cookie-parser");
const cors = require("cors");
const cookieSession = require("cookie-session");
dbConnect();

app.use(morgan("dev"));
app.use(cors({ origin: "http://localhost:3011", credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(coockieParser());

app.use("/api/user", authRouter);
app.use("/api/product", productRouter);

app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`server is running at port ${PORT}`);
});
