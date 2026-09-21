import { Router } from 'express';

const peopleRouter = Router();

peopleRouter.get('/', (_req, res) => {
  res.status(200).json({
    data: [],
    meta: { total: 0 },
  });
});

export default peopleRouter;
