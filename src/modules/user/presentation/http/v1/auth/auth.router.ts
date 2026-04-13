import { mittAsync } from '@/modules/core/domain-base/events/domain-event.helper';
import { UserController } from '@/modules/user/presentation/controllers/user.controller';
import { CreateUserInteractor } from '@/modules/user/application/use-cases/interactors/create-user.interactor';
import { LoginEmailPasswordInteractor } from '@/modules/user/application/use-cases/interactors/login.interactor';
import { UserMapper } from '@/modules/user/infrastructure/mappers/user.mapper';
// import { UserPlanetScaleRepository } from '@/modules/user/infrastructure/mongo/user.implement.repository';

const userMapper = new UserMapper();
// const userRepo = new UserPlanetScaleRepository(userMapper, mittAsync());
// const createUserUseCases = new CreateUserInteractor(userRepo);
// const loginUserPasswordUseCases = new LoginEmailPasswordInteractor(userRepo);
// const userController = new UserController(createUserUseCases, loginUserPasswordUseCases);

// POST("/v1/auth/email-password", userController.loginEmailPassword)

// NEXTJS handler (req) {
/**
 *  const body = req.body
 *   userController.loginEmailPassword(body)
 * */
// }
//
