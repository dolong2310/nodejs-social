/*
 * OAuth Repository
 * This file contains the OAuthRepository class which implements IOAuthRepository interface.
 * It provides methods to interact with the oauth data in the database.
 */

import { BaseRepository } from '@/modules/base/base.repository';
import { DatabaseService } from '@/providers/database/mongodb/database.service';

export interface IOAuthRepository {}

export class OAuthRepository extends BaseRepository implements IOAuthRepository {
  constructor(db: DatabaseService) {
    super(db);
  }
}
