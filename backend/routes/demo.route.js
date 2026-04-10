import express from 'express'

const demoRouter = express.Router();

demoRouter.post('/demo',demoControllerFunc);

export default demoRouter;