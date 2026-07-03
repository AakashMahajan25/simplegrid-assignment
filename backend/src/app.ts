import express from "express";
import cors from "cors";        
import morgan from "morgan";    

const app = express();

const NODE_ENV = "dev";

app.use(cors({ origin: "*" }));
app.use(morgan(NODE_ENV));
app.use(express.json());

export default app;