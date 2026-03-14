import { UPLOAD_DIR_VIDEO } from '@/constants/file.constant';
import { errorHandler } from '@/middlewares/error.middleware';
import bookmarksRouter from '@/routes/bookmarks.route';
import mediaRouter from '@/routes/media.route';
import oauthRouter from '@/routes/oauth.route';
import postsRouter from '@/routes/posts.route';
import searchRouter from '@/routes/search.route';
import staticRouter from '@/routes/static.route';
import usersRouter from '@/routes/users.route';
import databaseService from '@/services/database.service';
import { initUploadsFolder } from '@/utils/file.util';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

// import fakeData from '@/utils/fake-data';
// fakeData();

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

initUploadsFolder();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  })
);

app.use(express.json());

app.use('/users', usersRouter);
app.use('/oauth', oauthRouter);
app.use('/media', mediaRouter);
app.use('/static', staticRouter);
app.use('/posts', postsRouter);
app.use('/bookmarks', bookmarksRouter);
app.use('/search', searchRouter);

app.use('/static/videos', express.static(UPLOAD_DIR_VIDEO));

app.use(errorHandler);

app.listen(port, () => {
  databaseService.connect();
  console.log(`\x1b[32mServer is running on port ${port}\x1b[0m`);
});
