import "dotenv/config";
import app from "./app.js";
import { PORT } from "./conf.js";

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});