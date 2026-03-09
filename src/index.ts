import { errorHandler } from '@/middlewares/error.middleware';
import mediaRouter from '@/routes/media.route';
import oauthRouter from '@/routes/oauth.route';
import usersRouter from '@/routes/users.route';
import databaseService from '@/services/database.service';
import { initUploadsFolder } from '@/utils/file.util';
import express from 'express';

const app = express();
const port = 8080;

initUploadsFolder();

app.use(express.json());

app.use('/users', usersRouter);
app.use('/oauth', oauthRouter);
app.use('/media', mediaRouter);

app.use(errorHandler);

app.listen(port, () => {
  databaseService.connect();
  console.log(`Server is running on port ${port}`);
});
