import { errorHandler } from '@/middlewares/error.middleware';
import usersRouter from '@/routes/users.route';
import databaseService from '@/services/database.service';
import express from 'express';

const app = express();
const port = 3000;

app.use(express.json());

app.use('/users', usersRouter);

app.use(errorHandler);

app.listen(port, () => {
  databaseService.connect();
  console.log(`Server is running on port ${port}`);
});
