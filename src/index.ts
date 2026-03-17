import { UPLOAD_DIR_VIDEO } from '@/constants/file.constant';
import { errorHandler } from '@/middlewares/error.middleware';
import authRouter from '@/routes/auth.route';
import bookmarksRouter from '@/routes/bookmarks.route';
import conversationsRouter from '@/routes/conversations.route';
import followersRouter from '@/routes/followers.route';
import mediaRouter from '@/routes/media.route';
import oauthRouter from '@/routes/oauth.route';
import postsRouter from '@/routes/posts.route';
import searchRouter from '@/routes/search.route';
import staticRouter from '@/routes/static.route';
import usersRouter from '@/routes/users.route';
import databaseService from '@/services/database.service';
import SocketService from '@/services/socket.service';
import { getSwaggerDefinition, initUploadsFolder } from '@/utils/file.util';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// import fakeData from '@/utils/fake-data';
// fakeData();

dotenv.config();
const port = process.env.PORT || 8080;

const app = express();
const httpServer = createServer(app);

initUploadsFolder();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  })
);

app.use(express.json());

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/oauth', oauthRouter);
app.use('/media', mediaRouter);
app.use('/static', staticRouter);
app.use('/posts', postsRouter);
app.use('/bookmarks', bookmarksRouter);
app.use('/followers', followersRouter);
app.use('/search', searchRouter);
app.use('/conversations', conversationsRouter);

app.use('/static/videos', express.static(UPLOAD_DIR_VIDEO));

app.use(errorHandler);

const socket = new SocketService(httpServer);
socket.run();

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(
    swaggerJsdoc({
      definition: getSwaggerDefinition(),
      apis: ['./swagger/*.yaml']
    })
  )
);

httpServer.listen(port, () => {
  databaseService.connect();
  console.log(`\x1b[32mServer is running on port ${port}\x1b[0m`);
});
