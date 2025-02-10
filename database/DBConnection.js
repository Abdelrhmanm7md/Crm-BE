import mongoose from "mongoose";

const dbConnection = () => {
  mongoose
    .connect(process.env.CONNECTIONSTRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((conn) => console.log(`Database successfully connected `))
    .catch((err) => console.error(`Database connection error: ${err.message}`));
};

export default dbConnection;
